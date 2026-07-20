-- Resenha FC v0.3.0
-- Migração incremental para projetos que já executaram o esquema v0.2.x.
-- Execute uma única vez no SQL Editor do Supabase, como role postgres.

begin;

-- ---------------------------------------------------------------------------
-- Novos dados de identidade do grupo e posições
-- ---------------------------------------------------------------------------

alter table public.groups
  add column if not exists avatar_key text not null default 'badge-01';

alter table public.groups
  drop constraint if exists groups_avatar_key_check;

alter table public.groups
  add constraint groups_avatar_key_check
  check (avatar_key ~ '^badge-(0[1-9]|1[0-9]|20)$');

alter table public.players
  drop constraint if exists players_primary_position_check;

alter table public.players
  add constraint players_primary_position_check
  check (primary_position in ('Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante','Coringa'));

-- ---------------------------------------------------------------------------
-- Avaliações permanentes entre membros (independentes de uma partida)
-- ---------------------------------------------------------------------------

create table if not exists public.member_ratings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  rated_player_id uuid not null references public.players(id) on delete cascade,
  rater_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  score numeric(4,2) not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_id, rated_player_id, rater_user_id)
);

create index if not exists idx_member_ratings_group_player
  on public.member_ratings(group_id, rated_player_id);

alter table public.member_ratings enable row level security;

drop trigger if exists member_ratings_set_updated_at on public.member_ratings;
create trigger member_ratings_set_updated_at
before update on public.member_ratings
for each row execute function public.set_updated_at();

create or replace function public.validate_member_rating_player()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.players p
    where p.id = new.rated_player_id
      and p.group_id = new.group_id
      and p.active is true
  ) then
    raise exception 'Jogador avaliado não pertence ao grupo';
  end if;

  if exists (
    select 1 from public.players p
    where p.id = new.rated_player_id
      and p.user_id = auth.uid()
  ) then
    raise exception 'Não é permitido avaliar a si mesmo';
  end if;

  new.rater_user_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists member_ratings_validate_player on public.member_ratings;
create trigger member_ratings_validate_player
before insert or update on public.member_ratings
for each row execute function public.validate_member_rating_player();

-- ---------------------------------------------------------------------------
-- RPC: criação e personalização de grupo
-- ---------------------------------------------------------------------------

drop function if exists public.create_group(text);
drop function if exists public.create_group(text, text);

