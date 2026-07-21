(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = () => crypto.randomUUID?.() || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
  const nowIso = () => new Date().toISOString();
  const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
  const shortDate = iso => new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
  const safeImageUrl = (value = "") => {
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };
  const appBaseUrl = () => new URL("./", document.baseURI).href;
  const assetUrl = path => new URL(path, document.baseURI).href;
  const avatarKey = value => /^badge-(0[1-9]|1[0-9]|20)$/.test(String(value || "")) ? String(value) : "badge-01";
  const groupAvatarUrl = key => {
    const normalized = avatarKey(key);
    return window.RESENHA_GROUP_AVATARS?.[normalized] || assetUrl(`assets/group-avatars/${normalized}.png?v=0.3.1.3`);
  };
  const positionOptions = ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Atacante", "Coringa"];
  const roleLabels = { owner: "Proprietário", admin: "Administrador", organizer: "Organizador", treasurer: "Tesoureiro", member: "Membro" };
  const roleClass = role => `role-${role || "member"}`;
  const oauthErrorFromLocation = () => {
    const sources = [new URLSearchParams(location.search), new URLSearchParams(location.hash.replace(/^#/, ""))];
    for (const params of sources) {
      const message = params.get("error_description") || params.get("error");
      if (message) return String(message).replace(/\+/g, " ");
    }
    return "";
  };
  const loadScriptOnce = (id, src) => new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      if (id === "google-identity-script" && window.google?.accounts?.id) return resolve();
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Não foi possível carregar o serviço de login do Google."));
    document.head.appendChild(script);
  });
  const randomNonce = () => {
    const values = new Uint8Array(24);
    crypto.getRandomValues(values);
    return [...values].map(value => value.toString(16).padStart(2, "0")).join("");
  };
  const sha256Hex = async value => {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  };

  class SupabaseRepository {
    constructor(config) {
      this.config = config;
      this.client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      this.state = {
        profile: null,
        groups: [],
        currentGroupId: null,
        members: [],
        players: [],
        matches: [],
        attendance: [],
        assignments: [],
        charges: [],
        payments: [],
        expenses: [],
        member_ratings: [],
        match_events: [],
        announcements: []
      };
      this.channel = null;
      this.subscribedGroupId = null;
      this.reloadTimer = null;
    }

    async session() {
      return (await this.client.auth.getSession()).data.session;
    }

    async signInWithGoogleIdToken(token, nonce) {
      return this.client.auth.signInWithIdToken({ provider: "google", token, nonce });
    }

    async signOut() {
      clearTimeout(this.reloadTimer);
      if (this.channel) {
        await this.client.removeChannel(this.channel);
        this.channel = null;
        this.subscribedGroupId = null;
      }
      const { error } = await this.client.auth.signOut({ scope: "local" });
      if (error) throw error;
    }

    async init(preferredGroupId = null) {
      const session = await this.session();
      if (!session) return null;
      const user = session.user;
      const meta = user.user_metadata || {};
      const email = user.email || "";
      const name = meta.name || meta.full_name || [meta.given_name, meta.family_name].filter(Boolean).join(" ") || email.split("@")[0] || "Usuário";
      this.state.profile = { id: user.id, email, name, avatar_url: meta.avatar_url || meta.picture || "" };

      const { data: memberships, error } = await this.client
        .from("group_members")
        .select("role,player_id,groups(id,name,invite_code,avatar_key,created_by,created_at,default_players_per_team,monthly_fee)")
        .eq("user_id", user.id);
      if (error) throw error;

      this.state.groups = (memberships || []).filter(item => item.groups).map(item => ({ ...item.groups, role: item.role, player_id: item.player_id }));
      const preferred = this.state.groups.find(group => group.id === preferredGroupId)?.id;
      this.state.currentGroupId = preferred || this.state.groups[0]?.id || null;
      if (this.state.currentGroupId) await this.loadGroup(this.state.currentGroupId);
      return this.state;
    }

    async loadGroup(groupId, options = {}) {
      const { subscribe = true } = options;
      this.state.currentGroupId = groupId;
      const tableNames = ["players", "matches", "charges", "payments", "expenses", "announcements", "group_members", "member_ratings"];
      const results = await Promise.all(tableNames.map(table => this.client.from(table).select("*").eq("group_id", groupId)));
      results.forEach((result, index) => {
        if (result.error) throw result.error;
        const stateKey = tableNames[index] === "group_members" ? "members" : tableNames[index];
        this.state[stateKey] = result.data || [];
      });

      const [attendance, assignments, events] = await Promise.all([
        this.client.from("match_attendance").select("*").eq("group_id", groupId),
        this.client.from("team_assignments").select("*").eq("group_id", groupId),
        this.client.from("match_events").select("*").eq("group_id", groupId)
      ]);
      [["attendance", attendance], ["assignments", assignments], ["match_events", events]].forEach(([key, result]) => {
        if (result.error) throw result.error;
        this.state[key] = result.data || [];
      });

      if (subscribe) this.subscribe(groupId);
      return this.state;
    }

    queueReload(groupId) {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = setTimeout(async () => {
        if (this.state.currentGroupId !== groupId) return;
        try {
          await this.loadGroup(groupId, { subscribe: false });
          App.state = this.state;
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
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table: "groups", filter: `id=eq.${groupId}` }, onChange);
      ["group_members", "players", "matches", "match_attendance", "team_assignments", "member_ratings", "match_events", "charges", "payments", "expenses", "announcements"].forEach(table => {
        channel = channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `group_id=eq.${groupId}` }, onChange);
      });
      this.channel = channel.subscribe();
      this.subscribedGroupId = groupId;
    }

    async mutate(collection, record, mode = "upsert") {
      const tableMap = { attendance: "match_attendance", assignments: "team_assignments" };
      const table = tableMap[collection] || collection;
      if (mode === "delete") {
        const { error } = await this.client.from(table).delete().eq("id", record.id);
        if (error) throw error;
      } else {
        const { error } = await this.client.from(table).upsert(record);
        if (error) throw error;
      }
      return this.loadGroup(this.state.currentGroupId, { subscribe: false });
    }

    async setProfile(name) {
      const { data, error } = await this.client.rpc("update_my_profile", { p_name: String(name || "").trim() });
      if (error) throw error;
      const userUpdate = await this.client.auth.updateUser({ data: { name: data || name } });
      if (userUpdate.error) console.warn(userUpdate.error);
      this.state.profile = { ...this.state.profile, name: data || name };
      return this.state.profile;
    }

    async updateMyPlayer(groupId, payload) {
      const { error } = await this.client.rpc("update_my_player_profile", {
        p_group_id: groupId,
        p_nickname: payload.nickname || "",
        p_primary_position: payload.primaryPosition,
        p_secondary_position: payload.secondaryPosition || "",
        p_goalkeeper: Boolean(payload.goalkeeper)
      });
      if (error) throw error;
      return this.loadGroup(groupId, { subscribe: false });
    }

    async createGroup(name, avatar) {
      const { data, error } = await this.client.rpc("create_group", { p_name: name, p_avatar_key: avatarKey(avatar) });
      if (error) throw error;
      await this.init(data);
      return data;
    }

    async joinGroup(code) {
      const { data, error } = await this.client.rpc("join_group_by_code", { p_code: String(code || "").toUpperCase() });
      if (error) throw error;
      await this.init(data);
      return data;
    }

    async updateGroup(groupId, name, avatar) {
      const { error } = await this.client.rpc("update_group_settings", { p_group_id: groupId, p_name: name, p_avatar_key: avatarKey(avatar) });
      if (error) throw error;
      await this.init(groupId);
    }

    async setMemberRole(groupId, userId, role) {
      const { error } = await this.client.rpc("set_member_role", { p_group_id: groupId, p_user_id: userId, p_role: role });
      if (error) throw error;
      return this.loadGroup(groupId, { subscribe: false });
    }

    async transferOwnership(groupId, userId) {
      const { error } = await this.client.rpc("transfer_group_ownership", { p_group_id: groupId, p_new_owner_user_id: userId });
      if (error) throw error;
      await this.init(groupId);
    }

    async rateMember(groupId, playerId, score) {
      const { error } = await this.client.rpc("upsert_member_rating", { p_group_id: groupId, p_rated_player_id: playerId, p_score: Number(score) });
      if (error) throw error;
    }

    async deleteMatch(matchId) {
      const { error } = await this.client.rpc("delete_scheduled_match", { p_match_id: matchId });
      if (error) throw error;
      return this.loadGroup(this.state.currentGroupId, { subscribe: false });
    }

    async balanceTeams(matchId) {
      const { error } = await this.client.rpc("balance_match_teams", { p_match_id: matchId });
      if (error) throw error;
      return this.loadGroup(this.state.currentGroupId, { subscribe: false });
    }

    async recordPayment(record, charge = null) {
      const { error } = await this.client.rpc("record_payment", {
        p_group_id: record.group_id,
        p_player_id: record.player_id,
        p_charge_id: charge?.id || null,
        p_description: record.description,
        p_amount: record.amount,
        p_method: record.method || "manual",
        p_paid_at: record.paid_at || new Date().toISOString()
      });
      if (error) throw error;
      return this.loadGroup(this.state.currentGroupId, { subscribe: false });
    }
  }

  const App = {
    route: "home",
    repo: null,
    state: null,
    pendingInvite: "",
    launchAction: "",

    async init() {
      this.bindGlobal();
      this.captureInviteIntent();
      const config = window.RESENHA_CONFIG || {};
      if (!(config.supabaseUrl && config.supabasePublishableKey && config.googleClientId)) return this.renderConfigurationError();
      if (!window.supabase) return this.renderBackendError(window.RESENHA_CLOUD_LOAD_ERROR || new Error("Não foi possível carregar o cliente Supabase."));

      this.repo = new SupabaseRepository(config);
      try {
        this.state = await this.repo.init(localStorage.getItem("resenha-current-group") || null);
        if (!this.state) return this.renderAuth();
        this.render();
        this.registerServiceWorker();
        if (this.pendingInvite) setTimeout(() => this.openJoinGroupModal(this.pendingInvite), 80);
        else if (this.launchAction === "rsvp") setTimeout(() => this.openRsvp(this.nextMatch()?.id), 80);
      } catch (error) {
        console.error(error);
        this.renderBackendError(error);
      }
    },

    captureInviteIntent() {
      const params = new URLSearchParams(location.search);
      const invite = String(params.get("invite") || "").trim().toUpperCase();
      if (invite) localStorage.setItem("resenha-pending-invite", invite);
      this.pendingInvite = localStorage.getItem("resenha-pending-invite") || "";
      const page = params.get("page");
      if (["home", "matches", "teams", "members", "finance", "more"].includes(page)) this.route = page;
      this.launchAction = params.get("action") || "";
    },

    bindGlobal() {
      document.addEventListener("click", event => {
        const nav = event.target.closest("[data-route]");
        if (nav) {
          this.route = nav.dataset.route;
          this.render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        const action = event.target.closest("[data-action]");
        if (action) this.handleAction(action.dataset.action, action.dataset);
      });
      $("#groupButton")?.addEventListener("click", () => this.openGroupModal());
      $("#groupAvatarButton")?.addEventListener("click", () => {
        if (this.currentGroup() && this.canManageGroup()) this.openGroupSettings();
        else this.openGroupModal();
      });
      $("#profileButton")?.addEventListener("click", () => this.openProfileModal());
      document.addEventListener("error", event => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement) || !image.matches("[data-group-avatar]")) return;
        if (image.dataset.fallbackApplied === "true") return;
        image.dataset.fallbackApplied = "true";
        image.src = window.RESENHA_GROUP_AVATARS?.["badge-01"] || assetUrl("assets/group-avatars/badge-01.png?v=0.3.1.2");
      }, true);
    },

    registerServiceWorker() {
      if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
        navigator.serviceWorker.register("service-worker.js").catch(console.warn);
      }
    },

    currentGroup() {
      return this.state?.groups.find(group => group.id === this.state.currentGroupId) || this.state?.groups[0] || null;
    },
    currentRole() { return this.currentGroup()?.role || "member"; },
    canManageGroup() { return ["owner", "admin"].includes(this.currentRole()); },
    canManageMatches() { return ["owner", "admin", "organizer"].includes(this.currentRole()); },
    canManageFinance() { return ["owner", "admin", "treasurer"].includes(this.currentRole()); },
    canSeeRatings() { return ["owner", "admin"].includes(this.currentRole()); },
    activePlayers() { return (this.state?.players || []).filter(player => player.active !== false); },
    player(id) { return this.state?.players.find(player => player.id === id); },
    memberPlayer(member) { return this.player(member?.player_id) || this.state?.players.find(player => player.user_id === member?.user_id); },
    myPlayer() {
      const group = this.currentGroup();
      return this.player(group?.player_id) || this.state?.players.find(player => player.user_id === this.state?.profile?.id) || null;
    },
    ownerMember() { return this.state?.members.find(member => member.role === "owner") || null; },
    attendanceFor(matchId) { return this.state?.attendance.filter(item => item.match_id === matchId) || []; },
    confirmedFor(matchId) { return this.attendanceFor(matchId).filter(item => item.status === "confirmed"); },
    upcomingMatches() {
      return (this.state?.matches || []).filter(match => new Date(match.starts_at) > new Date() && match.status !== "cancelled").sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    },
    pastMatches() {
      return (this.state?.matches || []).filter(match => new Date(match.starts_at) <= new Date() || match.status === "finished").sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
    },
    nextMatch() { return this.upcomingMatches()[0] || null; },
    ratingSummary(playerId) {
      if (!this.canSeeRatings()) return null;
      const ratings = this.state.member_ratings.filter(item => item.rated_player_id === playerId);
      if (!ratings.length) return { average: null, count: 0 };
      return { average: ratings.reduce((sum, item) => sum + Number(item.score), 0) / ratings.length, count: ratings.length };
    },
    myRating(playerId) {
      return this.state.member_ratings.find(item => item.rated_player_id === playerId && item.rater_user_id === this.state.profile.id) || null;
    },

    groupAvatar(group, className = "group-avatar") {
      return `<img class="${className}" src="${groupAvatarUrl(group?.avatar_key)}" alt="Escudo de ${escapeHtml(group?.name || "grupo")}" data-group-avatar>`;
    },

    personAvatar(player, className = "player-avatar") {
      const url = safeImageUrl(player?.avatar_url || "");
      return url
        ? `<img class="${className} avatar-photo" src="${escapeHtml(url)}" alt="" referrerpolicy="no-referrer">`
        : `<div class="${className}">${initials(player?.name || "Jogador")}</div>`;
    },

    render() {
      if (!this.state) return;
      const group = this.currentGroup();
      const groupImg = $("#groupAvatar");
      if (groupImg) {
        groupImg.dataset.fallbackApplied = "false";
        groupImg.src = group ? groupAvatarUrl(group.avatar_key) : assetUrl("brand/brand-mark-transparent-v0311.png");
        groupImg.alt = group ? `Escudo de ${group.name}` : "Resenha FC";
      }
      $("#groupName").textContent = group?.name || "Crie ou entre em um grupo";
      $("#syncLabel").textContent = group ? `${roleLabels[this.currentRole()]} · nuvem ativa` : "Conta conectada";
      const profileButton = $("#profileButton");
      const profilePhoto = safeImageUrl(this.state.profile?.avatar_url);
      profileButton.innerHTML = profilePhoto ? `<img src="${escapeHtml(profilePhoto)}" alt="Meu perfil" referrerpolicy="no-referrer">` : initials(this.state.profile?.name || "Usuário");
      $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.route === this.route));
      const compactHome = Boolean(group && this.route === "home");
      $("#mainContent")?.classList.toggle("home-compact", compactHome);
      $(".app-shell")?.classList.toggle("home-shell", compactHome);

      if (!group) {
        $("#mainContent").innerHTML = this.emptyGroupPage();
        return;
      }
      const pages = {
        home: () => this.homePage(),
        matches: () => this.matchesPage(),
        teams: () => this.teamsPage(),
        members: () => this.membersPage(),
        finance: () => this.financePage(),
        more: () => this.morePage()
      };
      $("#mainContent").innerHTML = (pages[this.route] || pages.home)();
    },

    emptyGroupPage() {
      return `<section class="welcome-field"><div class="welcome-overlay"><img src="brand/brand-mark-transparent-v0311.png" alt="" class="welcome-mark"><span class="eyebrow">CONTA GOOGLE CONECTADA</span><h1>Monte sua resenha</h1><p>Crie um grupo com escudo próprio ou entre usando um código de convite.</p><div class="welcome-actions"><button class="btn btn-primary btn-small" data-action="create-group">+ Criar grupo</button><button class="btn btn-secondary btn-small" data-action="join-group">Inserir código</button></div></div></section>`;
    },

    homePage() {
      const group = this.currentGroup();
      const match = this.nextMatch();
      const attendance = match ? this.attendanceFor(match.id) : [];
      const confirmed = attendance.filter(item => item.status === "confirmed");
      const bbq = attendance.filter(item => item.bbq).reduce((sum, item) => sum + 1 + Number(item.bbq_guests || 0), 0);
      const notice = [...this.state.announcements].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      const owner = this.memberPlayer(this.ownerMember());
      const emblem = this.canManageGroup()
        ? `<button class="hero-avatar-button" data-action="group-settings" aria-label="Personalizar grupo">${this.groupAvatar(group, "hero-group-avatar")}</button>`
        : this.groupAvatar(group, "hero-group-avatar");
      return `<section class="home-dashboard">
        <section class="stadium-hero home-hero">
          <div class="stadium-lights"></div>
          <div class="group-identity">${emblem}<div><span class="eyebrow">${escapeHtml(roleLabels[this.currentRole()])}</span><h1>${escapeHtml(group.name)}</h1><p>Proprietário: ${escapeHtml(owner?.name || "Não identificado")}</p></div></div>
          ${match ? `<div class="next-match-panel"><div class="next-match-heading"><div><span class="match-kicker">PRÓXIMA PELADA</span><h2>${escapeHtml(match.title)}</h2></div><button class="match-detail-link" data-action="open-match" data-id="${match.id}">Detalhes</button></div><p>${escapeHtml(shortDate(match.starts_at))} · ${escapeHtml(match.location)}</p><div class="hero-numbers"><div><strong>${confirmed.length}</strong><small>confirmados</small></div><div><strong>${match.max_players}</strong><small>vagas</small></div><div><strong>${bbq}</strong><small>churrasco</small></div></div><button class="btn btn-primary btn-block home-rsvp" data-action="rsvp" data-id="${match.id}">Confirmar presença</button></div>` : `<div class="next-match-panel empty-match-panel"><span class="match-kicker">AGENDA LIVRE</span><h2>Nenhuma pelada marcada</h2><p>Organizadores podem criar o próximo jogo.</p>${this.canManageMatches() ? '<button class="btn btn-primary btn-small" data-action="new-match">Agendar pelada</button>' : ""}</div>`}
        </section>
        ${notice ? `<button class="home-notice" data-route="more"><span>📣</span><div><strong>${escapeHtml(notice.title)}</strong><small>${escapeHtml(notice.body)}</small></div><b>›</b></button>` : ""}
        <div class="home-quick-grid">
          <button class="quick-card" data-action="rsvp" data-id="${match?.id || ""}"><span class="quick-icon">✓</span><span><strong>Presença</strong><small>Jogo e churrasco</small></span></button>
          <button class="quick-card" data-route="teams"><span class="quick-icon">⇄</span><span><strong>Times</strong><small>Equilíbrio do elenco</small></span></button>
          <button class="quick-card" data-route="members"><span class="quick-icon">★</span><span><strong>Membros</strong><small>Posições e notas</small></span></button>
          <button class="quick-card" data-action="invite"><span class="quick-icon">↗</span><span><strong>Convidar</strong><small>WhatsApp e código</small></span></button>
        </div>
      </section>`;
    },

    matchesPage() {
      const upcoming = this.upcomingMatches();
      const past = this.pastMatches();
      const cards = list => list.length ? list.map(match => this.matchCard(match)).join("") : `<div class="card empty"><strong>Nenhum jogo</strong><span>Os registros aparecerão aqui.</span></div>`;
      return `<div class="page-head"><div><span class="page-kicker">CALENDÁRIO</span><h1>Jogos</h1><p>Próximas peladas e histórico permanente.</p></div>${this.canManageMatches() ? '<button class="btn btn-primary btn-small" data-action="new-match">+ Agendar</button>' : ""}</div><div class="section-title"><h2>Próximos</h2></div><div class="list">${cards(upcoming)}</div><div class="section-title"><h2>Histórico</h2><small>Jogos realizados não podem ser apagados.</small></div><div class="list">${cards(past)}</div>`;
    },

    matchCard(match) {
      const date = new Date(match.starts_at);
      const confirmed = this.confirmedFor(match.id);
      const future = date > new Date();
      return `<article class="card match-card"><div class="match-top"><div class="match-date"><small>${date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()}</small><strong>${String(date.getDate()).padStart(2, "0")}</strong></div><div class="match-info"><h3>${escapeHtml(match.title)}</h3><p>${escapeHtml(shortDate(match.starts_at))}<br>${escapeHtml(match.location)}</p></div><span class="status-pill ${future ? "status-maybe" : "status-confirmed"}">${future ? "Agendado" : "Histórico"}</span></div><div class="match-footer"><div class="avatar-stack">${confirmed.slice(0, 5).map(item => `<span>${initials(this.player(item.player_id)?.name)}</span>`).join("")}${confirmed.length > 5 ? `<span>+${confirmed.length - 5}</span>` : ""}</div><button class="btn btn-ghost btn-small" data-action="open-match" data-id="${match.id}">${confirmed.length}/${match.max_players} jogadores</button></div></article>`;
    },

    teamsPage() {
      const match = this.nextMatch() || this.pastMatches()[0];
      if (!match) return `<div class="page-head"><div><span class="page-kicker">ESCALAÇÃO</span><h1>Times</h1><p>Separação por posição e avaliação.</p></div></div><div class="card empty"><strong>Sem jogo disponível</strong><span>Agende uma pelada antes de montar os times.</span></div>`;
      const confirmed = this.confirmedFor(match.id).map(item => this.player(item.player_id)).filter(Boolean);
      const assignments = this.state.assignments.filter(item => item.match_id === match.id);
      const teams = [...new Set(assignments.map(item => item.team_name))];
      return `<div class="page-head"><div><span class="page-kicker">ESCALAÇÃO</span><h1>Times</h1><p>${escapeHtml(match.title)} · ${confirmed.length} confirmados</p></div>${this.canManageMatches() ? `<button class="btn btn-primary btn-small" data-action="draw-teams" data-id="${match.id}">${assignments.length ? "Rebalancear" : "Separar"}</button>` : ""}</div><div class="notice"><strong>Equilíbrio confidencial</strong><br>O servidor considera posição, goleiros e média das avaliações. Organizadores conseguem formar os times sem visualizar as notas.</div>${teams.length ? `<div class="team-grid">${teams.map(name => this.teamCard(name, assignments)).join("")}</div>` : `<div class="card empty"><strong>Times ainda não formados</strong><span>${confirmed.length < 2 ? "Aguarde mais confirmações." : "Use o botão Separar para gerar equipes equilibradas."}</span></div>`}<div class="section-title"><h2>Confirmados</h2></div><div class="list">${confirmed.map(player => this.playerRow(player, { showRating: this.canSeeRatings() })).join("") || '<div class="card empty">Nenhum confirmado.</div>'}</div>`;
    },

    teamCard(name, assignments) {
      const members = assignments.filter(item => item.team_name === name).sort((a, b) => a.slot - b.slot).map(item => this.player(item.player_id)).filter(Boolean);
      return `<section class="card team-card"><div class="team-head"><div class="team-shirt">${name.includes("Verde") ? "🟢" : name.includes("Azul") ? "🔵" : name.includes("Laranja") ? "🟠" : "⚪"}</div><strong>${escapeHtml(name)}</strong><small>${members.length} jogadores</small></div>${members.map(player => { const summary = this.ratingSummary(player.id); return `<div class="team-player">${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.nickname || player.name)}</strong><small>${escapeHtml(player.primary_position || "Sem posição")}${summary?.average ? ` · nota ${summary.average.toFixed(1)}` : ""}</small></div>${player.goalkeeper ? '<span class="score-pill">GOL</span>' : ""}</div>`; }).join("")}</section>`;
    },

    membersPage() {
      const group = this.currentGroup();
      const ownerMember = this.ownerMember();
      const ownerPlayer = this.memberPlayer(ownerMember);
      const admins = this.state.members.filter(member => member.role === "admin").map(member => this.memberPlayer(member)?.name).filter(Boolean);
      const sortedMembers = [...this.state.members].sort((a, b) => {
        const weight = { owner: 0, admin: 1, organizer: 2, treasurer: 3, member: 4 };
        return (weight[a.role] - weight[b.role]) || String(this.memberPlayer(a)?.name).localeCompare(String(this.memberPlayer(b)?.name));
      });
      return `<div class="page-head"><div><span class="page-kicker">ELENCO</span><h1>Membros do grupo</h1><p>Funções, posições e avaliações internas.</p></div><button class="btn btn-primary btn-small" data-action="invite">Convidar</button></div><section class="card group-summary-card"><div class="group-summary-main">${this.groupAvatar(group, "summary-group-avatar")}<div><h2>${escapeHtml(group.name)}</h2><p>Código ${escapeHtml(group.invite_code)}</p></div></div><div class="admin-summary"><div><small>Proprietário</small><strong>${escapeHtml(ownerPlayer?.name || "Não identificado")}</strong></div><div><small>Administradores</small><strong>${escapeHtml(admins.join(", ") || "Somente o proprietário")}</strong></div></div>${this.canManageGroup() ? '<button class="btn btn-secondary btn-block" data-action="manage-roles">Gerenciar funções</button>' : ""}</section><div class="members-actions"><button class="btn btn-primary" data-action="rate-members">Avaliar membros</button><button class="btn btn-secondary" data-action="profile">Minha posição</button></div><div class="section-title"><h2>Elenco (${sortedMembers.length})</h2>${this.canSeeRatings() ? '<small>As notas abaixo são visíveis somente à administração.</small>' : '<small>Suas avaliações são confidenciais.</small>'}</div><div class="list">${sortedMembers.map(member => this.memberRow(member)).join("")}</div>${this.canSeeRatings() ? this.privateRatingsPanel() : ""}`;
    },

    memberRow(member) {
      const player = this.memberPlayer(member) || { name: "Membro", primary_position: "Sem posição" };
      const summary = this.ratingSummary(player.id);
      const isMe = member.user_id === this.state.profile.id;
      return `<article class="card member-row">${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.name)}${isMe ? ' <span class="you-label">você</span>' : ""}</strong><small>${escapeHtml(player.primary_position || "Sem posição")}${player.nickname ? ` · ${escapeHtml(player.nickname)}` : ""}</small></div><div class="member-trailing"><span class="role-pill ${roleClass(member.role)}">${escapeHtml(roleLabels[member.role] || "Membro")}</span>${this.canSeeRatings() ? `<small class="private-score">${summary?.average ? `★ ${summary.average.toFixed(1)} (${summary.count})` : "Sem notas"}</small>` : ""}</div></article>`;
    },

    privateRatingsPanel() {
      const rated = this.activePlayers().map(player => ({ player, summary: this.ratingSummary(player.id) })).filter(item => item.summary?.count).sort((a, b) => b.summary.average - a.summary.average);
      return `<div class="section-title"><h2>Painel privado de notas</h2><span class="private-badge">🔒 Administração</span></div><section class="card private-panel">${rated.length ? rated.map((item, index) => `<div class="rating-summary-row"><span class="rank-pos">${index + 1}</span>${this.personAvatar(item.player)}<div class="list-main"><strong>${escapeHtml(item.player.name)}</strong><small>${escapeHtml(item.player.primary_position)} · ${item.summary.count} avaliação(ões)</small></div><strong>${item.summary.average.toFixed(2)}</strong></div>`).join("") : '<div class="empty"><strong>Nenhuma média disponível</strong><span>As notas aparecerão após os membros avaliarem o elenco.</span></div>'}</section>`;
    },

    playerRow(player, options = {}) {
      const summary = options.showRating ? this.ratingSummary(player.id) : null;
      return `<div class="card list-row">${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.primary_position || "Sem posição")} · ${player.games || 0} jogos</small></div>${summary?.average ? `<span class="score-pill">★ ${summary.average.toFixed(1)}</span>` : ""}</div>`;
    },

    financePage() {
      const payments = this.state.payments;
      const expenses = this.state.expenses;
      const income = payments.reduce((sum, item) => sum + Number(item.amount), 0);
      const out = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
      const charges = this.state.charges;
      const paid = charges.filter(item => item.status === "paid").length;
      const pct = charges.length ? Math.round(paid / charges.length * 100) : 0;
      const movements = [
        ...payments.map(item => ({ ...item, type: "income", description: item.description || `Pagamento · ${this.player(item.player_id)?.nickname || "Jogador"}`, date: item.paid_at })),
        ...expenses.map(item => ({ ...item, type: "expense", date: item.occurred_at }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      return `<div class="page-head"><div><span class="page-kicker">FINANCEIRO</span><h1>Caixa</h1><p>Mensalidades, quadra, materiais e churrasco.</p></div>${this.canManageFinance() ? '<button class="btn btn-primary btn-small" data-action="new-finance">+ Lançar</button>' : ""}</div>${!this.canManageFinance() ? '<div class="notice"><strong>Acesso de consulta</strong><br>Somente proprietário, administrador e tesoureiro podem alterar lançamentos.</div>' : '<div class="notice notice-success"><strong>Acesso autorizado</strong><br>Você pode registrar cobranças, pagamentos e despesas.</div>'}<section class="card balance-card"><small>Saldo atual</small><h2>${money(income - out)}</h2><div class="balance-grid"><div><small>Entradas</small><strong>${money(income)}</strong></div><div><small>Saídas</small><strong>${money(out)}</strong></div></div><div class="balance-track"><span style="width:${pct}%"></span></div><p>${paid} de ${charges.length} cobranças pagas · ${pct}%</p></section><div class="section-title"><h2>Movimentações</h2></div><div class="list">${movements.map(item => `<div class="card finance-row"><div class="finance-icon ${item.type === "income" ? "finance-income" : "finance-expense"}">${item.type === "income" ? "+" : "−"}</div><div class="list-main"><strong>${escapeHtml(item.description)}</strong><small>${escapeHtml(shortDate(item.date))}</small></div><strong class="money ${item.type === "income" ? "positive" : "negative"}">${item.type === "income" ? "+" : "−"}${money(item.amount)}</strong></div>`).join("") || '<div class="card empty">Sem movimentações.</div>'}</div><div class="section-title"><h2>Cobranças</h2></div><div class="list">${charges.map(charge => { const player = this.player(charge.player_id) || { name: "Grupo", primary_position: charge.description }; return `<div class="card list-row">${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(charge.description)} · ${money(charge.amount)}</small></div><span class="status-pill ${charge.status === "paid" ? "status-confirmed" : "status-out"}">${charge.status === "paid" ? "Pago" : "Pendente"}</span></div>`; }).join("") || '<div class="card empty">Nenhuma cobrança.</div>'}</div>`;
    },

    morePage() {
      const group = this.currentGroup();
      return `<div class="page-head"><div><span class="page-kicker">CONFIGURAÇÕES</span><h1>Mais</h1><p>Administração e dados da conta.</p></div></div><div class="list"><button class="card menu-row" data-action="profile"><span class="menu-icon">⚽</span><div class="list-main"><strong>Meu perfil de jogador</strong><small>Nome, apelido e posição.</small></div><strong>›</strong></button><button class="card menu-row" data-action="invite"><span class="menu-icon">↗</span><div class="list-main"><strong>Convidar pelo WhatsApp</strong><small>Código ${escapeHtml(group.invite_code)}</small></div><strong>›</strong></button>${this.canManageGroup() ? '<button class="card menu-row" data-action="group-settings"><span class="menu-icon">🛡</span><div class="list-main"><strong>Personalizar grupo</strong><small>Nome, escudo e administração.</small></div><strong>›</strong></button><button class="card menu-row" data-action="manage-roles"><span class="menu-icon">♟</span><div class="list-main"><strong>Gerenciar funções</strong><small>Administrador, organizador e tesoureiro.</small></div><strong>›</strong></button>' : ""}${this.canManageMatches() ? '<button class="card menu-row" data-action="announcement"><span class="menu-icon">!</span><div class="list-main"><strong>Avisos do grupo</strong><small>Publicar comunicado para o elenco.</small></div><strong>›</strong></button><button class="card menu-row" data-action="players"><span class="menu-icon">+</span><div class="list-main"><strong>Jogadores sem acesso</strong><small>Cadastrar convidado eventual.</small></div><strong>›</strong></button>' : ""}<button class="card menu-row" data-action="export"><span class="menu-icon">⇩</span><div class="list-main"><strong>Exportar dados</strong><small>Backup em arquivo JSON.</small></div><strong>›</strong></button><button class="card menu-row danger-row" data-action="sign-out"><span class="menu-icon danger-avatar">↪</span><div class="list-main"><strong>Sair da conta</strong><small>Desconectar e escolher outra conta Google.</small></div><strong>›</strong></button></div><div class="version-card">Resenha FC v0.3.1.2 · experiência visual e fluxo de grupos · Supabase · PWA</div>`;
    },

    async handleAction(action, data) {
      try {
        const actions = {
          "new-match": () => this.openMatchForm(),
          "open-match": () => this.openMatchDetails(data.id),
          rsvp: () => this.openRsvp(data.id || this.nextMatch()?.id),
          "draw-teams": () => this.drawTeams(data.id),
          "new-finance": () => this.openFinanceForm(),
          "rate-members": () => this.openMemberRatings(),
          players: () => this.openPlayers(),
          group: () => this.openGroupModal(),
          "create-group": () => this.openCreateGroupModal(),
          "join-group": () => this.openJoinGroupModal(),
          invite: () => this.openInviteModal(),
          "group-settings": () => this.openGroupSettings(),
          "manage-roles": () => this.openRoleManager(),
          announcement: () => this.openAnnouncementForm(),
          profile: () => this.openProfileModal(),
          export: () => this.exportData(),
          "sign-out": () => this.logout(),
          reload: () => location.reload()
        };
        if (actions[action]) await actions[action]();
      } catch (error) {
        console.error(error);
        this.toast(error.message || "Não foi possível concluir a ação.", true);
      }
    },

    renderAuth() {
      const error = oauthErrorFromLocation();
      document.body.innerHTML = `<main class="auth-screen"><section class="auth-panel"><div class="auth-stadium"><div class="auth-lights"></div><img class="auth-logo" src="login-logo-transparent-v0311.png" alt="Resenha FC" width="178" height="178"><span class="auth-kicker">SUA PELADA. SEU GRUPO. SEU APP.</span></div><div class="auth-copy"><h1>Entre em campo</h1><p>Presença, times equilibrados, membros, caixa e churrasco em um único lugar.</p>${error ? `<div class="notice auth-error"><strong>Falha no login</strong><br>${escapeHtml(error)}</div>` : ""}<div class="google-card"><div id="googleIdentityButton" class="google-identity-button" aria-label="Continuar com Google"></div><p id="googleLoginMessage">Use sua conta Google para continuar. Não há cadastro por e-mail ou senha.</p></div><div class="auth-features"><span>✓ Acesso seguro</span><span>✓ Dados em nuvem</span><span>✓ Sincronização entre celulares</span></div></div></section></main><div id="toastRoot" class="toast-root"></div>`;
      this.setupGoogleLogin();
      if (error && history.replaceState) history.replaceState({}, document.title, location.pathname);
    },

    async setupGoogleLogin() {
      const container = $("#googleIdentityButton");
      const message = $("#googleLoginMessage");
      const clientId = String(window.RESENHA_CONFIG?.googleClientId || "").trim();
      if (!/^[0-9a-z-]+\.apps\.googleusercontent\.com$/i.test(clientId)) {
        message.textContent = "Client ID do Google inválido no supabase-config.js.";
        message.classList.add("error-text");
        return;
      }
      try {
        await loadScriptOnce("google-identity-script", "https://accounts.google.com/gsi/client");
        const nonce = randomNonce();
        const hashedNonce = await sha256Hex(nonce);
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async response => {
            if (!response?.credential) return this.toast("O Google não retornou a credencial de acesso.", true);
            container.classList.add("is-loading");
            const { error } = await this.repo.signInWithGoogleIdToken(response.credential, nonce);
            if (error) {
              container.classList.remove("is-loading");
              return this.toast(error.message || "Não foi possível entrar com Google.", true);
            }
            window.location.replace(appBaseUrl());
          },
          nonce: hashedNonce,
          ux_mode: "popup",
          context: "signin",
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_prompt: true
        });
        container.innerHTML = "";
        const buttonWidth = Math.min(420, Math.max(260, container.parentElement?.clientWidth || container.clientWidth || 350));
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: buttonWidth
        });
        requestAnimationFrame(() => {
          const iframe = container.querySelector("iframe");
          if (iframe) {
            iframe.setAttribute("title", "Continuar com Google");
            container.classList.add("is-ready");
          } else {
            message.textContent = "O botão do Google não foi carregado. Atualize a página e tente novamente.";
            message.classList.add("error-text");
          }
        });
      } catch (error) {
        console.error(error);
        message.innerHTML = `Não foi possível carregar o acesso Google. <button class="link-button" data-action="reload">Tentar novamente</button>`;
        message.classList.add("error-text");
      }
    },

    renderConfigurationError() {
      document.body.innerHTML = `<main class="auth-screen"><section class="auth-panel simple-auth"><img class="auth-logo" src="login-logo-transparent-v0311.png" alt="Resenha FC"><h1>Configuração necessária</h1><p>Preencha Supabase URL, Publishable key e Google Client ID no arquivo <code>supabase-config.js</code>.</p><button class="btn btn-primary" data-action="reload">Verificar novamente</button></section></main>`;
    },

    renderBackendError(error) {
      document.body.innerHTML = `<main class="auth-screen"><section class="auth-panel simple-auth"><img class="auth-logo" src="login-logo-transparent-v0311.png" alt="Resenha FC"><h1>Falha na conexão</h1><p>${escapeHtml(error?.message || "Não foi possível acessar o backend.")}</p><button class="btn btn-primary" data-action="reload">Tentar novamente</button></section></main>`;
    },

    modal(title, content, onReady) {
      const root = $("#modalRoot");
      root.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true"><section class="modal"><div class="modal-handle"></div><div class="modal-head"><h2>${escapeHtml(title)}</h2><button class="modal-close" aria-label="Fechar">×</button></div><div class="modal-content">${content}</div></section></div>`;
      const close = () => { root.innerHTML = ""; };
      $(".modal-close", root).addEventListener("click", close);
      $(".modal-backdrop", root).addEventListener("click", event => { if (event.target.classList.contains("modal-backdrop")) close(); });
      onReady?.(root, close);
    },

    avatarPicker(selected = "badge-01") {
      return `<div class="avatar-picker">${Array.from({ length: 20 }, (_, index) => {
        const key = `badge-${String(index + 1).padStart(2, "0")}`;
        return `<label class="avatar-option"><input type="radio" name="avatar_key" value="${key}" ${key === avatarKey(selected) ? "checked" : ""}><img src="${groupAvatarUrl(key)}" alt="Escudo ${index + 1}"><span>✓</span></label>`;
      }).join("")}</div>`;
    },

    openGroupModal(prefillCode = "") {
      const groups = this.state.groups || [];
      const current = this.currentGroup();
      const list = groups.length
        ? `<div class="list group-list">${groups.map(group => {
            const editable = ["owner", "admin"].includes(group.role);
            return `<article class="card group-list-card"><button class="group-icon-action" data-edit-group="${group.id}" aria-label="${editable ? "Personalizar" : "Abrir"} ${escapeHtml(group.name)}">${this.groupAvatar(group)}</button><button class="group-select-action" data-group-id="${group.id}"><span class="list-main"><strong>${escapeHtml(group.name)}</strong><small>${escapeHtml(roleLabels[group.role])} · ${escapeHtml(group.invite_code)}</small></span>${group.id === current?.id ? '<span class="score-pill">Atual</span>' : '<strong>›</strong>'}</button></article>`;
          }).join("")}</div>`
        : `<div class="card empty compact-empty"><strong>Nenhum grupo ainda</strong><span>Crie o primeiro grupo ou entre com um código.</span></div>`;
      this.modal("Meus grupos", `<div class="group-modal-actions"><button class="btn btn-primary btn-small" id="openCreateGroup">+ Criar grupo</button><button class="btn btn-secondary btn-small" id="openJoinGroup">Inserir código</button></div>${list}`, (root, close) => {
        $("#openCreateGroup", root).addEventListener("click", () => { close(); setTimeout(() => this.openCreateGroupModal(), 0); });
        $("#openJoinGroup", root).addEventListener("click", () => { close(); setTimeout(() => this.openJoinGroupModal(prefillCode || this.pendingInvite), 0); });
        $$("[data-group-id]", root).forEach(button => button.addEventListener("click", async () => {
          await this.repo.loadGroup(button.dataset.groupId);
          this.state = this.repo.state;
          localStorage.setItem("resenha-current-group", button.dataset.groupId);
          close();
          this.render();
        }));
        $$("[data-edit-group]", root).forEach(button => button.addEventListener("click", async () => {
          const group = groups.find(item => item.id === button.dataset.editGroup);
          await this.repo.loadGroup(button.dataset.editGroup);
          this.state = this.repo.state;
          localStorage.setItem("resenha-current-group", button.dataset.editGroup);
          close();
          this.render();
          if (["owner", "admin"].includes(group?.role)) setTimeout(() => this.openGroupSettings(), 0);
        }));
      });
    },

    openCreateGroupModal() {
      this.modal("Criar grupo", `<form id="createGroupForm" class="form-grid create-group-form"><div class="notice notice-success"><strong>Seu grupo, sua identidade</strong><br>Escolha um nome e um escudo. Você será o proprietário e administrador inicial.</div><div class="field"><label>Nome do grupo</label><input name="name" required minlength="2" maxlength="80" placeholder="Ex.: Resenha de quinta" autocomplete="off"></div><div class="field"><label>Escolha o escudo</label>${this.avatarPicker()}</div><button class="btn btn-primary btn-block">Criar grupo</button></form>`, (root, close) => {
        $("#createGroupForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await this.repo.createGroup(form.get("name"), form.get("avatar_key"));
          this.state = this.repo.state;
          localStorage.setItem("resenha-current-group", this.state.currentGroupId);
          close();
          this.route = "home";
          this.render();
          this.toast("Grupo criado. Você é o proprietário e administrador.");
        });
      });
    },

    openJoinGroupModal(prefillCode = "") {
      this.modal("Entrar em um grupo", `<form id="joinGroupForm" class="form-grid"><div class="notice"><strong>Código de convite</strong><br>Peça o código ao administrador do grupo.</div><div class="field"><label>Código</label><input name="code" required value="${escapeHtml(prefillCode || this.pendingInvite)}" placeholder="Ex.: A1B2C3D4" autocapitalize="characters" autocomplete="off"></div><button class="btn btn-primary btn-block">Entrar no grupo</button></form>`, (root, close) => {
        $("#joinGroupForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await this.repo.joinGroup(form.get("code"));
          this.state = this.repo.state;
          localStorage.removeItem("resenha-pending-invite");
          this.pendingInvite = "";
          localStorage.setItem("resenha-current-group", this.state.currentGroupId);
          close();
          this.route = "home";
          this.render();
          this.toast("Você entrou no grupo como membro.");
        });
      });
    },

    openGroupSettings() {
      if (!this.canManageGroup()) return this.toast("Apenas proprietário e administrador podem personalizar o grupo.", true);
      const group = this.currentGroup();
      this.modal("Personalizar grupo", `<form id="groupSettingsForm" class="form-grid"><div class="field"><label>Nome</label><input name="name" value="${escapeHtml(group.name)}" required></div><div class="field"><label>Escudo</label>${this.avatarPicker(group.avatar_key)}</div><button class="btn btn-primary btn-block">Salvar alterações</button></form>`, (root, close) => {
        $("#groupSettingsForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await this.repo.updateGroup(group.id, form.get("name"), form.get("avatar_key"));
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Grupo atualizado.");
        });
      });
    },

    openInviteModal() {
      const group = this.currentGroup();
      if (!group) return this.openGroupModal();
      const url = new URL(appBaseUrl());
      url.searchParams.set("invite", group.invite_code);
      const message = `⚽ Você foi convidado para o grupo ${group.name} no Resenha FC!\n\nCódigo de convite: ${group.invite_code}\n\nAcesse ${url.href}\nEntre com sua conta Google e informe o código para participar.`;
      this.modal("Convidar para o grupo", `<section class="invite-card">${this.groupAvatar(group, "invite-avatar")}<h3>${escapeHtml(group.name)}</h3><p>Compartilhe o código com quem participará da pelada.</p><div class="invite-code"><strong>${escapeHtml(group.invite_code)}</strong><button id="copyInviteCode" aria-label="Copiar código">⧉</button></div><button class="btn btn-whatsapp btn-block" id="shareWhatsApp">WhatsApp</button><button class="btn btn-secondary btn-block" id="nativeShare">Compartilhar convite</button></section>`, (root) => {
        $("#copyInviteCode", root).addEventListener("click", async () => {
          await navigator.clipboard.writeText(group.invite_code);
          this.toast("Código copiado.");
        });
        $("#shareWhatsApp", root).addEventListener("click", () => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener"));
        $("#nativeShare", root).addEventListener("click", async () => {
          if (navigator.share) await navigator.share({ title: `Convite ${group.name}`, text: message, url: url.href });
          else {
            await navigator.clipboard.writeText(message);
            this.toast("Convite copiado.");
          }
        });
      });
    },

    openRoleManager() {
      if (!this.canManageGroup()) return this.toast("Sem permissão para gerenciar funções.", true);
      const actorRole = this.currentRole();
      const group = this.currentGroup();
      this.modal("Gerenciar funções", `<div class="notice"><strong>Proprietário</strong><br>Possui todas as permissões e pode transferir a propriedade. Administradores delegam organizador, tesoureiro ou membro.</div><div class="list">${this.state.members.map(member => {
        const player = this.memberPlayer(member) || { name: "Membro" };
        const isMe = member.user_id === this.state.profile.id;
        const canEdit = !isMe && member.role !== "owner" && (actorRole === "owner" || (actorRole === "admin" && member.role !== "admin"));
        const allowedRoles = actorRole === "owner" ? ["admin", "organizer", "treasurer", "member"] : ["organizer", "treasurer", "member"];
        return `<div class="card role-row">${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(roleLabels[member.role])}</small></div>${canEdit ? `<select class="role-select" data-role-user="${member.user_id}">${allowedRoles.map(role => `<option value="${role}" ${role === member.role ? "selected" : ""}>${roleLabels[role]}</option>`).join("")}</select>` : `<span class="role-pill ${roleClass(member.role)}">${roleLabels[member.role]}</span>`}${actorRole === "owner" && !isMe && member.role !== "owner" ? `<button class="transfer-button" data-transfer-owner="${member.user_id}" title="Transferir propriedade">♛</button>` : ""}</div>`;
      }).join("")}</div>`, (root, close) => {
        $$('[data-role-user]', root).forEach(select => select.addEventListener("change", async event => {
          event.currentTarget.disabled = true;
          await this.repo.setMemberRole(group.id, event.currentTarget.dataset.roleUser, event.currentTarget.value);
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Função atualizada.");
        }));
        $$('[data-transfer-owner]', root).forEach(button => button.addEventListener("click", async () => {
          const userId = button.dataset.transferOwner;
          const player = this.memberPlayer(this.state.members.find(member => member.user_id === userId));
          if (!confirm(`Transferir a propriedade do grupo para ${player?.name || "este membro"}? Você passará a administrador.`)) return;
          await this.repo.transferOwnership(group.id, userId);
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Propriedade transferida.");
        }));
      });
    },

    openMemberRatings() {
      const me = this.myPlayer();
      const players = this.activePlayers().filter(player => player.id !== me?.id && player.user_id);
      if (!players.length) return this.toast("Ainda não há outros membros para avaliar.", true);
      this.modal("Avaliar membros", `<div class="notice"><strong>Avaliação confidencial</strong><br>Dê uma nota de 1 a 10 considerando o desempenho geral no futebol. Somente proprietário e administradores visualizam médias e quantidade de avaliações.</div><form id="memberRatingsForm" class="ratings-form">${players.map(player => {
        const existing = this.myRating(player.id);
        const value = existing?.score || 7;
        return `<div class="rating-input-row">${this.personAvatar(player)}<div class="rating-control"><div><strong>${escapeHtml(player.name)}</strong><span data-rating-value="${player.id}">${Number(value).toFixed(1)}</span></div><small>${escapeHtml(player.primary_position || "Sem posição")}</small><input type="range" min="1" max="10" step="0.5" value="${value}" name="rating_${player.id}" data-rating-slider="${player.id}"></div></div>`;
      }).join("")}<button class="btn btn-primary btn-block">Enviar avaliações</button></form>`, (root, close) => {
        $$('[data-rating-slider]', root).forEach(slider => slider.addEventListener("input", event => {
          $(`[data-rating-value="${event.currentTarget.dataset.ratingSlider}"]`, root).textContent = Number(event.currentTarget.value).toFixed(1);
        }));
        $("#memberRatingsForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const button = event.submitter;
          button.disabled = true;
          button.textContent = "Enviando...";
          const form = new FormData(event.currentTarget);
          for (const player of players) await this.repo.rateMember(this.state.currentGroupId, player.id, form.get(`rating_${player.id}`));
          await this.repo.loadGroup(this.state.currentGroupId, { subscribe: false });
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Avaliações salvas com confidencialidade.");
        });
      });
    },

    openProfileModal() {
      const profile = this.state.profile || {};
      const player = this.myPlayer();
      const photo = safeImageUrl(profile.avatar_url);
      this.modal("Meu perfil", `<div class="profile-summary">${photo ? `<img class="profile-photo" src="${escapeHtml(photo)}" alt="" referrerpolicy="no-referrer">` : `<div class="profile-photo profile-initials">${initials(profile.name)}</div>`}<div><strong>${escapeHtml(profile.name)}</strong><small>${escapeHtml(profile.email)}</small><span class="role-pill ${roleClass(this.currentRole())}">${roleLabels[this.currentRole()]}</span></div></div><form id="profileForm" class="form-grid"><div class="field"><label>Nome</label><input name="name" value="${escapeHtml(profile.name || "")}" required></div>${player ? `<div class="field"><label>Apelido no grupo</label><input name="nickname" value="${escapeHtml(player.nickname || "")}" placeholder="Como aparece na escalação"></div><div class="field-row"><div class="field"><label>Posição principal</label><select name="primary_position">${positionOptions.map(position => `<option ${position === player.primary_position ? "selected" : ""}>${position}</option>`).join("")}</select></div><div class="field"><label>Posição secundária</label><select name="secondary_position"><option value="">Nenhuma</option>${positionOptions.map(position => `<option ${position === player.secondary_position ? "selected" : ""}>${position}</option>`).join("")}</select></div></div><label class="check-row"><input name="goalkeeper" type="checkbox" ${player.goalkeeper ? "checked" : ""}> Também posso jogar no gol</label>` : ""}<button class="btn btn-primary btn-block">Salvar perfil</button></form><div class="account-separator"></div><button class="btn btn-danger btn-block" id="profileLogoutButton">Sair da conta</button>`, (root, close) => {
        $("#profileForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await this.repo.setProfile(form.get("name"));
          if (player) await this.repo.updateMyPlayer(this.state.currentGroupId, {
            nickname: form.get("nickname"),
            primaryPosition: form.get("primary_position"),
            secondaryPosition: form.get("secondary_position"),
            goalkeeper: form.get("goalkeeper") === "on"
          });
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Perfil atualizado.");
        });
        $("#profileLogoutButton", root).addEventListener("click", async () => { close(); await this.logout(); });
      });
    },

    openMatchForm() {
      if (!this.canManageMatches()) return this.toast("Seu perfil não pode criar jogos.", true);
      const date = new Date(Date.now() + 7 * 86400000);
      date.setHours(20, 0, 0, 0);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      this.modal("Agendar pelada", `<form id="matchForm" class="form-grid"><div class="field"><label>Título</label><input name="title" required value="Pelada semanal"></div><div class="field"><label>Data e hora</label><input name="starts_at" type="datetime-local" min="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}" required value="${local}"></div><div class="field"><label>Local</label><input name="location" required placeholder="Arena e número da quadra"></div><div class="field-row"><div class="field"><label>Máximo de jogadores</label><input name="max_players" type="number" min="4" max="60" value="12"></div><div class="field"><label>Jogadores por time</label><input name="players_per_team" type="number" min="2" max="11" value="6"></div></div><label class="check-row"><input name="bbq_enabled" type="checkbox" checked> Organizar churrasco após o jogo</label><div class="field"><label>Valor do churrasco por pessoa</label><input name="bbq_price" type="number" min="0" step="0.01" value="25"></div><div class="field"><label>Observações</label><textarea name="notes" placeholder="Uniforme, prazo, regras..."></textarea></div><button class="btn btn-primary btn-block">Criar jogo</button></form>`, (root, close) => {
        $("#matchForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const startsAt = new Date(form.get("starts_at"));
          if (startsAt <= new Date()) return this.toast("Escolha uma data futura.", true);
          await this.repo.mutate("matches", {
            id: uid(),
            group_id: this.state.currentGroupId,
            title: form.get("title"),
            starts_at: startsAt.toISOString(),
            location: form.get("location"),
            max_players: Number(form.get("max_players")),
            players_per_team: Number(form.get("players_per_team")),
            status: "scheduled",
            bbq_enabled: form.get("bbq_enabled") === "on",
            bbq_price: Number(form.get("bbq_price") || 0),
            notes: form.get("notes") || "",
            created_at: nowIso()
          });
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Pelada agendada.");
        });
      });
    },

    openMatchDetails(id) {
      const match = this.state.matches.find(item => item.id === id);
      if (!match) return;
      const future = new Date(match.starts_at) > new Date();
      const grouped = { confirmed: [], maybe: [], waitlist: [], out: [] };
      this.attendanceFor(id).forEach(item => grouped[item.status]?.push(item));
      const groupHtml = (title, key) => `<div class="section-title"><h2>${title} (${grouped[key].length})</h2></div><div class="list">${grouped[key].map(item => this.playerRow(this.player(item.player_id) || { name: "Jogador" })).join("") || '<div class="card empty">Nenhum.</div>'}</div>`;
      this.modal(match.title, `<div class="match-detail-banner"><span class="status-pill ${future ? "status-maybe" : "status-confirmed"}">${future ? "Agendado" : "Histórico"}</span><strong>${escapeHtml(shortDate(match.starts_at))}</strong><p>${escapeHtml(match.location)}</p>${match.notes ? `<small>${escapeHtml(match.notes)}</small>` : ""}</div><div class="actions"><button class="btn btn-primary" data-modal-rsvp="${match.id}">${future ? "Minha presença" : "Ver minha resposta"}</button>${this.canManageMatches() ? `<button class="btn btn-secondary" data-modal-teams="${match.id}">Separar times</button>` : ""}</div>${future && this.canManageMatches() ? `<button class="btn btn-danger btn-block delete-match-button" data-delete-match="${match.id}">Excluir jogo agendado</button><p class="danger-help">Esta opção desaparece após o horário do evento. Jogos realizados permanecem no histórico.</p>` : ""}${groupHtml("Confirmados", "confirmed")}${groupHtml("Talvez", "maybe")}${groupHtml("Lista de espera", "waitlist")}${groupHtml("Não vão", "out")}`, (root, close) => {
        $("[data-modal-rsvp]", root).addEventListener("click", () => { close(); this.openRsvp(match.id); });
        $("[data-modal-teams]", root)?.addEventListener("click", async () => { close(); await this.drawTeams(match.id); });
        $("[data-delete-match]", root)?.addEventListener("click", async () => {
          if (!confirm("Excluir definitivamente este jogo agendado?")) return;
          await this.repo.deleteMatch(match.id);
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Jogo excluído.");
        });
      });
    },

    openRsvp(matchId) {
      const match = this.state.matches.find(item => item.id === matchId);
      if (!match) return this.toast("Crie um jogo primeiro.", true);
      if (new Date(match.starts_at) <= new Date()) return this.toast("A confirmação está encerrada para jogos do histórico.", true);
      const player = this.myPlayer();
      if (!player) return this.toast("Seu perfil de jogador não foi encontrado.", true);
      const current = this.state.attendance.find(item => item.match_id === matchId && item.player_id === player.id) || {};
      this.modal("Confirmar presença", `<form id="rsvpForm" class="form-grid"><div class="notice"><strong>${escapeHtml(match.title)}</strong><br>${escapeHtml(shortDate(match.starts_at))} · ${escapeHtml(match.location)}</div><div class="radio-grid">${[["confirmed", "Vou jogar"], ["maybe", "Talvez"], ["out", "Não vou"], ["waitlist", "Espera"]].map(([value, label]) => `<label class="radio-card"><input type="radio" name="status" value="${value}" ${current.status === value || (!current.status && value === "confirmed") ? "checked" : ""}>${label}</label>`).join("")}</div>${match.bbq_enabled ? `<label class="check-row"><input type="checkbox" name="bbq" ${current.bbq ? "checked" : ""}> Participarei do churrasco</label><div class="field"><label>Acompanhantes</label><input type="number" name="bbq_guests" min="0" max="20" value="${current.bbq_guests || 0}"></div><div class="field"><label>O que vou levar</label><input name="bbq_note" value="${escapeHtml(current.bbq_note || "")}" placeholder="Refrigerante, pão de alho..."></div>` : ""}<button class="btn btn-primary btn-block">Salvar resposta</button></form>`, (root, close) => {
        $("#rsvpForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          let status = form.get("status");
          const otherConfirmed = this.confirmedFor(matchId).filter(item => item.player_id !== player.id);
          let waitlisted = false;
          if (status === "confirmed" && current.status !== "confirmed" && otherConfirmed.length >= Number(match.max_players)) {
            status = "waitlist";
            waitlisted = true;
          }
          await this.repo.mutate("attendance", {
            id: current.id || uid(),
            match_id: matchId,
            player_id: player.id,
            status,
            bbq: form.get("bbq") === "on",
            bbq_guests: Number(form.get("bbq_guests") || 0),
            bbq_note: form.get("bbq_note") || "",
            responded_at: nowIso()
          });
          this.state = this.repo.state;
          close();
          this.render();
          this.toast(waitlisted ? "Vagas preenchidas. Você entrou na lista de espera." : "Presença atualizada.");
        });
      });
    },

    async drawTeams(matchId) {
      if (!this.canManageMatches()) return this.toast("Seu perfil não pode formar os times.", true);
      await this.repo.balanceTeams(matchId);
      this.state = this.repo.state;
      this.route = "teams";
      this.render();
      this.toast("Times equilibrados por posição e avaliação.");
    },

    openFinanceForm() {
      if (!this.canManageFinance()) return this.toast("Somente administração e tesouraria podem alterar o caixa.", true);
      const players = this.activePlayers();
      this.modal("Novo lançamento", `<form id="financeForm" class="form-grid"><div class="field"><label>Tipo</label><select name="type"><option value="payment">Pagamento recebido</option><option value="expense">Despesa</option><option value="charge">Nova cobrança</option></select></div><div class="field"><label>Jogador</label><select name="player_id"><option value="">Não se aplica</option>${players.map(player => `<option value="${player.id}">${escapeHtml(player.name)}</option>`).join("")}</select></div><div class="field"><label>Descrição</label><input name="description" required placeholder="Mensalidade, quadra, bola..."></div><div class="field"><label>Valor</label><input name="amount" type="number" min="0.01" step="0.01" required></div><button class="btn btn-primary btn-block">Salvar lançamento</button></form>`, (root, close) => {
        $("#financeForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const type = form.get("type");
          const playerId = form.get("player_id") || null;
          const base = { id: uid(), group_id: this.state.currentGroupId, description: form.get("description"), amount: Number(form.get("amount")), player_id: playerId };
          if (type === "payment") {
            const charge = this.state.charges.filter(item => item.player_id === playerId && !["paid", "cancelled"].includes(item.status)).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0];
            await this.repo.recordPayment({ ...base, paid_at: nowIso(), method: "manual" }, charge);
          } else if (type === "expense") {
            await this.repo.mutate("expenses", { ...base, occurred_at: nowIso(), category: "outros" });
          } else {
            await this.repo.mutate("charges", { ...base, due_date: new Date().toISOString().slice(0, 10), status: "open" });
          }
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Lançamento salvo.");
        });
      });
    },

    openPlayers() {
      this.modal("Jogadores sem acesso", `${this.canManageMatches() ? '<button class="btn btn-primary btn-block" id="addPlayer">+ Cadastrar convidado</button>' : ""}<div class="section-title"><h2>Jogadores ativos</h2></div><div class="list">${this.activePlayers().filter(player => !player.user_id).map(player => this.playerRow(player)).join("") || '<div class="card empty">Nenhum convidado cadastrado.</div>'}</div>`, root => {
        $("#addPlayer", root)?.addEventListener("click", () => this.openPlayerForm());
      });
    },

    openPlayerForm() {
      if (!this.canManageMatches()) return this.toast("Sem permissão para cadastrar convidados.", true);
      this.modal("Cadastrar convidado", `<form id="playerForm" class="form-grid"><div class="field"><label>Nome completo</label><input name="name" required></div><div class="field"><label>Apelido</label><input name="nickname"></div><div class="field"><label>Posição</label><select name="position">${positionOptions.map(position => `<option>${position}</option>`).join("")}</select></div><label class="check-row"><input name="goalkeeper" type="checkbox"> Também joga no gol</label><button class="btn btn-primary btn-block">Cadastrar</button></form>`, (root, close) => {
        $("#playerForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const position = form.get("position");
          await this.repo.mutate("players", {
            id: uid(),
            group_id: this.state.currentGroupId,
            user_id: null,
            name: form.get("name"),
            nickname: form.get("nickname") || String(form.get("name")).split(" ")[0],
            skill: 3.5,
            fair_play: 4,
            conditioning: 3.5,
            primary_position: position,
            secondary_position: "",
            goalkeeper: form.get("goalkeeper") === "on" || position === "Goleiro",
            active: true,
            games: 0,
            wins: 0,
            goals: 0,
            assists: 0
          });
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Convidado cadastrado.");
        });
      });
    },

    openAnnouncementForm() {
      if (!this.canManageMatches()) return this.toast("Sem permissão para publicar avisos.", true);
      this.modal("Publicar aviso", `<form id="noticeForm" class="form-grid"><div class="field"><label>Título</label><input name="title" required></div><div class="field"><label>Mensagem</label><textarea name="body" required></textarea></div><button class="btn btn-primary btn-block">Publicar</button></form>`, (root, close) => {
        $("#noticeForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await this.repo.mutate("announcements", { id: uid(), group_id: this.state.currentGroupId, title: form.get("title"), body: form.get("body"), created_at: nowIso() });
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Aviso publicado.");
        });
      });
    },

    async logout() {
      if (!confirm("Deseja sair da sua conta neste aparelho?")) return;
      await this.repo.signOut();
      localStorage.removeItem("resenha-current-group");
      window.location.replace(appBaseUrl());
    },

    exportData() {
      const exportState = { ...this.state, member_ratings: this.canSeeRatings() ? this.state.member_ratings : this.state.member_ratings.filter(item => item.rater_user_id === this.state.profile.id) };
      const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resenha-fc-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.toast("Arquivo de dados gerado.");
    },

    toast(message, error = false) {
      let root = $("#toastRoot");
      if (!root) {
        root = document.createElement("div");
        root.id = "toastRoot";
        root.className = "toast-root";
        document.body.appendChild(root);
      }
      const toast = document.createElement("div");
      toast.className = `toast${error ? " error" : ""}`;
      toast.textContent = message;
      root.appendChild(toast);
      setTimeout(() => toast.remove(), 3600);
    }
  };

  window.App = App;

  async function boot() {
    const config = window.RESENHA_CONFIG || {};
    const cloudConfigured = Boolean(config.supabaseUrl && config.supabasePublishableKey);
    if (cloudConfigured && !window.supabase) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Não foi possível carregar o cliente de nuvem."));
        document.head.appendChild(script);
      }).catch(error => {
        window.RESENHA_CLOUD_LOAD_ERROR = error;
      });
    }
    App.init();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
