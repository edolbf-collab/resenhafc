-- Resenha FC v0.3.0 — conferência pós-migração

-- 1. Devem existir 14 tabelas operacionais.
select
  count(*) as tabelas_encontradas,
  array_agg(table_name order by table_name) as tabelas
from information_schema.tables
where table_schema = 'public'
  and table_name = any(array[
    'profiles','groups','group_members','players','matches','match_attendance',
    'team_assignments','match_events','player_ratings','member_ratings','charges',
    'payments','expenses','announcements'
  ]);

-- 2. RLS deve estar ativo, inclusive em member_ratings.
select c.relname as tabela, c.relrowsecurity as rls_ativo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = any(array[
    'profiles','groups','group_members','players','matches','match_attendance',
    'team_assignments','match_events','player_ratings','member_ratings','charges',
    'payments','expenses','announcements'
  ])
order by c.relname;

-- 3. Coluna de escudo do grupo.
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'groups'
  and column_name = 'avatar_key';

-- 4. RPCs novas.
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = any(array[
    'create_group','join_group_by_code','update_group_settings','set_member_role',
    'transfer_group_ownership','update_my_player_profile','upsert_member_rating',
    'delete_scheduled_match','balance_match_teams','record_payment'
  ])
order by routine_name;

-- 5. Avaliações permanentes devem estar no Realtime.
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename = 'member_ratings';

-- 6. Políticas relevantes.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('member_ratings','player_ratings','group_members','matches','groups')
order by tablename, policyname;
