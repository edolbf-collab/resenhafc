(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = () => crypto.randomUUID?.() || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); });
  const nowIso = () => new Date().toISOString();
  const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
  const shortDate = (iso) => new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const monthLabel = (iso) => new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(iso));
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?";
  const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n)));
  const sessionGet = (key) => { try { return sessionStorage.getItem(key); } catch { return null; } };
  const sessionSet = (key, value) => { try { sessionStorage.setItem(key, value); } catch { /* sessão indisponível em origem local */ } };
  const sessionRemove = (key) => { try { sessionStorage.removeItem(key); } catch { /* sessão indisponível em origem local */ } };
  const oauthErrorFromLocation = () => {
    const sources = [new URLSearchParams(location.search), new URLSearchParams(location.hash.replace(/^#/, ""))];
    for (const params of sources) {
      const message = params.get("error_description") || params.get("error");
      if (message) return String(message).replace(/\+/g, " ");
    }
    return "";
  };

  const sample = () => {
    const upcoming = new Date();
    upcoming.setDate(upcoming.getDate() + ((4 - upcoming.getDay() + 7) % 7 || 7));
    upcoming.setHours(20, 0, 0, 0);
    const past = new Date(); past.setDate(past.getDate() - 7); past.setHours(20,0,0,0);
    const players = [
      ["p1","Edo Batista",4.3,"Meia",false,true], ["p2","Bruno Lima",4.6,"Atacante",false,false],
      ["p3","Carlos Mendes",4.0,"Zagueiro",false,false], ["p4","Diego Alves",4.5,"Goleiro",true,false],
      ["p5","Fabio Rocha",3.8,"Lateral",false,false], ["p6","Gustavo Nunes",4.2,"Atacante",false,false],
      ["p7","Henrique Souza",3.9,"Meia",false,false], ["p8","Igor Costa",4.1,"Zagueiro",false,false],
      ["p9","João Vitor",3.7,"Lateral",false,false], ["p10","Lucas Prado",4.4,"Meia",false,false],
      ["p11","Marcos Silva",3.6,"Atacante",false,false], ["p12","Rafael Dias",4.0,"Goleiro",true,false],
      ["p13","Sérgio Lopes",3.5,"Zagueiro",false,false], ["p14","Tiago Reis",4.2,"Meia",false,false]
    ].map(([id,name,skill,position,goalkeeper,isSelf], i) => ({
      id, group_id:"g1", user_id:isSelf?"demo-user":null, name, nickname:name.split(" ")[0], skill, fair_play:4.4-(i%3)*.2,
      conditioning:3.8+(i%4)*.2, primary_position:position, secondary_position:"", goalkeeper, active:true,
      games: 18 - (i%6), wins: 10 - (i%4), goals: position === "Atacante" ? 9-(i%4) : position === "Meia" ? 5-(i%3) : 1+(i%2), assists: position === "Meia" ? 8-(i%4) : 2+(i%3)
    }));
    return {
      profile: { id:"demo-user", name:"Edo Batista", email:"demo@resenhafc.app" },
      groups: [{ id:"g1", name:"Pelada de Quinta", role:"owner", invite_code:"QUINTA26", default_players_per_team:6, monthly_fee:65 }],
      currentGroupId:"g1",
      players,
      matches: [
        { id:"m1", group_id:"g1", title:"Pelada semanal", starts_at:upcoming.toISOString(), location:"Arena do Bairro · Quadra 2", max_players:12, players_per_team:6, status:"scheduled", bbq_enabled:true, bbq_price:25, notes:"Chegar 15 minutos antes.", created_at:nowIso() },
        { id:"m0", group_id:"g1", title:"Pelada semanal", starts_at:past.toISOString(), location:"Arena do Bairro · Quadra 1", max_players:12, players_per_team:6, status:"finished", bbq_enabled:true, bbq_price:25, notes:"", created_at:past.toISOString() }
      ],
      attendance: players.slice(0,12).map((p,i) => ({ id:`a${i}`, match_id:"m1", player_id:p.id, status:i<10?"confirmed":i===10?"maybe":"waitlist", bbq:i<7, bbq_guests:i===2?1:0, responded_at:nowIso() })),
      assignments: [],
      charges: players.slice(0,12).map((p,i) => ({ id:`c${i}`, group_id:"g1", player_id:p.id, description:`Mensalidade · ${monthLabel(nowIso())}`, amount:65, due_date:new Date(new Date().getFullYear(),new Date().getMonth(),10).toISOString().slice(0,10), status:i<9?"paid":"open" })),
      payments: players.slice(0,9).map((p,i) => ({ id:`pay${i}`, group_id:"g1", player_id:p.id, charge_id:`c${i}`, amount:65, paid_at:new Date(Date.now()-i*86400000).toISOString(), method:"pix" })),
      expenses: [
        { id:"e1", group_id:"g1", description:"Aluguel da quadra", amount:520, occurred_at:new Date().toISOString(), category:"quadra" },
        { id:"e2", group_id:"g1", description:"Bola nova", amount:139.9, occurred_at:new Date(Date.now()-5*86400000).toISOString(), category:"material" }
      ],
      ratings: players.slice(1,8).map((p,i) => ({ id:`r${i}`, match_id:"m0", rated_player_id:p.id, rater_user_id:"demo-rater", technical:4+(i%2)*.5, fair_play:4.5, conditioning:3.5+(i%3)*.5 })),
      match_events: [
        { id:"ev1", match_id:"m0", type:"goal", player_id:"p2", assist_player_id:"p1", minute:8 },
        { id:"ev2", match_id:"m0", type:"goal", player_id:"p6", assist_player_id:"p7", minute:16 }
      ],
      announcements: [{ id:"n1", group_id:"g1", title:"Novo horário", body:"A partir deste mês a quadra começa às 20h. Confirme presença até quarta-feira às 18h.", created_at:nowIso() }]
    };
  };

  class LocalRepository {
    constructor() { this.key = "resenha-fc-state-v1"; this.state = this.load(); }
    load() { try { return JSON.parse(localStorage.getItem(this.key)) || sample(); } catch { return sample(); } }
    save() { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch (error) { console.warn("Armazenamento local indisponível; dados mantidos apenas nesta sessão.", error); } }
    async init() { return this.state; }
    async reset() { this.state = sample(); this.save(); return this.state; }
    async mutate(collection, record, mode = "upsert") {
      const list = this.state[collection] || [];
      if (mode === "delete") this.state[collection] = list.filter(x => x.id !== record.id);
      else {
        const index = list.findIndex(x => x.id === record.id);
        if (index >= 0) list[index] = { ...list[index], ...record };
        else list.push(record);
        this.state[collection] = list;
      }
      this.save(); return record;
    }
    async setProfile(profile) { this.state.profile = { ...this.state.profile, ...profile }; this.save(); }
    async replaceAssignments(matchId, records) {
      this.state.assignments = this.state.assignments.filter(item => item.match_id !== matchId).concat(records);
      this.save();
      return records;
    }
    async recordPayment(record, charge = null) {
      await this.mutate("payments", record);
      if (charge) await this.mutate("charges", { ...charge, status:"paid" });
      return record;
    }
  }

  class SupabaseRepository {
    constructor(config) {
      this.config = config;
      this.client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      this.state = { profile:null, groups:[], currentGroupId:null, players:[], matches:[], attendance:[], assignments:[], charges:[], payments:[], expenses:[], ratings:[], match_events:[], announcements:[] };
      this.channel = null;
      this.subscribedGroupId = null;
      this.reloadTimer = null;
    }
    async session() { return (await this.client.auth.getSession()).data.session; }
    async signIn(email, password) { return this.client.auth.signInWithPassword({ email, password }); }
    async signInWithGoogle() {
      const redirectTo = this.config.authRedirectUrl || new URL(".", window.location.href).href;
      return this.client.auth.signInWithOAuth({
        provider:"google",
        options:{
          redirectTo,
          queryParams:{ prompt:"select_account" }
        }
      });
    }
    async signUp(email, password, name) {
      return this.client.auth.signUp({
        email,
        password,
        options:{
          data:{ name },
          emailRedirectTo:this.config.authRedirectUrl || window.location.origin
        }
      });
    }
    async signOut() { await this.client.auth.signOut(); }
    async init() {
      const session = await this.session();
      if (!session) return null;
      const user = session.user;
      const meta = user.user_metadata || {};
      const fallbackEmail = user.email || "";
      const displayName = meta.name || meta.full_name || [meta.given_name, meta.family_name].filter(Boolean).join(" ") || fallbackEmail.split("@")[0] || "Usuário";
      this.state.profile = {
        id:user.id,
        email:fallbackEmail,
        name:displayName,
        avatar_url:meta.avatar_url || meta.picture || ""
      };
      const { data: memberships, error } = await this.client.from("group_members").select("role, player_id, groups(id,name,invite_code,default_players_per_team,monthly_fee)").eq("user_id", user.id);
      if (error) throw error;
      this.state.groups = (memberships || []).map(m => ({ ...m.groups, role:m.role, player_id:m.player_id }));
      this.state.currentGroupId = this.state.groups[0]?.id || null;
      if (this.state.currentGroupId) await this.loadGroup(this.state.currentGroupId);
      return this.state;
    }
    async loadGroup(groupId, options = {}) {
      const { subscribe = true } = options;
      this.state.currentGroupId = groupId;
      const tables = ["players","matches","charges","payments","expenses","announcements"];
      const results = await Promise.all(tables.map(table => this.client.from(table).select("*").eq("group_id", groupId)));
      results.forEach((res,i) => { if (res.error) throw res.error; this.state[tables[i]] = res.data || []; });
      const [attendance, assignments, ratings, events] = await Promise.all([
        this.client.from("match_attendance").select("*").eq("group_id", groupId),
        this.client.from("team_assignments").select("*").eq("group_id", groupId),
        this.client.from("player_ratings").select("*").eq("group_id", groupId),
        this.client.from("match_events").select("*").eq("group_id", groupId)
      ]);
      [["attendance",attendance],["assignments",assignments],["ratings",ratings],["match_events",events]].forEach(([key,res]) => {
        if(res.error) throw res.error;
        this.state[key]=res.data||[];
      });
      if (subscribe) this.subscribe(groupId);
      return this.state;
    }
    queueReload(groupId) {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = setTimeout(async () => {
        if (this.state.currentGroupId !== groupId) return;
        try {
          await this.loadGroup(groupId, { subscribe:false });
          App.render();
        } catch (error) {
          console.error("Falha ao sincronizar alteração em tempo real.", error);
        }
      }, 180);
    }
    subscribe(groupId) {
      if (this.channel && this.subscribedGroupId === groupId) return;
      if (this.channel) this.client.removeChannel(this.channel);
      const onChange = () => this.queueReload(groupId);
      let channel = this.client.channel(`group-${groupId}`);
      channel = channel.on("postgres_changes", { event:"*", schema:"public", table:"groups", filter:`id=eq.${groupId}` }, onChange);
      ["group_members","players","matches","match_attendance","team_assignments","player_ratings","match_events","charges","payments","expenses","announcements"].forEach(table => {
        channel = channel.on("postgres_changes", { event:"*", schema:"public", table, filter:`group_id=eq.${groupId}` }, onChange);
      });
      this.channel = channel.subscribe();
      this.subscribedGroupId = groupId;
    }
    async mutate(collection, record, mode = "upsert") {
      const tableMap = { attendance:"match_attendance", assignments:"team_assignments", ratings:"player_ratings" };
      const table = tableMap[collection] || collection;
      if (mode === "delete") {
        const { error } = await this.client.from(table).delete().eq("id",record.id);
        if(error) throw error;
      } else {
        const options = collection === "ratings" ? { onConflict:"match_id,rated_player_id,rater_user_id" } : undefined;
        const { error } = await this.client.from(table).upsert(record, options);
        if(error) throw error;
      }
      return this.loadGroup(this.state.currentGroupId, { subscribe:false });
    }
    async replaceAssignments(matchId, records) {
      const { error } = await this.client.rpc("replace_match_assignments", {
        p_match_id:matchId,
        p_assignments:records
      });
      if (error) throw error;
      return this.loadGroup(this.state.currentGroupId, { subscribe:false });
    }
    async recordPayment(record, charge = null) {
      const { error } = await this.client.rpc("record_payment", {
        p_group_id:record.group_id,
        p_player_id:record.player_id,
        p_charge_id:charge?.id || null,
        p_description:record.description,
        p_amount:record.amount,
        p_method:record.method || "manual",
        p_paid_at:record.paid_at || new Date().toISOString()
      });
      if (error) throw error;
      return this.loadGroup(this.state.currentGroupId, { subscribe:false });
    }
    async setProfile(profile) {
      const name = String(profile.name || "").trim();
      const { data, error } = await this.client.rpc("update_my_profile", { p_name:name });
      if (error) throw error;
      const userUpdate = await this.client.auth.updateUser({ data:{ name:data || name } });
      if (userUpdate.error) console.warn("Perfil salvo no banco, mas os metadados da sessão não foram atualizados.", userUpdate.error);
      this.state.profile = { ...this.state.profile, name:data || name };
      if (this.state.currentGroupId) await this.loadGroup(this.state.currentGroupId, { subscribe:false });
      return this.state.profile;
    }
    async createGroup(name) {
      const { data, error } = await this.client.rpc("create_group", { p_name:name }); if(error) throw error;
      await this.init();
      if (data) await this.loadGroup(data);
      return data;
    }
    async joinGroup(code) {
      const { data, error } = await this.client.rpc("join_group_by_code", { p_code:code.toUpperCase() }); if(error) throw error;
      await this.init();
      if (data) await this.loadGroup(data);
      return data;
    }
  }

  const App = {
    route: "home",
    repo: null,
    state: null,
    cloud: false,
    selectedMatchId: null,

    async init() {
      this.bindGlobal();
      const config = window.RESENHA_CONFIG || {};
      const cloudConfigured = Boolean(config.supabaseUrl && config.supabasePublishableKey && sessionGet("resenha-demo") !== "1");
      if (cloudConfigured && !window.supabase) {
        return this.renderBackendError(window.RESENHA_CLOUD_LOAD_ERROR || new Error("Não foi possível carregar o cliente Supabase."));
      }
      const hasCloud = Boolean(cloudConfigured && window.supabase);
      this.cloud = hasCloud;
      this.repo = hasCloud ? new SupabaseRepository(config) : new LocalRepository();
      try {
        this.state = await this.repo.init();
        if (hasCloud && !this.state) return this.renderAuth();
        const launchAction = this.prepareLaunchIntent();
        this.render();
        if (launchAction === "rsvp") setTimeout(() => this.openRsvp(this.nextMatch()?.id), 0);
        this.registerServiceWorker();
      } catch (error) {
        console.error(error);
        if (hasCloud) return this.renderBackendError(error);
        this.toast(error.message || "Falha ao iniciar o aplicativo.", true);
        this.repo = new LocalRepository();
        this.state = await this.repo.init();
        this.render();
      }
    },

    bindGlobal() {
      document.addEventListener("click", (event) => {
        const nav = event.target.closest("[data-route]");
        if (nav) { this.route = nav.dataset.route; this.render(); window.scrollTo({top:0,behavior:"smooth"}); }
        const action = event.target.closest("[data-action]");
        if (action) this.handleAction(action.dataset.action, action.dataset);
      });
      $("#groupButton")?.addEventListener("click", () => this.openGroupModal());
      $("#profileButton")?.addEventListener("click", () => this.openProfileModal());
    },

    registerServiceWorker() {
      if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("service-worker.js").catch(console.warn);
    },

    prepareLaunchIntent() {
      const params = new URLSearchParams(location.search);
      const page = params.get("page");
      if (["home","matches","teams","finance","ranking","more"].includes(page)) this.route = page;
      const action = params.get("action");
      if ((page || action) && history.replaceState) history.replaceState({}, document.title, `${location.pathname}${location.hash}`);
      return action;
    },

    currentGroup() { return this.state.groups.find(g => g.id === this.state.currentGroupId) || this.state.groups[0]; },
    currentRole() { return this.currentGroup()?.role || "member"; },
    canManageGroup() { return ["owner","admin"].includes(this.currentRole()); },
    canManageMatches() { return ["owner","admin","organizer"].includes(this.currentRole()); },
    canManageFinance() { return ["owner","admin","treasurer"].includes(this.currentRole()); },
    activePlayers() { return this.state.players.filter(p => p.group_id === this.state.currentGroupId && p.active !== false); },
    upcomingMatches() { return this.state.matches.filter(m => m.group_id === this.state.currentGroupId && new Date(m.starts_at) >= new Date() && m.status !== "cancelled").sort((a,b) => new Date(a.starts_at)-new Date(b.starts_at)); },
    pastMatches() { return this.state.matches.filter(m => m.group_id === this.state.currentGroupId && (new Date(m.starts_at) < new Date() || m.status === "finished")).sort((a,b) => new Date(b.starts_at)-new Date(a.starts_at)); },
    nextMatch() { return this.upcomingMatches()[0] || null; },
    myPlayer() {
      const group = this.currentGroup();
      return this.state.players.find(p => p.id === group?.player_id) || this.state.players.find(p => p.user_id === this.state.profile?.id) || this.state.players[0];
    },
    attendanceFor(matchId) { return this.state.attendance.filter(a => a.match_id === matchId); },
    confirmedFor(matchId) { return this.attendanceFor(matchId).filter(a => a.status === "confirmed"); },
    player(id) { return this.state.players.find(p => p.id === id); },
    effectiveSkill(player) {
      const ratings = this.state.ratings.filter(r => r.rated_player_id === player.id);
      if (!ratings.length) return Number(player.skill || 0);
      return ratings.reduce((sum,r) => sum + Number(r.technical || 0), 0) / ratings.length;
    },

    render() {
      if (!this.state) return;
      const group = this.currentGroup();
      $("#groupName").textContent = group?.name || "Crie ou entre em um grupo";
      $("#syncLabel").textContent = this.cloud ? "Sincronizado na nuvem" : "Modo demonstração · dados neste aparelho";
      $("#profileButton").textContent = initials(this.state.profile?.name || "Usuário");
      $$(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.route === this.route));
      if (!group) {
        $("#mainContent").innerHTML = `<div class="page-head"><div><h1>Seu grupo</h1><p>Comece criando uma pelada ou entrando pelo código de convite.</p></div></div><section class="card empty"><strong>Nenhum grupo vinculado</strong>O grupo reúne jogadores, jogos, confirmações, times, caixa e estatísticas.<div class="actions" style="justify-content:center"><button class="btn btn-primary" data-action="group">Criar ou entrar</button></div></section>`;
        return;
      }
      const pages = { home:()=>this.homePage(), matches:()=>this.matchesPage(), teams:()=>this.teamsPage(), finance:()=>this.financePage(), ranking:()=>this.rankingPage(), more:()=>this.morePage() };
      $("#mainContent").innerHTML = (pages[this.route] || pages.home)();
    },

    homePage() {
      const match = this.nextMatch();
      const attendance = match ? this.attendanceFor(match.id) : [];
      const confirmed = attendance.filter(a=>a.status==="confirmed");
      const bbq = attendance.filter(a=>a.bbq).reduce((sum,a)=>sum+1+Number(a.bbq_guests||0),0);
      const openCharges = this.state.charges.filter(c=>c.group_id===this.state.currentGroupId && c.status!=="paid");
      const incoming = this.state.payments.filter(p=>p.group_id===this.state.currentGroupId).reduce((s,p)=>s+Number(p.amount),0);
      const outgoing = this.state.expenses.filter(e=>e.group_id===this.state.currentGroupId).reduce((s,e)=>s+Number(e.amount),0);
      const notice = this.state.announcements.filter(n=>n.group_id===this.state.currentGroupId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
      return `
        <div class="page-head"><div><h1>Próxima resenha</h1><p>Organização do grupo em um só lugar.</p></div>${this.canManageMatches()?'<button class="btn btn-primary btn-small" data-action="new-match">+ Jogo</button>':''}</div>
        ${match ? `
        <section class="card hero-card">
          <span class="eyebrow">● ${escapeHtml(shortDate(match.starts_at))}</span>
          <h2>${escapeHtml(match.title)}</h2><p>${escapeHtml(match.location)}</p>
          <div class="hero-grid">
            <div class="hero-stat"><strong>${confirmed.length}/${match.max_players}</strong><small>confirmados</small></div>
            <div class="hero-stat"><strong>${bbq}</strong><small>no churrasco</small></div>
          </div>
          <div class="actions"><button class="btn btn-ghost" data-action="rsvp" data-id="${match.id}">Confirmar presença</button><button class="btn btn-secondary" data-action="open-match" data-id="${match.id}">Ver detalhes</button></div>
        </section>` : `<section class="card empty"><strong>Nenhum jogo agendado</strong>Crie a próxima partida e envie o código do grupo aos amigos.${this.canManageMatches()?'<div class="actions" style="justify-content:center"><button class="btn btn-primary" data-action="new-match">Criar jogo</button></div>':''}</section>`}
        ${notice ? `<div class="section-title"><h2>Aviso do grupo</h2></div><div class="notice"><strong>${escapeHtml(notice.title)}</strong><br>${escapeHtml(notice.body)}</div>`:""}
        <div class="section-title"><h2>Acesso rápido</h2></div>
        <div class="quick-grid">
          <button class="quick-card" data-action="rsvp" data-id="${match?.id||""}"><span>✓</span><strong>Presença</strong><small>Confirme jogo e churrasco.</small></button>
          <button class="quick-card" data-route="teams"><span>⇄</span><strong>Sortear times</strong><small>Equilíbrio técnico e por posição.</small></button>
          <button class="quick-card" data-route="finance"><span>R$</span><strong>Mensalidades</strong><small>${openCharges.length} pendência(s) no grupo.</small></button>
          <button class="quick-card" data-action="rate-player"><span>★</span><strong>Avaliar</strong><small>Notas do último jogo.</small></button>
        </div>
        <div class="section-title"><h2>Resumo do grupo</h2></div>
        <div class="metrics">
          <div class="card metric"><strong>${this.activePlayers().length}</strong><small>jogadores</small></div>
          <div class="card metric"><strong>${this.pastMatches().length}</strong><small>jogos</small></div>
          <div class="card metric"><strong class="money">${money(incoming-outgoing)}</strong><small>saldo</small></div>
        </div>
      `;
    },

    matchesPage() {
      const upcoming = this.upcomingMatches(); const past = this.pastMatches();
      const cards = (list) => list.length ? list.map(m=>this.matchCard(m)).join("") : `<div class="card empty"><strong>Nenhum registro</strong>Os jogos aparecerão aqui.</div>`;
      return `<div class="page-head"><div><h1>Jogos</h1><p>Agenda, confirmações e resenha.</p></div>${this.canManageMatches()?'<button class="btn btn-primary btn-small" data-action="new-match">+ Novo</button>':''}</div>
        <div class="section-title"><h2>Próximos</h2></div><div class="list">${cards(upcoming)}</div>
        <div class="section-title"><h2>Histórico</h2></div><div class="list">${cards(past)}</div>`;
    },

    matchCard(match) {
      const date = new Date(match.starts_at); const att = this.attendanceFor(match.id); const conf = att.filter(a=>a.status==="confirmed");
      return `<article class="card match-card">
        <div class="match-top"><div class="match-date"><small>${date.toLocaleDateString("pt-BR",{month:"short"}).replace(".","")}</small><strong>${String(date.getDate()).padStart(2,"0")}</strong></div>
        <div class="match-info"><h3>${escapeHtml(match.title)}</h3><p>${escapeHtml(shortDate(match.starts_at))}<br>${escapeHtml(match.location)}</p></div>
        <span class="status-pill ${match.status==="finished"?"status-confirmed":"status-maybe"}">${match.status==="finished"?"Finalizado":"Agendado"}</span></div>
        <div class="match-footer"><div class="avatar-stack">${conf.slice(0,5).map(a=>`<span>${initials(this.player(a.player_id)?.name)}</span>`).join("")}${conf.length>5?`<span>+${conf.length-5}</span>`:""}</div><button class="btn btn-ghost btn-small" data-action="open-match" data-id="${match.id}">${conf.length}/${match.max_players} jogadores</button></div>
      </article>`;
    },

    teamsPage() {
      const match = this.nextMatch() || this.pastMatches()[0];
      if (!match) return `<div class="page-head"><div><h1>Times</h1><p>Sorteio equilibrado dos confirmados.</p></div></div><div class="card empty"><strong>Sem jogo disponível</strong>Crie um jogo antes de formar os times.</div>`;
      const confirmed = this.confirmedFor(match.id).map(a=>this.player(a.player_id)).filter(Boolean);
      const assignments = this.state.assignments.filter(a=>a.match_id===match.id);
      const teams = [...new Set(assignments.map(a=>a.team_name))];
      return `<div class="page-head"><div><h1>Times</h1><p>${escapeHtml(match.title)} · ${confirmed.length} confirmados</p></div>${this.canManageMatches()?`<button class="btn btn-primary btn-small" data-action="draw-teams" data-id="${match.id}">Sortear</button>`:''}</div>
        <div class="notice">O sorteio considera nota técnica, goleiros e posições. Depois do sorteio, o administrador pode refazer ou ajustar manualmente em uma versão futura.</div>
        <div class="section-title"><h2>Escalação</h2>${this.canManageMatches()?`<button data-action="draw-teams" data-id="${match.id}">${assignments.length?"Refazer":"Gerar times"}</button>`:''}</div>
        ${teams.length ? `<div class="team-grid">${teams.map(name=>this.teamCard(name,assignments,match)).join("")}</div>` : `<div class="card empty"><strong>Times ainda não sorteados</strong>${confirmed.length<2?"Aguarde mais confirmações.":"Toque em “Sortear” para criar equipes equilibradas."}</div>`}
        <div class="section-title"><h2>Confirmados</h2></div><div class="list">${confirmed.map(p=>this.playerRow(p)).join("") || `<div class="card empty">Nenhum confirmado.</div>`}</div>`;
    },

    teamCard(name, assignments, match) {
      const members = assignments.filter(a=>a.team_name===name).sort((a,b)=>a.slot-b.slot).map(a=>this.player(a.player_id)).filter(Boolean);
      const strength = members.reduce((s,p)=>s+this.effectiveSkill(p),0);
      return `<section class="card team-card"><div class="team-head"><strong>${escapeHtml(name)}</strong><small>força ${strength.toFixed(1)}</small></div>${members.map(p=>`<div class="team-player"><div class="player-avatar">${initials(p.name)}</div><div class="list-main"><strong>${escapeHtml(p.nickname||p.name)}</strong><small>${escapeHtml(p.primary_position)} · nota ${this.effectiveSkill(p).toFixed(1)}</small></div>${p.goalkeeper?'<span class="score-pill">GOL</span>':''}</div>`).join("")}</section>`;
    },

    playerRow(p, trailing="") { return `<div class="card list-row"><div class="player-avatar">${initials(p.name)}</div><div class="list-main"><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.primary_position||"Sem posição")} · ${p.games||0} jogos</small></div>${trailing||`<span class="score-pill">${this.effectiveSkill(p).toFixed(1)}</span>`}</div>`; },

    financePage() {
      const groupId=this.state.currentGroupId;
      const payments=this.state.payments.filter(p=>p.group_id===groupId); const expenses=this.state.expenses.filter(e=>e.group_id===groupId);
      const income=payments.reduce((s,p)=>s+Number(p.amount),0); const out=expenses.reduce((s,e)=>s+Number(e.amount),0); const balance=income-out;
      const charges=this.state.charges.filter(c=>c.group_id===groupId); const paid=charges.filter(c=>c.status==="paid").length; const pct=charges.length?Math.round(paid/charges.length*100):0;
      const movements=[...payments.map(p=>({...p,type:"income",description:`Pagamento · ${this.player(p.player_id)?.nickname||"Jogador"}`,date:p.paid_at})),...expenses.map(e=>({...e,type:"expense",date:e.occurred_at}))].sort((a,b)=>new Date(b.date)-new Date(a.date));
      return `<div class="page-head"><div><h1>Caixa</h1><p>Mensalidades, churrasco e despesas.</p></div>${this.canManageFinance()?'<button class="btn btn-primary btn-small" data-action="new-finance">+ Lançar</button>':''}</div>
        <section class="card balance-card"><small>Saldo atual</small><h2 class="money">${money(balance)}</h2><div class="balance-track"><span style="width:${pct}%"></span></div><p style="margin:9px 0 0;color:var(--muted);font-size:12px">${paid} de ${charges.length} mensalidades pagas · ${pct}%</p></section>
        <div class="metrics" style="margin-top:10px"><div class="card metric"><strong class="money">${money(income)}</strong><small>entradas</small></div><div class="card metric"><strong class="money">${money(out)}</strong><small>saídas</small></div><div class="card metric"><strong>${charges.filter(c=>c.status!=="paid").length}</strong><small>pendentes</small></div></div>
        <div class="section-title"><h2>Movimentações</h2></div><div class="list">${movements.map(m=>`<div class="card finance-row"><div class="finance-icon ${m.type==="income"?"finance-income":"finance-expense"}">${m.type==="income"?"+":"−"}</div><div class="list-main"><strong>${escapeHtml(m.description)}</strong><small>${escapeHtml(shortDate(m.date))}</small></div><strong class="money" style="color:${m.type==="income"?'var(--primary)':'var(--danger)'}">${m.type==="income"?"+":"−"}${money(m.amount)}</strong></div>`).join("") || '<div class="card empty">Sem movimentações.</div>'}</div>
        <div class="section-title"><h2>Mensalidades</h2></div><div class="list">${charges.map(c=>this.playerRow(this.player(c.player_id)||{name:"Jogador",skill:0},`<span class="status-pill ${c.status==='paid'?'status-confirmed':'status-out'}">${c.status==='paid'?'Pago':'Pendente'}</span>`)).join("")}</div>`;
    },

    rankingPage() {
      const players=this.activePlayers().map(p=>{
        const ratings=this.state.ratings.filter(r=>r.rated_player_id===p.id); const avg=ratings.length?ratings.reduce((s,r)=>s+Number(r.technical),0)/ratings.length:Number(p.skill||0);
        return {...p,avg,points:(p.wins||0)*3+(p.games-(p.wins||0)||0)*.4};
      }).sort((a,b)=>b.avg-a.avg || b.points-a.points);
      return `<div class="page-head"><div><h1>Ranking</h1><p>Desempenho, notas e estatísticas.</p></div><button class="btn btn-primary btn-small" data-action="rate-player">Avaliar</button></div>
        <div class="segmented"><button class="active">Geral</button><button>Artilharia</button><button>Assistências</button><button>Fair play</button></div>
        <div class="section-title"><h2>Melhores avaliados</h2></div><div class="card">${players.map((p,i)=>`<div class="rank-row"><div class="rank-pos">${i+1}</div><div class="player-avatar">${initials(p.name)}</div><div class="list-main"><strong>${escapeHtml(p.name)}</strong><small>${p.goals||0} gols · ${p.assists||0} assistências · ${p.games||0} jogos</small></div><span class="score-pill">★ ${p.avg.toFixed(1)}</span></div>`).join("")}</div>`;
    },

    morePage() {
      const group=this.currentGroup();
      return `<div class="page-head"><div><h1>Mais</h1><p>Grupo, jogadores e configurações.</p></div></div>
        <div class="list">
          <button class="card list-row" data-action="players"><div class="player-avatar">♟</div><div class="list-main"><strong>Jogadores</strong><small>Cadastro, posição, nível e vínculo.</small></div><strong>›</strong></button>
          <button class="card list-row" data-action="group"><div class="player-avatar">#</div><div class="list-main"><strong>Convidar amigos</strong><small>Código do grupo: ${escapeHtml(group?.invite_code||"—")}</small></div><strong>›</strong></button>
          ${this.canManageMatches()?'<button class="card list-row" data-action="announcement"><div class="player-avatar">!</div><div class="list-main"><strong>Avisos</strong><small>Comunicados para todos os participantes.</small></div><strong>›</strong></button>':''}
          <button class="card list-row" data-action="export"><div class="player-avatar">⇩</div><div class="list-main"><strong>Backup e exportação</strong><small>Baixar dados completos em JSON.</small></div><strong>›</strong></button>
          ${this.cloud?`<button class="card list-row" data-action="sign-out"><div class="player-avatar">↪</div><div class="list-main"><strong>Sair da conta</strong><small>Encerrar sessão neste aparelho.</small></div><strong>›</strong></button>`:`<button class="card list-row" data-action="reset-demo"><div class="player-avatar">↺</div><div class="list-main"><strong>Redefinir demonstração</strong><small>Restaurar os dados de exemplo.</small></div><strong>›</strong></button>`}
        </div>
        <div class="section-title"><h2>Versão</h2></div><div class="notice">Resenha FC v0.2.1 · PWA responsiva · frontend pronto para Cloudflare Pages · backend Supabase com autenticação, PostgreSQL, RLS e sincronização em tempo real.</div>`;
    },

    async handleAction(action, data) {
      try {
        const map = {
          "new-match":()=>this.openMatchForm(), "open-match":()=>this.openMatchDetails(data.id), "rsvp":()=>this.openRsvp(data.id || this.nextMatch()?.id),
          "draw-teams":()=>this.drawTeams(data.id), "new-finance":()=>this.openFinanceForm(), "rate-player":()=>this.openRatingForm(),
          "players":()=>this.openPlayers(), "group":()=>this.openGroupModal(), "announcement":()=>this.openAnnouncementForm(), "export":()=>this.exportData(),
          "reset-demo":async()=>{ await this.repo.reset(); this.state=await this.repo.init(); this.render(); this.toast("Demonstração restaurada."); },
          "sign-out":async()=>{ await this.repo.signOut(); location.reload(); }
        };
        if (map[action]) await map[action]();
      } catch (error) { console.error(error); this.toast(error.message || "Não foi possível concluir a ação.", true); }
    },

    renderAuth() {
      const oauthError = oauthErrorFromLocation();
      document.body.innerHTML = `<main class="auth-screen"><section class="auth-panel"><img class="auth-logo" src="brand/logo-resenha-fc.png" alt="Resenha FC"><h1>Resenha FC</h1><p>Organize presença, times, mensalidades, churrasco, notas e estatísticas da sua pelada.</p><div class="card auth-card">${oauthError?`<div class="notice auth-error"><strong>Não foi possível entrar com Google</strong><br>${escapeHtml(oauthError)}</div>`:""}<button class="btn btn-google btn-block" type="button" id="googleLoginButton" aria-label="Continuar com Google"><svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.19-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.86A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z"/><path fill="#EA4335" d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"/></svg><span>Continuar com Google</span></button><div class="divider">ou entre com e-mail</div><form id="authForm" class="form-grid"><div class="field"><label>Nome</label><input id="authName" autocomplete="name" placeholder="Seu nome"></div><div class="field"><label>E-mail</label><input id="authEmail" type="email" autocomplete="email" required placeholder="voce@email.com"></div><div class="field"><label>Senha</label><input id="authPassword" type="password" autocomplete="current-password" minlength="6" required placeholder="Mínimo de 6 caracteres"></div><button class="btn btn-primary btn-block" type="submit">Entrar com e-mail</button><button class="btn btn-secondary btn-block" type="button" id="signupButton">Criar conta com e-mail</button></form><div class="divider">modo de teste</div><button class="btn btn-ghost btn-block" id="demoButton">Abrir demonstração local</button></div></section></main>`;
      const credentials=()=>({email:$("#authEmail").value.trim(),password:$("#authPassword").value,name:$("#authName").value.trim()});
      $("#googleLoginButton").addEventListener("click",async event=>{
        const button=event.currentTarget;
        const original=button.innerHTML;
        button.disabled=true;
        button.innerHTML='<span class="button-spinner" aria-hidden="true"></span><span>Conectando ao Google…</span>';
        const {error}=await this.repo.signInWithGoogle();
        if(error){button.disabled=false;button.innerHTML=original;return this.toast(error.message,true);}
      });
      $("#authForm").addEventListener("submit",async e=>{e.preventDefault(); const {email,password}=credentials(); const {error}=await this.repo.signIn(email,password); if(error)return this.toast(error.message,true); location.reload();});
      $("#signupButton").addEventListener("click",async()=>{const {email,password,name}=credentials(); if(!email||!password)return this.toast("Informe e-mail e senha.",true); const {data,error}=await this.repo.signUp(email,password,name); if(error)return this.toast(error.message,true); if(data?.session)return location.reload(); this.toast("Conta criada. Verifique o e-mail para concluir o acesso.");});
      $("#demoButton").addEventListener("click",async()=>{sessionSet("resenha-demo","1");location.reload();});
      if(oauthError && history.replaceState) history.replaceState({}, document.title, location.pathname);
    },


    renderBackendError(error) {
      const message = escapeHtml(error?.message || "Não foi possível conectar ao backend.");
      document.body.innerHTML = `<main class="auth-screen"><section class="auth-panel"><img class="auth-logo" src="brand/logo-resenha-fc.png" alt="Resenha FC"><h1>Falha na conexão</h1><p>O backend está configurado, mas não respondeu corretamente.</p><div class="card auth-card"><div class="notice"><strong>Detalhe técnico</strong><br>${message}</div><button class="btn btn-primary btn-block" id="retryCloudButton">Tentar novamente</button><button class="btn btn-ghost btn-block" id="localFallbackButton">Abrir demonstração local</button></div></section></main>`;
      $("#retryCloudButton").addEventListener("click", () => location.reload());
      $("#localFallbackButton").addEventListener("click", () => { sessionSet("resenha-demo", "1"); location.reload(); });
    },

    modal(title, content, onReady) {
      const root=$("#modalRoot"); root.innerHTML=`<div class="modal-backdrop" role="dialog" aria-modal="true"><section class="modal"><div class="modal-handle"></div><div class="modal-head"><h2>${escapeHtml(title)}</h2><button class="modal-close" aria-label="Fechar">×</button></div>${content}</section></div>`;
      const close=()=>root.innerHTML=""; $(".modal-close",root).addEventListener("click",close); $(".modal-backdrop",root).addEventListener("click",e=>{if(e.target.classList.contains("modal-backdrop"))close();});
      onReady?.(root,close);
    },

    openMatchForm() {
      if (!this.canManageMatches()) return this.toast("Seu perfil não pode criar jogos.", true);
      const dt=new Date(Date.now()+7*86400000); dt.setHours(20,0,0,0); const local=new Date(dt.getTime()-dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
      this.modal("Novo jogo",`<form id="matchForm" class="form-grid"><div class="field"><label>Título</label><input name="title" required value="Pelada semanal"></div><div class="field"><label>Data e hora</label><input name="starts_at" type="datetime-local" required value="${local}"></div><div class="field"><label>Local</label><input name="location" required placeholder="Nome da arena e quadra"></div><div class="field-row"><div class="field"><label>Máximo de jogadores</label><input name="max_players" type="number" min="4" max="40" value="12"></div><div class="field"><label>Jogadores por time</label><input name="players_per_team" type="number" min="2" max="11" value="6"></div></div><label class="check-row"><input name="bbq_enabled" type="checkbox" checked> Organizar churrasco após o jogo</label><div class="field"><label>Valor do churrasco por pessoa</label><input name="bbq_price" type="number" min="0" step="0.01" value="25"></div><div class="field"><label>Observações</label><textarea name="notes" placeholder="Prazo de confirmação, uniforme, regras..."></textarea></div><button class="btn btn-primary btn-block">Criar jogo</button></form>`,(root,close)=>{
        $("#matchForm",root).addEventListener("submit",async e=>{e.preventDefault(); const f=new FormData(e.currentTarget); const record={id:uid("match"),group_id:this.state.currentGroupId,title:f.get("title"),starts_at:new Date(f.get("starts_at")).toISOString(),location:f.get("location"),max_players:Number(f.get("max_players")),players_per_team:Number(f.get("players_per_team")),status:"scheduled",bbq_enabled:f.get("bbq_enabled")==="on",bbq_price:Number(f.get("bbq_price")||0),notes:f.get("notes")||"",created_at:nowIso()}; await this.repo.mutate("matches",record); this.state=this.repo.state; close(); this.render(); this.toast("Jogo criado.");});
      });
    },

    openMatchDetails(id) {
      const match=this.state.matches.find(m=>m.id===id); if(!match)return;
      const att=this.attendanceFor(id); const grouped={confirmed:[],maybe:[],out:[],waitlist:[]}; att.forEach(a=>grouped[a.status]?.push(a));
      const groupHtml=(label,key)=>`<div class="section-title"><h2>${label} (${grouped[key].length})</h2></div><div class="list">${grouped[key].map(a=>this.playerRow(this.player(a.player_id),a.bbq?'<span class="score-pill">Churrasco</span>':'')).join("")||'<div class="card empty">Nenhum.</div>'}</div>`;
      this.modal(match.title,`<div class="notice">${escapeHtml(shortDate(match.starts_at))}<br>${escapeHtml(match.location)}${match.notes?`<br><br>${escapeHtml(match.notes)}`:""}</div><div class="actions"><button class="btn btn-primary" data-action="rsvp" data-id="${match.id}">Minha presença</button>${this.canManageMatches()?`<button class="btn btn-secondary" data-action="draw-teams" data-id="${match.id}">Sortear times</button>`:''}</div>${groupHtml("Confirmados","confirmed")}${groupHtml("Talvez","maybe")}${groupHtml("Lista de espera","waitlist")}${groupHtml("Não vão","out")}`);
    },

    openRsvp(matchId) {
      const match=this.state.matches.find(m=>m.id===matchId); if(!match)return this.toast("Crie um jogo primeiro.",true);
      const player=this.myPlayer(); if(!player)return this.toast("Cadastre seu jogador primeiro.",true);
      const current=this.state.attendance.find(a=>a.match_id===matchId&&a.player_id===player.id)||{};
      this.modal("Confirmar presença",`<form id="rsvpForm" class="form-grid"><div class="notice"><strong>${escapeHtml(match.title)}</strong><br>${escapeHtml(shortDate(match.starts_at))} · ${escapeHtml(match.location)}</div><div class="field"><label>Sua resposta</label><div class="radio-grid">${[["confirmed","Vou jogar"],["maybe","Talvez"],["out","Não vou"],["waitlist","Espera"]].map(([v,l])=>`<label class="radio-card"><input type="radio" name="status" value="${v}" ${current.status===v||(!current.status&&v==="confirmed")?"checked":""}> ${l}</label>`).join("")}</div></div>${match.bbq_enabled?`<label class="check-row"><input type="checkbox" name="bbq" ${current.bbq?"checked":""}> Participarei do churrasco</label><div class="field"><label>Acompanhantes no churrasco</label><input type="number" name="bbq_guests" min="0" max="10" value="${current.bbq_guests||0}"></div><div class="field"><label>O que vou levar / observação</label><input name="bbq_note" value="${escapeHtml(current.bbq_note||"")}" placeholder="Ex.: refrigerante, pão de alho"></div>`:""}<button class="btn btn-primary btn-block">Salvar resposta</button></form>`,(root,close)=>{
        $("#rsvpForm",root).addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);let status=f.get("status");const confirmedOthers=this.confirmedFor(matchId).filter(a=>a.player_id!==player.id);let movedToWaitlist=false;if(status==="confirmed"&&current.status!=="confirmed"&&confirmedOthers.length>=Number(match.max_players)){status="waitlist";movedToWaitlist=true;}const record={id:current.id||uid(),match_id:matchId,player_id:player.id,status,bbq:f.get("bbq")==="on",bbq_guests:Number(f.get("bbq_guests")||0),bbq_note:f.get("bbq_note")||"",responded_at:nowIso()};await this.repo.mutate("attendance",record);this.state=this.repo.state;close();this.render();this.toast(movedToWaitlist?"Vagas preenchidas. Você entrou na lista de espera.":"Presença atualizada.");});
      });
    },

    async drawTeams(matchId) {
      if (!this.canManageMatches()) return this.toast("Seu perfil não pode montar os times.", true);
      const match=this.state.matches.find(m=>m.id===matchId); const players=this.confirmedFor(matchId).map(a=>this.player(a.player_id)).filter(Boolean);
      if(players.length<4)return this.toast("São necessários ao menos 4 jogadores confirmados.",true);
      const perTeam=Number(match.players_per_team||6); const teamCount=clamp(Math.ceil(players.length/perTeam),2,4); const teamNames=["Time Verde","Time Branco","Time Azul","Time Laranja"].slice(0,teamCount);
      const teams=teamNames.map(name=>({name,players:[],strength:0,goalkeepers:0,positions:{}}));
      const ordered=[...players].sort((a,b)=>(Number(b.goalkeeper)-Number(a.goalkeeper))||(this.effectiveSkill(b)-this.effectiveSkill(a)));
      ordered.forEach((p,index)=>{
        const candidates=[...teams].sort((a,b)=>{
          if(p.goalkeeper&&a.goalkeepers!==b.goalkeepers)return a.goalkeepers-b.goalkeepers;
          if(a.players.length!==b.players.length)return a.players.length-b.players.length;
          return a.strength-b.strength;
        });
        const t=candidates[0];t.players.push(p);t.strength+=this.effectiveSkill(p);t.goalkeepers+=p.goalkeeper?1:0;t.positions[p.primary_position]=(t.positions[p.primary_position]||0)+1;
      });
      const records=[];
      for(const t of teams) for(let i=0;i<t.players.length;i++) records.push({id:uid(),match_id:matchId,player_id:t.players[i].id,team_name:t.name,slot:i+1});
      await this.repo.replaceAssignments(matchId,records);
      this.state=this.repo.state;this.route="teams";this.render();this.toast("Times sorteados com equilíbrio técnico.");
    },

    openFinanceForm() {
      if (!this.canManageFinance()) return this.toast("Seu perfil não pode fazer lançamentos financeiros.", true);
      const players=this.activePlayers();
      this.modal("Novo lançamento",`<form id="financeForm" class="form-grid"><div class="field"><label>Tipo</label><select name="type"><option value="payment">Pagamento recebido</option><option value="expense">Despesa</option><option value="charge">Nova cobrança</option></select></div><div class="field"><label>Jogador</label><select name="player_id"><option value="">Não se aplica</option>${players.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}</select></div><div class="field"><label>Descrição</label><input name="description" required placeholder="Mensalidade, quadra, bola..."></div><div class="field"><label>Valor</label><input name="amount" type="number" min="0.01" step="0.01" required></div><button class="btn btn-primary btn-block">Salvar lançamento</button></form>`,(root,close)=>{
        $("#financeForm",root).addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const type=f.get("type"),playerId=f.get("player_id")||null,base={id:uid(),group_id:this.state.currentGroupId,description:f.get("description"),amount:Number(f.get("amount")),player_id:playerId};if(type==="payment"){const charge=this.state.charges.filter(c=>c.group_id===this.state.currentGroupId&&c.player_id===playerId&&c.status!=="paid"&&c.status!=="cancelled").sort((a,b)=>String(a.due_date).localeCompare(String(b.due_date)))[0];await this.repo.recordPayment({...base,charge_id:charge?.id||null,paid_at:nowIso(),method:"manual"},charge);}if(type==="expense")await this.repo.mutate("expenses",{...base,occurred_at:nowIso(),category:"outros"});if(type==="charge")await this.repo.mutate("charges",{...base,due_date:new Date().toISOString().slice(0,10),status:"open"});this.state=this.repo.state;close();this.render();this.toast("Lançamento salvo.");});
      });
    },

    openRatingForm() {
      const match=this.pastMatches()[0]; if(!match)return this.toast("Ainda não há jogo concluído para avaliar.",true);
      const players=this.activePlayers().filter(p=>p.id!==this.myPlayer()?.id);
      this.modal("Avaliar jogador",`<form id="ratingForm" class="form-grid"><div class="notice">Avaliação referente a <strong>${escapeHtml(match.title)}</strong>. As médias ajudam a equilibrar os times.</div><div class="field"><label>Jogador</label><select name="player_id" required>${players.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}</select></div>${[["technical","Nota técnica"],["fair_play","Fair play"],["conditioning","Condicionamento"]].map(([n,l])=>`<div class="field"><label>${l} (1 a 5)</label><input name="${n}" type="range" min="1" max="5" step="0.5" value="4" oninput="this.nextElementSibling.textContent=this.value"><strong>4</strong></div>`).join("")}<div class="field"><label>Comentário opcional</label><textarea name="comment" placeholder="Comentário respeitoso e objetivo"></textarea></div><button class="btn btn-primary btn-block">Enviar avaliação</button></form>`,(root,close)=>{
        $("#ratingForm",root).addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const ratedPlayerId=f.get("player_id"),raterUserId=this.state.profile?.id||"demo-user",existing=this.state.ratings.find(r=>r.match_id===match.id&&r.rated_player_id===ratedPlayerId&&r.rater_user_id===raterUserId);const record={id:existing?.id||uid("rating"),match_id:match.id,rated_player_id:ratedPlayerId,rater_user_id:raterUserId,technical:Number(f.get("technical")),fair_play:Number(f.get("fair_play")),conditioning:Number(f.get("conditioning")),comment:f.get("comment")||"",created_at:existing?.created_at||nowIso()};await this.repo.mutate("ratings",record);this.state=this.repo.state;close();this.render();this.toast("Avaliação registrada.");});
      });
    },

    openPlayers() {
      this.modal("Jogadores",`${this.canManageMatches()?'<div class="actions" style="margin-top:0"><button class="btn btn-primary" id="addPlayer">+ Cadastrar jogador</button></div>':''}<div class="section-title"><h2>${this.activePlayers().length} ativos</h2></div><div class="list">${this.activePlayers().map(p=>this.playerRow(p)).join("")}</div>`,(root)=>{$("#addPlayer",root)?.addEventListener("click",()=>this.openPlayerForm());});
    },

    openPlayerForm() {
      if (!this.canManageMatches()) return this.toast("Seu perfil não pode cadastrar jogadores.", true);
      this.modal("Cadastrar jogador",`<form id="playerForm" class="form-grid"><div class="field"><label>Nome completo</label><input name="name" required></div><div class="field-row"><div class="field"><label>Apelido</label><input name="nickname"></div><div class="field"><label>Nota inicial</label><input name="skill" type="number" min="1" max="5" step="0.1" value="3.5"></div></div><div class="field"><label>Posição principal</label><select name="position"><option>Goleiro</option><option>Zagueiro</option><option>Lateral</option><option selected>Meia</option><option>Atacante</option></select></div><label class="check-row"><input name="goalkeeper" type="checkbox"> Pode jogar no gol</label><button class="btn btn-primary btn-block">Cadastrar</button></form>`,(root,close)=>{$("#playerForm",root).addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const record={id:uid("player"),group_id:this.state.currentGroupId,user_id:null,name:f.get("name"),nickname:f.get("nickname")||f.get("name").split(" ")[0],skill:Number(f.get("skill")),fair_play:4,conditioning:3.5,primary_position:f.get("position"),secondary_position:"",goalkeeper:f.get("goalkeeper")==="on"||f.get("position")==="Goleiro",active:true,games:0,wins:0,goals:0,assists:0};await this.repo.mutate("players",record);this.state=this.repo.state;close();this.openPlayers();this.toast("Jogador cadastrado.");});});
    },

    openGroupModal() {
      const groups=this.state.groups||[]; const current=this.currentGroup();
      this.modal("Grupo da pelada",`${groups.length?`<div class="list">${groups.map(g=>`<button class="card list-row" data-group-id="${g.id}"><div class="player-avatar">${initials(g.name)}</div><div class="list-main"><strong>${escapeHtml(g.name)}</strong><small>${escapeHtml(g.role||"membro")} · código ${escapeHtml(g.invite_code||"—")}</small></div>${g.id===current?.id?'<span class="score-pill">Atual</span>':'<strong>›</strong>'}</button>`).join("")}</div>`:""}<div class="section-title"><h2>Adicionar grupo</h2></div><form id="groupForm" class="form-grid"><div class="field"><label>Novo grupo</label><input name="name" placeholder="Ex.: Futebol de quinta"></div><button class="btn btn-primary btn-block" name="mode" value="create">Criar grupo</button><div class="divider">ou</div><div class="field"><label>Código de convite</label><input name="code" placeholder="Ex.: QUINTA26"></div><button class="btn btn-secondary btn-block" name="mode" value="join">Entrar com código</button></form>`,(root,close)=>{
        $$('[data-group-id]',root).forEach(btn=>btn.addEventListener("click",async()=>{this.state.currentGroupId=btn.dataset.groupId;if(this.cloud)await this.repo.loadGroup(btn.dataset.groupId);else this.repo.save();close();this.render();}));
        $("#groupForm",root).addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const submit=e.submitter.value;if(this.cloud){if(submit==="create")await this.repo.createGroup(f.get("name"));else await this.repo.joinGroup(f.get("code"));this.state=this.repo.state;}else{if(submit==="create"){const id=uid("group"),name=f.get("name")||"Nova pelada";this.state.groups.push({id,name,role:"owner",invite_code:Math.random().toString(36).slice(2,8).toUpperCase(),default_players_per_team:6,monthly_fee:0});this.state.currentGroupId=id;this.repo.save();}else return this.toast("O ingresso por código requer o backend em nuvem.",true);}close();this.render();this.toast("Grupo atualizado.");});
      });
    },

    openAnnouncementForm() {
      if (!this.canManageMatches()) return this.toast("Seu perfil não pode publicar avisos.", true);
      this.modal("Publicar aviso",`<form id="noticeForm" class="form-grid"><div class="field"><label>Título</label><input name="title" required></div><div class="field"><label>Mensagem</label><textarea name="body" required></textarea></div><button class="btn btn-primary btn-block">Publicar</button></form>`,(root,close)=>{$("#noticeForm",root).addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);await this.repo.mutate("announcements",{id:uid("notice"),group_id:this.state.currentGroupId,title:f.get("title"),body:f.get("body"),created_at:nowIso()});this.state=this.repo.state;close();this.render();this.toast("Aviso publicado.");});});
    },

    openProfileModal() {
      const p=this.state.profile||{};
      this.modal("Meu perfil",`<form id="profileForm" class="form-grid"><div class="field"><label>Nome</label><input name="name" value="${escapeHtml(p.name||"")}"></div><div class="field"><label>E-mail</label><input disabled value="${escapeHtml(p.email||"Modo demonstração")}"></div><button class="btn btn-primary btn-block">Salvar</button></form>`,(root,close)=>{$("#profileForm",root).addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(this.repo.setProfile)await this.repo.setProfile({name:f.get("name")});this.state=this.repo.state;close();this.render();this.toast("Perfil atualizado.");});});
    },

    exportData() {
      const blob=new Blob([JSON.stringify(this.state,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`resenha-fc-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);this.toast("Backup gerado.");
    },

    toast(message,error=false) { const root=$("#toastRoot")||document.body; const el=document.createElement("div");el.className=`toast${error?" error":""}`;el.textContent=message;root.appendChild(el);setTimeout(()=>el.remove(),3200); }
  };

  window.App = App;
  async function boot() {
    const config = window.RESENHA_CONFIG || {};
    const needsCloud = Boolean(config.supabaseUrl && config.supabasePublishableKey && sessionGet("resenha-demo") !== "1");
    if (needsCloud && !window.supabase) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Não foi possível carregar o cliente de nuvem."));
        document.head.appendChild(script);
      }).catch(error => {
        window.RESENHA_CLOUD_LOAD_ERROR = error;
        console.warn(error);
      });
    }
    App.init();
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