create function public.create_group(
  p_name text,
  p_avatar_key text default 'badge-01'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_player uuid;
  v_name text;
  v_profile_avatar text;
  v_avatar text := lower(trim(coalesce(p_avatar_key, 'badge-01')));
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if char_length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Nome do grupo inválido';
  end if;

  if v_avatar !~ '^badge-(0[1-9]|1[0-9]|20)$' then
    v_avatar := 'badge-01';
  end if;

  select
    coalesce(nullif(trim(p.name), ''), split_part(coalesce(auth.jwt()->>'email', 'Jogador'), '@', 1), 'Jogador'),
    p.avatar_url
  into v_name, v_profile_avatar
  from public.profiles p
  where p.id = auth.uid();

  if v_name is null then
    v_name := split_part(coalesce(auth.jwt()->>'email', 'Jogador'), '@', 1);
  end if;

  insert into public.profiles(id, name)
  values(auth.uid(), v_name)
  on conflict(id) do nothing;

  insert into public.groups(name, avatar_key, created_by)
  values(trim(p_name), v_avatar, auth.uid())
  returning id into v_group;

  insert into public.players(group_id, user_id, name, nickname, avatar_url)
  values(v_group, auth.uid(), v_name, split_part(v_name, ' ', 1), v_profile_avatar)
  returning id into v_player;

  insert into public.group_members(group_id, user_id, player_id, role)
  values(v_group, auth.uid(), v_player, 'owner');

  return v_group;
end;
$$;


-- Atualiza a função de ingresso para copiar nome e foto da conta Google.
drop function if exists public.join_group_by_code(text);
create function public.join_group_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_player uuid;
  v_name text;
  v_profile_avatar text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  select g.id into v_group
  from public.groups g
  where g.invite_code = upper(trim(coalesce(p_code, '')));

  if v_group is null then
    raise exception 'Código de convite não encontrado';
  end if;

  if exists (
    select 1 from public.group_members gm
    where gm.group_id = v_group and gm.user_id = auth.uid()
  ) then
    return v_group;
  end if;

  select
    coalesce(nullif(trim(p.name), ''), split_part(coalesce(auth.jwt()->>'email', 'Jogador'), '@', 1), 'Jogador'),
    p.avatar_url
  into v_name, v_profile_avatar
  from public.profiles p
  where p.id = auth.uid();

  if v_name is null then
    v_name := split_part(coalesce(auth.jwt()->>'email', 'Jogador'), '@', 1);
  end if;

  insert into public.profiles(id, name)
  values(auth.uid(), v_name)
  on conflict(id) do nothing;

  insert into public.players(group_id, user_id, name, nickname, avatar_url)
  values(v_group, auth.uid(), v_name, split_part(v_name, ' ', 1), v_profile_avatar)
  returning id into v_player;

  insert into public.group_members(group_id, user_id, player_id, role)
  values(v_group, auth.uid(), v_player, 'member');

  return v_group;
end;
$$;

update public.players p
set avatar_url = pr.avatar_url
from public.profiles pr
where p.user_id = pr.id
  and p.avatar_url is null
  and pr.avatar_url is not null;

create or replace function public.update_group_settings(
  p_group_id uuid,
  p_name text,
  p_avatar_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avatar text := lower(trim(coalesce(p_avatar_key, 'badge-01')));
begin
  if not public.can_manage_group(p_group_id) then
    raise exception 'Sem permissão para alterar o grupo';
  end if;

  if char_length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Nome do grupo inválido';
  end if;

  if v_avatar !~ '^badge-(0[1-9]|1[0-9]|20)$' then
    raise exception 'Avatar do grupo inválido';
  end if;

  update public.groups
  set name = trim(p_name), avatar_key = v_avatar
  where id = p_group_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: funções e transferência de propriedade
-- ---------------------------------------------------------------------------

create or replace function public.set_member_role(
  p_group_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_role text;
  v_target_role text;
  v_role text := lower(trim(coalesce(p_role, '')));
begin
  select gm.role into v_actor_role
  from public.group_members gm
  where gm.group_id = p_group_id and gm.user_id = auth.uid();

  select gm.role into v_target_role
  from public.group_members gm
  where gm.group_id = p_group_id and gm.user_id = p_user_id;

  if v_actor_role is null or v_target_role is null then
    raise exception 'Membro ou grupo não encontrado';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Sua própria função não pode ser alterada por esta opção';
  end if;

  if v_target_role = 'owner' then
    raise exception 'Use a transferência de propriedade para alterar o proprietário';
  end if;

  if v_actor_role = 'owner' then
    if v_role not in ('admin','organizer','treasurer','member') then
      raise exception 'Função inválida';
    end if;
  elsif v_actor_role = 'admin' then
    if v_target_role = 'admin' then
      raise exception 'Somente o proprietário pode alterar outro administrador';
    end if;
    if v_role not in ('organizer','treasurer','member') then
      raise exception 'O administrador pode delegar organizador, tesoureiro ou membro';
    end if;
  else
    raise exception 'Sem permissão para delegar funções';
  end if;

  update public.group_members
  set role = v_role
  where group_id = p_group_id and user_id = p_user_id;
end;
$$;

create or replace function public.transfer_group_ownership(
  p_group_id uuid,
  p_new_owner_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_group_role(p_group_id, array['owner']) then
    raise exception 'Somente o proprietário pode transferir o grupo';
  end if;

  if p_new_owner_user_id = auth.uid() then
    return;
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = p_new_owner_user_id
  ) then
    raise exception 'O novo proprietário precisa ser membro do grupo';
  end if;

  update public.group_members
  set role = 'admin'
  where group_id = p_group_id and role = 'owner';

  update public.group_members
  set role = 'owner'
  where group_id = p_group_id and user_id = p_new_owner_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: perfil esportivo do próprio usuário
-- ---------------------------------------------------------------------------

create or replace function public.update_my_player_profile(
  p_group_id uuid,
  p_nickname text,
  p_primary_position text,
  p_secondary_position text default '',
  p_goalkeeper boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_position text := trim(coalesce(p_primary_position, ''));
  v_secondary text := trim(coalesce(p_secondary_position, ''));
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Você não pertence a este grupo';
  end if;

  if v_position not in ('Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante','Coringa') then
    raise exception 'Posição principal inválida';
  end if;

  if v_secondary <> '' and v_secondary not in ('Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante','Coringa') then
    raise exception 'Posição secundária inválida';
  end if;

  update public.players p
  set nickname = nullif(trim(coalesce(p_nickname, '')), ''),
      primary_position = v_position,
      secondary_position = v_secondary,
      goalkeeper = coalesce(p_goalkeeper, false) or v_position = 'Goleiro'
  where p.group_id = p_group_id
    and p.user_id = auth.uid();

  if not found then
    raise exception 'Perfil de jogador não encontrado';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: avaliação privada entre membros
-- ---------------------------------------------------------------------------

create or replace function public.upsert_member_rating(
  p_group_id uuid,
  p_rated_player_id uuid,
  p_score numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Você não pertence a este grupo';
  end if;

  if p_score is null or p_score < 1 or p_score > 10 then
    raise exception 'A nota deve estar entre 1 e 10';
  end if;

  if not exists (
    select 1 from public.players p
    where p.id = p_rated_player_id
      and p.group_id = p_group_id
      and p.active is true
  ) then
    raise exception 'Jogador não encontrado';
  end if;

  if public.owns_player(p_rated_player_id) then
    raise exception 'Não é permitido avaliar a si mesmo';
  end if;

  insert into public.member_ratings(group_id, rated_player_id, rater_user_id, score)
  values(p_group_id, p_rated_player_id, auth.uid(), p_score)
  on conflict(group_id, rated_player_id, rater_user_id)
  do update set score = excluded.score, updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: exclusão de partida somente antes do horário marcado
-- ---------------------------------------------------------------------------

create or replace function public.delete_scheduled_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_starts_at timestamptz;
begin
  select m.group_id, m.starts_at into v_group, v_starts_at
  from public.matches m
  where m.id = p_match_id;

  if v_group is null then
    raise exception 'Jogo não encontrado';
  end if;

  if not public.can_manage_matches(v_group) then
    raise exception 'Sem permissão para excluir o jogo';
  end if;

  if v_starts_at <= now() then
    raise exception 'Jogos já iniciados permanecem no histórico e não podem ser apagados';
  end if;

  delete from public.matches where id = p_match_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: separação de times no servidor sem expor as notas aos organizadores
-- ---------------------------------------------------------------------------

create or replace function public.balance_match_teams(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_players_per_team integer;
  v_player_count integer;
  v_team_count integer;
  v_team_no integer;
  v_team_name text;
  v_slot integer;
  rec record;
begin
  select m.group_id, m.players_per_team
  into v_group, v_players_per_team
  from public.matches m
  where m.id = p_match_id;

  if v_group is null then
    raise exception 'Jogo não encontrado';
  end if;

  if not public.can_manage_matches(v_group) then
    raise exception 'Sem permissão para formar os times';
  end if;

  select count(*) into v_player_count
  from public.match_attendance a
  join public.players p on p.id = a.player_id
  where a.match_id = p_match_id
    and a.status = 'confirmed'
    and p.active is true;

  if v_player_count < 2 then
    raise exception 'São necessários pelo menos dois jogadores confirmados';
  end if;

  v_team_count := greatest(2, ceil(v_player_count::numeric / greatest(v_players_per_team, 2))::integer);

  create temporary table tmp_resenha_teams (
    team_no integer primary key,
    team_name text not null,
    player_count integer not null default 0,
    total_score numeric not null default 0,
    goalkeepers integer not null default 0
  ) on commit drop;

  create temporary table tmp_resenha_assignments (
    player_id uuid primary key,
    team_no integer not null,
    primary_position text,
    score numeric not null
  ) on commit drop;

  for v_team_no in 1..v_team_count loop
    v_team_name := case v_team_no
      when 1 then 'Time Verde'
      when 2 then 'Time Azul'
      when 3 then 'Time Laranja'
      when 4 then 'Time Branco'
      when 5 then 'Time Preto'
      when 6 then 'Time Amarelo'
      else 'Time ' || v_team_no::text
    end;
    insert into tmp_resenha_teams(team_no, team_name) values(v_team_no, v_team_name);
  end loop;

  for rec in
    select
      p.id as player_id,
      p.primary_position,
      p.goalkeeper,
      coalesce(avg(mr.score), p.skill * 2, 7)::numeric(6,3) as balance_score
    from public.match_attendance a
    join public.players p on p.id = a.player_id
    left join public.member_ratings mr
      on mr.group_id = p.group_id and mr.rated_player_id = p.id
    where a.match_id = p_match_id
      and a.status = 'confirmed'
      and p.active is true
    group by p.id, p.primary_position, p.goalkeeper, p.skill, p.name
    order by p.goalkeeper desc, balance_score desc, p.name
  loop
    select t.team_no into v_team_no
    from tmp_resenha_teams t
    order by
      case when rec.goalkeeper then t.goalkeepers else 0 end asc,
      t.player_count asc,
      (select count(*) from tmp_resenha_assignments a
       where a.team_no = t.team_no and a.primary_position = rec.primary_position) asc,
      t.total_score asc,
      t.team_no asc
    limit 1;

    insert into tmp_resenha_assignments(player_id, team_no, primary_position, score)
    values(rec.player_id, v_team_no, rec.primary_position, rec.balance_score);

    update tmp_resenha_teams
    set player_count = player_count + 1,
        total_score = total_score + rec.balance_score,
        goalkeepers = goalkeepers + case when rec.goalkeeper then 1 else 0 end
    where team_no = v_team_no;
  end loop;

  delete from public.team_assignments where match_id = p_match_id;

  insert into public.team_assignments(group_id, match_id, player_id, team_name, slot)
  select
    v_group,
    p_match_id,
    a.player_id,
    t.team_name,
    (row_number() over(partition by a.team_no order by a.score desc, a.player_id))::integer
  from tmp_resenha_assignments a
  join tmp_resenha_teams t on t.team_no = a.team_no;
end;
$$;

-- ---------------------------------------------------------------------------
-- Políticas de privacidade e operações sensíveis
-- ---------------------------------------------------------------------------

drop policy if exists "member ratings private read" on public.member_ratings;
drop policy if exists "member ratings own insert" on public.member_ratings;
drop policy if exists "member ratings own update" on public.member_ratings;
drop policy if exists "member ratings own delete" on public.member_ratings;

create policy "member ratings private read"
on public.member_ratings for select to authenticated
using (rater_user_id = auth.uid() or public.can_manage_group(group_id));

create policy "member ratings own insert"
on public.member_ratings for insert to authenticated
with check (
  rater_user_id = auth.uid()
  and public.is_group_member(group_id)
  and not public.owns_player(rated_player_id)
);

create policy "member ratings own update"
on public.member_ratings for update to authenticated
using (rater_user_id = auth.uid())
with check (
  rater_user_id = auth.uid()
  and public.is_group_member(group_id)
  and not public.owns_player(rated_player_id)
);

create policy "member ratings own delete"
on public.member_ratings for delete to authenticated
using (rater_user_id = auth.uid());

-- Avaliações antigas de partidas também deixam de ser públicas ao grupo.
drop policy if exists "ratings group read" on public.player_ratings;
drop policy if exists "ratings private read" on public.player_ratings;
create policy "ratings private read"
on public.player_ratings for select to authenticated
using (rater_user_id = auth.uid() or public.can_manage_group(group_id));

-- Alterações de função, grupo e exclusão de jogo passam exclusivamente pelas RPCs.
drop policy if exists "members managers update" on public.group_members;
drop policy if exists "groups managers update" on public.groups;
drop policy if exists "matches organizers delete" on public.matches;

-- ---------------------------------------------------------------------------
-- Data API, RPC e Realtime
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.member_ratings to authenticated;

revoke all on function public.create_group(text, text) from public;
revoke all on function public.join_group_by_code(text) from public;
revoke all on function public.update_group_settings(uuid, text, text) from public;
revoke all on function public.set_member_role(uuid, uuid, text) from public;
revoke all on function public.transfer_group_ownership(uuid, uuid) from public;
revoke all on function public.update_my_player_profile(uuid, text, text, text, boolean) from public;
revoke all on function public.upsert_member_rating(uuid, uuid, numeric) from public;
revoke all on function public.delete_scheduled_match(uuid) from public;
revoke all on function public.balance_match_teams(uuid) from public;

grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;
grant execute on function public.update_group_settings(uuid, text, text) to authenticated;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.transfer_group_ownership(uuid, uuid) to authenticated;
grant execute on function public.update_my_player_profile(uuid, text, text, text, boolean) to authenticated;
grant execute on function public.upsert_member_rating(uuid, uuid, numeric) to authenticated;
grant execute on function public.delete_scheduled_match(uuid) to authenticated;
grant execute on function public.balance_match_teams(uuid) to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.member_ratings;
  exception
    when duplicate_object then null;
  end;
end $$;

commit;
