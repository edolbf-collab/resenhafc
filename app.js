(() => {
  "use strict";

  const APP_RELEASE = Object.freeze({ channel: "beta", version: "Beta 1.0", build: 114, database: 114, edge: 103 });
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
    return window.RESENHA_GROUP_AVATARS?.[normalized] || assetUrl(`assets/group-avatars/${normalized}.png?v=beta102`);
  };
  const positionOptions = ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Atacante", "Coringa"];
  const roleLabels = { owner: "Administrador", admin: "Administrador", organizer: "Organizador", treasurer: "Tesoureiro", member: "Membro" };
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
  const base64UrlToUint8Array = value => {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
  };
  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const deviceLabel = () => isIos() ? "iPhone/iPad" : /android/i.test(navigator.userAgent) ? "Android" : "Navegador";

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
        announcements: [],
        push_subscriptions: [],
        is_platform_admin: false,
        beta_access: null
      };
      this.channel = null;
      this.subscribedGroupId = null;
      this.reloadTimer = null;
    }

    async session() {
      return (await this.client.auth.getSession()).data.session;
    }

    async claimBetaAccess() {
      const { data, error } = await this.client.rpc("claim_beta_access");
      if (error) {
        const denied = new Error(error.message || "Acesso ao beta não autorizado.");
        denied.betaAccessDenied = true;
        throw denied;
      }
      this.state.beta_access = data || null;
      return data;
    }

    async signInWithGoogleIdToken(token, nonce) {
      return this.client.auth.signInWithIdToken({ provider: "google", token, nonce });
    }

    async signInWithGoogleOAuth() {
      const configuredRedirect = String(this.config.authRedirectUrl || "").trim();
      const redirectTo = configuredRedirect || appBaseUrl();
      return this.client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" }
        }
      });
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
      await this.claimBetaAccess();

      const { data: memberships, error } = await this.client
        .from("group_members")
        .select("role,player_id,groups(id,name,invite_code,avatar_key,created_by,created_at,default_players_per_team,monthly_fee)")
        .eq("user_id", user.id);
      if (error) throw error;

      this.state.groups = (memberships || []).filter(item => item.groups).map(item => ({ ...item.groups, role: item.role, player_id: item.player_id }));
      const preferred = this.state.groups.find(group => group.id === preferredGroupId)?.id;
      this.state.currentGroupId = preferred || this.state.groups[0]?.id || null;
      if (this.state.currentGroupId) {
        await this.loadGroup(this.state.currentGroupId);
      } else {
        ["members", "players", "matches", "attendance", "assignments", "charges", "payments", "expenses", "member_ratings", "match_events", "announcements", "push_subscriptions"].forEach(key => { this.state[key] = []; });
      }
      try {
        const { data } = await this.client.rpc("is_platform_admin");
        this.state.is_platform_admin = data === true;
      } catch (error) {
        console.warn("Não foi possível verificar a administração da plataforma.", error);
      }
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

      const subscriptions = await this.client.from("push_subscriptions").select("id,endpoint,device_label,enabled,created_at,updated_at").eq("user_id", this.state.profile.id);
      if (subscriptions.error) throw subscriptions.error;
      this.state.push_subscriptions = subscriptions.data || [];

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

    async deleteGroup(groupId, confirmation) {
      clearTimeout(this.reloadTimer);
      const { error } = await this.client.rpc("delete_group_permanently", {
        p_group_id: groupId,
        p_confirmation: confirmation
      });
      if (error) throw error;
      if (this.channel) {
        await this.client.removeChannel(this.channel);
        this.channel = null;
        this.subscribedGroupId = null;
      }
      await this.init(null);
      return this.state;
    }

    async createMatchSchedule(payload) {
      const { data, error } = await this.client.rpc("create_match_schedule", {
        p_group_id: payload.groupId,
        p_title: payload.title,
        p_starts_at: payload.startsAt,
        p_location: payload.location,
        p_max_players: payload.maxPlayers,
        p_players_per_team: payload.playersPerTeam,
        p_bbq_enabled: payload.bbqEnabled,
        p_bbq_price: payload.bbqPrice,
        p_notes: payload.notes || "",
        p_occurrences: payload.occurrences || 1
      });
      if (error) throw error;
      await this.loadGroup(payload.groupId, { subscribe: false });
      return data || [];
    }

    async setMemberRole(groupId, userId, role) {
      const { error } = await this.client.rpc("set_member_role", { p_group_id: groupId, p_user_id: userId, p_role: role });
      if (error) throw error;
      return this.loadGroup(groupId, { subscribe: false });
    }

    async transferAdministration(groupId, userId) {
      const { error } = await this.client.rpc("transfer_group_administration", { p_group_id: groupId, p_new_admin_user_id: userId });
      if (error) throw error;
      await this.init(groupId);
    }

    async removeGroupMember(groupId, userId) {
      const { error } = await this.client.rpc("remove_group_member", {
        p_group_id: groupId,
        p_user_id: userId
      });
      if (error) throw error;
      return this.loadGroup(groupId, { subscribe: false });
    }

    async updateMatchBbq(matchId, enabled, price) {
      const { error } = await this.client.rpc("update_match_bbq_settings", {
        p_match_id: matchId,
        p_enabled: Boolean(enabled),
        p_price: Number(price || 0)
      });
      if (error) throw error;
      return this.loadGroup(this.state.currentGroupId, { subscribe: false });
    }

    async setMyAttendance(matchId, payload) {
      const { data, error } = await this.client.rpc("set_my_match_attendance", {
        p_match_id: matchId,
        p_status: payload.status,
        p_bbq: Boolean(payload.bbq),
        p_bbq_guests: Number(payload.bbqGuests || 0),
        p_bbq_note: payload.bbqNote || ""
      });
      if (error) throw error;
      await this.loadGroup(this.state.currentGroupId, { subscribe: false });
      return data || {};
    }

    async manageAttendances(matchId, changes) {
      const { data, error } = await this.client.rpc("manage_match_attendance_batch", {
        p_match_id: matchId,
        p_changes: changes.map(change => ({ player_id: change.playerId, status: change.status }))
      });
      if (error) throw error;
      await this.loadGroup(this.state.currentGroupId, { subscribe: false });
      return data || {};
    }

    async drawMatchWaitlist(matchId, playerIds, waitlistCount) {
      const { data, error } = await this.client.rpc("draw_match_waitlist_v2", {
        p_match_id: matchId,
        p_player_ids: playerIds,
        p_waitlist_count: Number(waitlistCount)
      });
      if (error) throw error;
      await this.loadGroup(this.state.currentGroupId, { subscribe: false });
      return data || {};
    }

    async createMatchGuest(payload) {
      const { data, error } = await this.client.rpc("create_match_guest", {
        p_match_id: payload.matchId,
        p_name: payload.name,
        p_nickname: payload.nickname || "",
        p_primary_position: payload.position,
        p_goalkeeper: Boolean(payload.goalkeeper)
      });
      if (error) throw error;
      await this.loadGroup(this.state.currentGroupId, { subscribe: false });
      return data;
    }

    async updateMatchGuest(payload) {
      const { data, error } = await this.client.rpc("update_match_guest", {
        p_player_id: payload.playerId,
        p_name: payload.name,
        p_nickname: payload.nickname || "",
        p_primary_position: payload.position,
        p_goalkeeper: Boolean(payload.goalkeeper)
      });
      if (error) throw error;
      await this.loadGroup(this.state.currentGroupId, { subscribe: false });
      return data;
    }

    async deleteMatchGuest(playerId) {
      const { data, error } = await this.client.rpc("delete_match_guest", { p_player_id: playerId });
      if (error) throw error;
      await this.loadGroup(this.state.currentGroupId, { subscribe: false });
      return data;
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

    async deleteMatchSeries(matchId) {
      const { error } = await this.client.rpc("delete_scheduled_match_series", { p_match_id: matchId });
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

    async savePushSubscription(subscription) {
      const json = subscription.toJSON();
      const endpoint = String(json.endpoint || "").trim();
      const { error } = await this.client.rpc("save_push_subscription", {
        p_endpoint: endpoint,
        p_p256dh: json.keys?.p256dh || "",
        p_auth: json.keys?.auth || "",
        p_device_label: deviceLabel(),
        p_user_agent: navigator.userAgent
      });
      if (error) throw error;

      const verification = await this.client
        .from("push_subscriptions")
        .select("id,endpoint,device_label,enabled,created_at,updated_at")
        .eq("user_id", this.state.profile.id)
        .eq("endpoint", endpoint)
        .eq("enabled", true)
        .maybeSingle();
      if (verification.error) throw verification.error;
      if (!verification.data) throw new Error("O aparelho autorizou notificações, mas a assinatura não foi vinculada ao seu usuário no banco.");

      await this.loadGroup(this.state.currentGroupId, { subscribe: false });
      return verification.data;
    }

    async removePushSubscription(endpoint) {
      if (!endpoint) return;
      const { error } = await this.client.rpc("remove_push_subscription", { p_endpoint: endpoint });
      if (error) throw error;
      this.state.push_subscriptions = this.state.push_subscriptions.filter(item => item.endpoint !== endpoint);
    }

    async invokeNotification(payload) {
      const { data, error } = await this.client.functions.invoke("publish-announcement", { body: payload });
      if (error) {
        let message = error?.message || "A Edge Function recusou o envio da notificação.";
        let details = null;
        try {
          const response = error?.context;
          if (response && typeof response.clone === "function") {
            details = await response.clone().json().catch(async () => {
              const text = await response.text().catch(() => "");
              return text ? { error: text } : null;
            });
          }
        } catch (parseError) {
          console.warn("Não foi possível ler o retorno da Edge Function:", parseError);
        }
        if (details?.error || details?.message) {
          message = details.error || details.message;
          if (details.stage) message += ` [etapa: ${details.stage}]`;
        }
        const wrapped = new Error(message);
        wrapped.cause = error;
        wrapped.details = details;
        throw wrapped;
      }
      if (data?.error) throw new Error(data.error);
      return data || {};
    }

    async publishSystemNotification(title, body) {
      return this.invokeNotification({ action: "system-publish", title, body });
    }

    async publishAnnouncement(groupId, title, body) {
      const data = await this.invokeNotification({ action: "publish", groupId, title, body });
      if (!data?.announcement) throw new Error("O aviso não foi criado.");
      await this.loadGroup(groupId, { subscribe: false });
      return data;
    }

    async resendAnnouncement(groupId, announcementId) {
      const data = await this.invokeNotification({ action: "resend", groupId, announcementId });
      await this.loadGroup(groupId, { subscribe: false });
      return data;
    }

    async deleteAnnouncement(announcementId) {
      const { error } = await this.client.rpc("delete_announcement", { p_announcement_id: announcementId });
      if (error) throw error;
      return this.loadGroup(this.state.currentGroupId, { subscribe: false });
    }

    async notifyMatchCreated(groupId, matchId) {
      return this.invokeNotification({
        action: "match-created",
        groupId,
        matchId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo"
      });
    }

    async notifyAttendanceConfirmed(groupId, matchId, playerId) {
      return this.invokeNotification({
        action: "attendance-confirmed",
        groupId,
        matchId,
        playerId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo"
      });
    }

    async deleteFinanceEntry(groupId, entryType, entryId) {
      const { error } = await this.client.rpc("delete_finance_entry", {
        p_group_id: groupId,
        p_entry_type: entryType,
        p_entry_id: entryId
      });
      if (error) throw error;
      return this.loadGroup(groupId, { subscribe: false });
    }

    async logEvent(eventType, metadata = {}, severity = "info") {
      try {
        await this.client.rpc("log_app_event", {
          p_event_type: String(eventType || "event").slice(0, 80),
          p_group_id: this.state.currentGroupId || null,
          p_severity: severity,
          p_metadata: {
            ...metadata,
            build: APP_RELEASE.build,
            version: APP_RELEASE.version,
            route: window.App?.route || "",
            device: deviceLabel(),
            userAgent: navigator.userAgent.slice(0, 500)
          }
        });
      } catch (error) {
        console.warn("Falha ao registrar evento de diagnóstico.", error);
      }
    }

    async reportProblem(payload) {
      const { data, error } = await this.client.rpc("submit_beta_feedback", {
        p_group_id: this.state.currentGroupId || null,
        p_category: payload.category,
        p_title: payload.title,
        p_description: payload.description,
        p_contact_ok: payload.contactOk,
        p_context: {
          build: APP_RELEASE.build,
          version: APP_RELEASE.version,
          route: window.App?.route || "",
          device: deviceLabel(),
          standalone: isStandalone(),
          notificationPermission: pushSupported() ? Notification.permission : "unsupported",
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          userAgent: navigator.userAgent.slice(0, 500)
        }
      });
      if (error) throw error;
      return data;
    }

    async platformDashboard() {
      const [summary, reports, logs, errorGroups, accessList, security] = await Promise.all([
        this.client.rpc("platform_beta_summary"),
        this.client.rpc("platform_recent_feedback", { p_limit: 30 }),
        this.client.rpc("platform_recent_logs", { p_limit: 50 }),
        this.client.rpc("platform_error_groups", { p_hours: 24, p_limit: 40 }),
        this.client.rpc("platform_beta_access_list", { p_limit: 300 }),
        this.client.rpc("platform_security_summary")
      ]);
      for (const result of [summary, reports, logs, errorGroups, accessList, security]) if (result.error) throw result.error;
      return {
        summary: summary.data || {},
        reports: reports.data || [],
        logs: logs.data || [],
        errorGroups: errorGroups.data || [],
        accessList: accessList.data || [],
        security: security.data || {}
      };
    }

    async inviteBetaAccess(email, notes = "") {
      const { data, error } = await this.client.rpc("platform_beta_access_invite", { p_email: email, p_notes: notes });
      if (error) throw error;
      return data;
    }

    async setBetaAccessStatus(email, status) {
      const { data, error } = await this.client.rpc("platform_beta_access_set_status", { p_email: email, p_status: status });
      if (error) throw error;
      return data;
    }

    async platformErrorDetails(group, limit = 120) {
      const { data, error } = await this.client.rpc("platform_error_details", {
        p_event_type: group.event_type,
        p_message: group.message,
        p_source: group.source || "",
        p_line: group.line || "",
        p_build: group.build || "",
        p_limit: limit
      });
      if (error) throw error;
      return data || [];
    }

    async platformOperationalExport(days = 30, logLimit = 5000) {
      const { data, error } = await this.client.rpc("platform_operational_export", { p_days: days, p_log_limit: logLimit });
      if (error) throw error;
      return data || {};
    }

    async appRelease() {
      const { data, error } = await this.client.from("app_releases").select("*").eq("channel", "beta").eq("active", true).order("build", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    }

  }

  const App = {
    route: "home",
    repo: null,
    state: null,
    pendingInvite: "",
    launchAction: "",
    launchGroupId: "",
    launchAnnouncementId: "",
    launchMatchId: "",
    swRegistration: null,
    updateAvailable: null,
    lastSyncAt: null,
    accessCheckTimer: null,

    async init() {
      this.bindGlobal();
      this.captureInviteIntent();
      const config = window.RESENHA_CONFIG || {};
      if (!(config.supabaseUrl && config.supabasePublishableKey)) return this.renderConfigurationError();
      if (!window.supabase) return this.renderBackendError(window.RESENHA_CLOUD_LOAD_ERROR || new Error("Não foi possível carregar o cliente Supabase."));

      this.repo = new SupabaseRepository(config);
      try {
        this.state = await this.repo.init(this.launchGroupId || localStorage.getItem("resenha-current-group") || null);
        if (!this.state) return this.renderAuth();
        this.lastSyncAt = nowIso();
        this.render();
        this.startAccessMonitor();
        await this.registerServiceWorker();
        this.repo.logEvent("app_open", { groups: this.state.groups.length });
        this.checkForUpdates();
        navigator.clearAppBadge?.().catch?.(() => {});
        if (this.pendingInvite) setTimeout(() => this.openJoinGroupModal(this.pendingInvite), 80);
        else if (this.launchAction === "rsvp") setTimeout(() => this.openRsvp(this.nextMatch()?.id), 80);
        else if (this.launchAnnouncementId) setTimeout(() => this.openAnnouncementCenter(this.launchAnnouncementId), 120);
        else if (this.launchMatchId) setTimeout(() => this.openMatchDetails(this.launchMatchId), 120);
        setTimeout(() => this.maybeShowNotificationOnboarding(), 650);
      } catch (error) {
        console.error(error);
        if (error?.betaAccessDenied || /beta fechado|acesso ao beta|não está autorizado|acesso.*bloqueado/i.test(error?.message || "")) {
          return this.renderBetaAccessDenied(error);
        }
        this.renderBackendError(error);
      }
    },

    startAccessMonitor() {
      clearInterval(this.accessCheckTimer);
      this.accessCheckTimer = setInterval(() => this.verifyBetaAccess(), 120000);
    },

    async verifyBetaAccess() {
      if (!this.repo || !this.state?.profile || !navigator.onLine) return;
      try {
        await this.repo.claimBetaAccess();
      } catch (error) {
        if (error?.betaAccessDenied || /beta fechado|acesso ao beta|não está autorizado|acesso.*bloqueado/i.test(error?.message || "")) {
          clearInterval(this.accessCheckTimer);
          this.renderBetaAccessDenied(error);
          return;
        }
        console.warn("Não foi possível conferir o acesso ao beta.", error);
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
      this.launchGroupId = String(params.get("group") || "").trim();
      this.launchAnnouncementId = String(params.get("announcement") || "").trim();
      this.launchMatchId = String(params.get("match") || "").trim();
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
      document.addEventListener("keydown", event => {
        if (!["Enter", " "].includes(event.key)) return;
        const action = event.target.closest('.match-card[data-action="open-match"]');
        if (!action) return;
        event.preventDefault();
        this.handleAction(action.dataset.action, action.dataset);
      });
      $("#groupButton")?.addEventListener("click", () => this.openGroupModal());
      $("#groupAvatarButton")?.addEventListener("click", () => {
        if (this.currentGroup() && this.canManageGroup()) this.openGroupSettings();
        else this.openGroupModal();
      });
      $("#notificationButton")?.addEventListener("click", () => this.openAnnouncementCenter());
      $("#profileButton")?.addEventListener("click", () => this.openProfileModal());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") this.verifyBetaAccess();
      });
      window.addEventListener("focus", () => this.verifyBetaAccess());
      window.addEventListener("error", event => {
        if (!this.repo || !event.error) return;
        this.repo.logEvent("frontend_error", { message: event.message, source: event.filename?.split("/").pop() || "", line: event.lineno || 0 }, "error");
      });
      window.addEventListener("unhandledrejection", event => {
        if (!this.repo) return;
        const reason = event.reason;
        this.repo.logEvent("unhandled_rejection", { message: reason?.message || String(reason || "Erro assíncrono") }, "error");
      });
      document.addEventListener("error", event => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement) || !image.matches("[data-group-avatar]")) return;
        if (image.dataset.fallbackApplied === "true") return;
        image.dataset.fallbackApplied = "true";
        image.src = window.RESENHA_GROUP_AVATARS?.["badge-01"] || assetUrl("assets/group-avatars/badge-01.png?v=beta102");
      }, true);
    },

    async registerServiceWorker() {
      if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return null;
      try {
        this.swRegistration = await navigator.serviceWorker.register("service-worker.js");
        this.swRegistration.addEventListener("updatefound", () => {
          const worker = this.swRegistration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              this.updateAvailable = { build: "novo", version: "Nova versão" };
              this.renderUpdateBanner();
            }
          });
        });
        navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());
        return this.swRegistration;
      } catch (error) {
        console.warn("Falha ao registrar o service worker.", error);
        return null;
      }
    },

    async checkForUpdates(showCurrent = false) {
      try {
        const response = await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Não foi possível consultar a versão publicada.");
        const release = await response.json();
        if (Number(release.build || 0) > APP_RELEASE.build) {
          this.updateAvailable = release;
          this.renderUpdateBanner();
          return true;
        }
        if (showCurrent) this.toast(`Você já está na versão mais recente: ${APP_RELEASE.version} Build ${APP_RELEASE.build}.`);
        return false;
      } catch (error) {
        if (showCurrent) this.toast(error.message, true);
        return false;
      }
    },

    renderUpdateBanner() {
      if (!this.updateAvailable || document.getElementById("updateBanner")) return;
      const banner = document.createElement("div");
      banner.id = "updateBanner";
      banner.className = "update-banner";
      banner.innerHTML = `<div><strong>Nova versão disponível</strong><small>Atualize para receber correções e melhorias.</small></div><button type="button" data-action="apply-update">Atualizar agora</button>`;
      document.body.appendChild(banner);
    },

    async applyUpdate() {
      const registration = await this.ensureServiceWorker();
      await registration.update().catch(() => {});
      if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      else {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith("resenha-fc-")).map(key => caches.delete(key)));
        location.reload();
      }
    },

    async ensureServiceWorker() {
      if (this.swRegistration) return this.swRegistration;
      await this.registerServiceWorker();
      return navigator.serviceWorker.ready;
    },

    currentGroup() {
      return this.state?.groups.find(group => group.id === this.state.currentGroupId) || this.state?.groups[0] || null;
    },
    currentRole() {
      const role = this.currentGroup()?.role || "member";
      return role === "owner" ? "admin" : role;
    },
    canManageGroup() { return this.currentRole() === "admin"; },
    canManageMatches() { return ["admin", "organizer"].includes(this.currentRole()); },
    canManageFinance() { return ["admin", "treasurer"].includes(this.currentRole()); },
    canSeeRatings() { return this.currentRole() === "admin"; },
    activePlayers() { return (this.state?.players || []).filter(player => player.active !== false && !player.guest_match_id); },
    guestPlayers() { return (this.state?.players || []).filter(player => player.active !== false && Boolean(player.guest_match_id)); },
    matchPlayers(matchId) { return (this.state?.players || []).filter(player => player.active !== false && (!player.guest_match_id || player.guest_match_id === matchId)); },
    isGuest(player) { return Boolean(player?.guest_match_id); },
    player(id) { return this.state?.players.find(player => player.id === id); },
    memberPlayer(member) { return this.player(member?.player_id) || this.state?.players.find(player => player.user_id === member?.user_id); },
    myPlayer() {
      const group = this.currentGroup();
      return this.player(group?.player_id) || this.state?.players.find(player => player.user_id === this.state?.profile?.id) || null;
    },
    adminMember() { return this.state?.members.find(member => ["admin", "owner"].includes(member.role)) || null; },
    attendanceFor(matchId) { return this.state?.attendance.filter(item => item.match_id === matchId) || []; },
    confirmedFor(matchId) { return this.attendanceFor(matchId).filter(item => item.status === "confirmed"); },
    waitlistFor(matchId) {
      return this.attendanceFor(matchId)
        .filter(item => item.status === "waitlist")
        .sort((a, b) => Number(a.waitlist_position || 9999) - Number(b.waitlist_position || 9999) || new Date(a.responded_at) - new Date(b.responded_at));
    },
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
      const notificationButton = $("#notificationButton");
      if (notificationButton) {
        notificationButton.hidden = !group;
        notificationButton.setAttribute("aria-label", group ? "Abrir avisos do grupo" : "Avisos");
      }
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
      const waitlist = attendance.filter(item => item.status === "waitlist");
      const overflow = Math.max(0, confirmed.length - Number(match?.max_players || 0));
      const notice = [...this.state.announcements].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      const administrator = this.memberPlayer(this.adminMember());
      const emblem = this.canManageGroup()
        ? `<button class="hero-avatar-button" data-action="group-settings" aria-label="Personalizar grupo">${this.groupAvatar(group, "hero-group-avatar")}</button>`
        : this.groupAvatar(group, "hero-group-avatar");
      return `<section class="home-dashboard">
        <section class="stadium-hero home-hero">
          <div class="stadium-lights"></div>
          <div class="group-identity">${emblem}<div><span class="eyebrow">${escapeHtml(roleLabels[this.currentRole()])}</span><h1>${escapeHtml(group.name)}</h1><p>Administrador: ${escapeHtml(administrator?.name || "Não identificado")}</p></div></div>
          ${match ? `<div class="next-match-panel"><div class="next-match-heading"><div><span class="match-kicker">PRÓXIMA PELADA</span><h2>${escapeHtml(match.title)}</h2></div><button class="match-detail-link" data-action="open-match" data-id="${match.id}">Detalhes</button></div><p>${escapeHtml(shortDate(match.starts_at))} · ${escapeHtml(match.location)}</p><div class="hero-numbers"><div><strong>${confirmed.length}</strong><small>confirmados</small></div><div><strong>${match.max_players}</strong><small>começam</small></div><div><strong>${overflow || waitlist.length || Math.max(0, Number(match.max_players) - confirmed.length)}</strong><small>${overflow ? "excedentes" : waitlist.length ? "em espera" : "restantes"}</small></div></div><button class="btn btn-primary btn-block home-rsvp" data-action="rsvp" data-id="${match.id}">Confirmar presença</button></div>` : `<div class="next-match-panel empty-match-panel"><span class="match-kicker">AGENDA LIVRE</span><h2>Nenhuma pelada marcada</h2><p>Organizadores podem criar o próximo jogo.</p>${this.canManageMatches() ? '<button class="btn btn-primary btn-small" data-action="new-match">Agendar pelada</button>' : ""}</div>`}
        </section>
        ${notice ? `<button class="home-notice" data-action="announcement-center" data-id="${notice.id}"><span>📣</span><div><strong>${escapeHtml(notice.title)}</strong><small>${escapeHtml(notice.body)}</small></div><b>›</b></button>` : ""}
        <div class="home-quick-grid">
          <button class="quick-card" data-action="rsvp" data-id="${match?.id || ""}"><span class="quick-icon">✓</span><span><strong>Presença</strong><small>Confirme sua participação</small></span></button>
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
      const waitlist = this.waitlistFor(match.id);
      const future = date > new Date();
      const recurring = Number(match.recurrence_total || 1) > 1;
      return `<article class="card match-card" data-action="open-match" data-id="${match.id}" role="button" tabindex="0" aria-label="Abrir detalhes de ${escapeHtml(match.title)}"><div class="match-top"><div class="match-date"><small>${date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()}</small><strong>${String(date.getDate()).padStart(2, "0")}</strong></div><div class="match-info"><h3>${escapeHtml(match.title)}</h3><p>${escapeHtml(shortDate(match.starts_at))}<br>${escapeHtml(match.location)}</p>${recurring ? '<span class="recurrence-chip">↻ Semanal</span>' : ""}${match.bbq_enabled ? '<span class="bbq-chip">Churrasco</span>' : ""}</div><span class="status-pill ${future ? "status-maybe" : "status-confirmed"}">${future ? "Agendado" : "Histórico"}</span></div><div class="match-footer"><div class="avatar-stack">${confirmed.slice(0, 5).map(item => `<span>${initials(this.player(item.player_id)?.name)}</span>`).join("")}${confirmed.length > 5 ? `<span>+${confirmed.length - 5}</span>` : ""}</div><span class="match-open-label">${confirmed.length}/${match.max_players} começam${waitlist.length ? ` · ${waitlist.length} espera` : ""} <b>›</b></span></div></article>`;
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
      return `<section class="card team-card"><div class="team-head"><div class="team-shirt">${name.includes("Verde") ? "🟢" : name.includes("Azul") ? "🔵" : name.includes("Laranja") ? "🟠" : "⚪"}</div><strong>${escapeHtml(name)}</strong><small>${members.length} jogadores</small></div>${members.map(player => { const summary = this.ratingSummary(player.id); return `<div class="team-player">${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.nickname || player.name)}</strong><small>${escapeHtml(player.primary_position || "Sem posição")}${summary?.average ? ` · nota ${summary.average.toFixed(1)}` : ""}</small></div><div class="team-player-trailing">${this.isGuest(player) ? '<span class="guest-badge">Convidado</span>' : ""}${player.goalkeeper ? '<span class="score-pill">GOL</span>' : ""}</div></div>`; }).join("")}</section>`;
    },

    membersPage() {
      const sortedMembers = [...this.state.members].sort((a, b) => {
        const weight = { owner: 0, admin: 0, organizer: 1, treasurer: 2, member: 3 };
        return (weight[a.role] - weight[b.role]) || String(this.memberPlayer(a)?.name).localeCompare(String(this.memberPlayer(b)?.name));
      });
      return `<div class="page-head members-page-head"><div><span class="page-kicker">ELENCO</span><h1>Membros do grupo</h1><p>Funções, posições e avaliações internas.</p></div><button class="btn btn-primary btn-small" data-action="invite">Convidar</button></div><div class="members-primary-action"><button class="btn btn-primary btn-block" data-action="rate-members">★ Avaliar membros</button></div><div class="section-title members-list-title"><h2>Elenco (${sortedMembers.length})</h2>${this.canSeeRatings() ? '<small>Notas visíveis somente ao administrador.</small>' : '<small>Avaliações confidenciais.</small>'}</div><div class="list members-list">${sortedMembers.map(member => this.memberRow(member)).join("")}</div>${this.canSeeRatings() ? this.privateRatingsPanel() : ""}`;
    },

    memberRow(member) {
      const player = this.memberPlayer(member) || { name: "Membro", primary_position: "Sem posição" };
      const summary = this.ratingSummary(player.id);
      const isMe = member.user_id === this.state.profile.id;
      const canManageMember = this.canManageMatches() && !isMe && !["admin", "owner"].includes(member.role);
      return `<article class="card member-row member-row-compact ${canManageMember ? "member-row-manageable" : ""}" ${canManageMember ? `data-action="manage-member" data-user-id="${member.user_id}" role="button" tabindex="0" aria-label="Gerenciar ${escapeHtml(player.name)}"` : ""}>${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.name)}${isMe ? ' <span class="you-label">você</span>' : ""}</strong><small>${escapeHtml(player.primary_position || "Sem posição")}${player.nickname ? ` · ${escapeHtml(player.nickname)}` : ""}</small></div><div class="member-trailing"><span class="role-pill ${roleClass(member.role)}">${escapeHtml(roleLabels[member.role] || "Membro")}</span>${this.canSeeRatings() ? `<small class="private-score">${summary?.average ? `★ ${summary.average.toFixed(1)} (${summary.count})` : "Sem notas"}</small>` : ""}${canManageMember ? '<span class="member-manage-chevron">›</span>' : ""}</div></article>`;
    },

    privateRatingsPanel() {
      const rated = this.activePlayers().map(player => ({ player, summary: this.ratingSummary(player.id) })).filter(item => item.summary?.count).sort((a, b) => b.summary.average - a.summary.average);
      return `<div class="section-title"><h2>Painel privado de notas</h2><span class="private-badge">🔒 Administrador</span></div><section class="card private-panel">${rated.length ? rated.map((item, index) => `<div class="rating-summary-row"><span class="rank-pos">${index + 1}</span>${this.personAvatar(item.player)}<div class="list-main"><strong>${escapeHtml(item.player.name)}</strong><small>${escapeHtml(item.player.primary_position)} · ${item.summary.count} avaliação(ões)</small></div><strong>${item.summary.average.toFixed(2)}</strong></div>`).join("") : '<div class="empty"><strong>Nenhuma média disponível</strong><span>As notas aparecerão após os membros avaliarem o elenco.</span></div>'}</section>`;
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
      const chargeSummaries = this.state.charges.map(charge => {
        const amount = Number(charge.amount || 0);
        const paidAmount = payments
          .filter(payment => payment.charge_id === charge.id)
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const remaining = Math.max(0, amount - paidAmount);
        const effectiveStatus = charge.status === "cancelled"
          ? "cancelled"
          : paidAmount >= amount && amount > 0
            ? "paid"
            : paidAmount > 0
              ? "partial"
              : charge.status;
        return { ...charge, amount, paidAmount, remaining, effectiveStatus };
      });
      const activeCharges = chargeSummaries.filter(charge => charge.effectiveStatus !== "cancelled");
      const totalCharged = activeCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const totalApplied = activeCharges.reduce((sum, charge) => sum + Math.min(charge.paidAmount, charge.amount), 0);
      const paid = chargeSummaries.filter(charge => charge.effectiveStatus === "paid").length;
      const partial = chargeSummaries.filter(charge => charge.effectiveStatus === "partial").length;
      const pct = totalCharged ? Math.min(100, Math.round(totalApplied / totalCharged * 100)) : 0;
      const canDelete = this.canManageFinance();
      const movements = [
        ...payments.map(item => ({ ...item, entryType: "payment", type: "income", description: item.description || `Pagamento · ${this.player(item.player_id)?.nickname || "Jogador"}`, date: item.paid_at })),
        ...expenses.map(item => ({ ...item, entryType: "expense", type: "expense", date: item.occurred_at }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      const statusPresentation = status => ({
        paid: ["status-confirmed", "Pago"],
        partial: ["status-maybe", "Parcial"],
        overdue: ["status-out", "Vencida"],
        cancelled: ["status-out", "Cancelada"],
        open: ["status-out", "Pendente"]
      }[status] || ["status-out", "Pendente"]);
      const chargeRows = chargeSummaries.map(charge => {
        const player = this.player(charge.player_id) || { name: "Grupo", primary_position: charge.description };
        const [statusClass, statusLabel] = statusPresentation(charge.effectiveStatus);
        const paymentDetails = charge.paidAmount > 0
          ? `<small class="finance-charge-progress ${charge.effectiveStatus === "partial" ? "is-partial" : ""}">Pago: ${money(charge.paidAmount)} · ${charge.remaining > 0 ? `Restante: ${money(charge.remaining)}` : "Cobrança quitada"}</small>`
          : "";
        return `<div class="card list-row finance-charge-row">${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(charge.description)} · Total: ${money(charge.amount)}</small>${paymentDetails}</div><span class="status-pill ${statusClass}">${statusLabel}</span>${canDelete ? `<button class="row-delete-button" data-action="delete-finance" data-type="charge" data-id="${charge.id}" aria-label="Excluir cobrança">×</button>` : ""}</div>`;
      }).join("");
      return `<div class="page-head"><div><span class="page-kicker">FINANCEIRO</span><h1>Caixa</h1><p>Mensalidades, quadra, materiais e churrasco.</p></div>${canDelete ? '<button class="btn btn-primary btn-small" data-action="new-finance">+ Lançar</button>' : ""}</div>${!canDelete ? '<div class="notice"><strong>Acesso de consulta</strong><br>Somente administrador e tesoureiro podem alterar lançamentos.</div>' : '<div class="notice notice-success"><strong>Acesso autorizado</strong><br>Você pode registrar e excluir cobranças, pagamentos e despesas.</div>'}<section class="card balance-card"><small>Saldo atual</small><h2>${money(income - out)}</h2><div class="balance-grid"><div><small>Entradas</small><strong>${money(income)}</strong></div><div><small>Saídas</small><strong>${money(out)}</strong></div></div><div class="balance-track"><span style="width:${pct}%"></span></div><p>${paid} paga(s) · ${partial} parcial(is) · ${pct}% do valor cobrado recebido</p></section><div class="section-title"><h2>Movimentações</h2></div><div class="list">${movements.map(item => `<div class="card finance-row"><div class="finance-icon ${item.type === "income" ? "finance-income" : "finance-expense"}">${item.type === "income" ? "+" : "−"}</div><div class="list-main"><strong>${escapeHtml(item.description)}</strong><small>${escapeHtml(shortDate(item.date))}</small></div><strong class="money ${item.type === "income" ? "positive" : "negative"}">${item.type === "income" ? "+" : "−"}${money(item.amount)}</strong>${canDelete ? `<button class="row-delete-button" data-action="delete-finance" data-type="${item.entryType}" data-id="${item.id}" aria-label="Excluir lançamento">×</button>` : ""}</div>`).join("") || '<div class="card empty">Sem movimentações.</div>'}</div><div class="section-title"><h2>Cobranças</h2></div><div class="list">${chargeRows || '<div class="card empty">Nenhuma cobrança.</div>'}</div>`;
    },

    morePage() {
      const group = this.currentGroup();
      const pushConfigured = Boolean(String(window.RESENHA_CONFIG?.vapidPublicKey || "").trim());
      const pushText = !pushSupported() ? "Este navegador não oferece notificações push." : !pushConfigured ? "Conclua a configuração VAPID." : "Receba avisos mesmo com o aplicativo fechado.";
      const adminTools = this.state.is_platform_admin ? '<div class="section-title"><h2>Operação do beta</h2><small>Acesso exclusivo da plataforma.</small></div><button class="card menu-row admin-menu-row" data-action="platform-admin"><span class="menu-icon">◉</span><div class="list-main"><strong>Painel Beta</strong><small>Saúde, métricas, feedbacks e logs.</small></div><strong>›</strong></button>' : "";
      return `<div class="page-head"><div><span class="page-kicker">CONFIGURAÇÕES</span><h1>Mais</h1><p>Administração, suporte e dados da conta.</p></div></div><div class="list"><button class="card menu-row" data-action="profile"><span class="menu-icon">⚽</span><div class="list-main"><strong>Meu perfil de jogador</strong><small>Nome, apelido e posição.</small></div><strong>›</strong></button><button class="card menu-row" data-action="notification-settings"><span class="menu-icon">🔔</span><div class="list-main"><strong>Notificações no celular</strong><small>${escapeHtml(pushText)}</small></div><strong>›</strong></button><button class="card menu-row" data-action="announcement-center"><span class="menu-icon">📣</span><div class="list-main"><strong>Central de avisos</strong><small>Consulte os comunicados do grupo.</small></div><strong>›</strong></button><button class="card menu-row" data-action="invite"><span class="menu-icon">↗</span><div class="list-main"><strong>Convidar pelo WhatsApp</strong><small>Código ${escapeHtml(group.invite_code)}</small></div><strong>›</strong></button>${this.canManageGroup() ? '<button class="card menu-row" data-action="group-settings"><span class="menu-icon">🛡</span><div class="list-main"><strong>Personalizar grupo</strong><small>Nome, escudo e administração.</small></div><strong>›</strong></button><button class="card menu-row" data-action="manage-roles"><span class="menu-icon">♟</span><div class="list-main"><strong>Gerenciar funções</strong><small>Administrador, organizador e tesoureiro.</small></div><strong>›</strong></button>' : ""}${this.canManageMatches() ? '<button class="card menu-row" data-action="announcement"><span class="menu-icon">!</span><div class="list-main"><strong>Publicar aviso</strong><small>Enviar comunicado e notificação ao elenco.</small></div><strong>›</strong></button><button class="card menu-row" data-action="players"><span class="menu-icon">+</span><div class="list-main"><strong>Jogadores sem acesso</strong><small>Cadastrar convidado eventual.</small></div><strong>›</strong></button>' : ""}<div class="section-title"><h2>Suporte do beta</h2></div><button class="card menu-row feedback-row" data-action="report-problem"><span class="menu-icon">⚑</span><div class="list-main"><strong>Reportar problema</strong><small>Envie o relato com diagnóstico automático.</small></div><strong>›</strong></button><button class="card menu-row" data-action="about-diagnostics"><span class="menu-icon">i</span><div class="list-main"><strong>Sobre e diagnóstico</strong><small>Versão, sincronização, push e atualização.</small></div><strong>›</strong></button>${adminTools}<button class="card menu-row" data-action="export"><span class="menu-icon">⇩</span><div class="list-main"><strong>Exportar dados do grupo</strong><small>Backup local em arquivo JSON.</small></div><strong>›</strong></button><button class="card menu-row danger-row" data-action="sign-out"><span class="menu-icon danger-avatar">↪</span><div class="list-main"><strong>Sair da conta</strong><small>Desconectar e escolher outra conta Google.</small></div><strong>›</strong></button></div><div class="version-card">Resenha FC ${APP_RELEASE.version} · Build ${APP_RELEASE.build} · Beta fechado</div>`;
    },

    async handleAction(action, data) {
      try {
        const actions = {
          "new-match": () => this.openMatchForm(),
          "open-match": () => this.openMatchDetails(data.id),
          rsvp: () => this.openRsvp(data.id || this.nextMatch()?.id),
          "draw-teams": () => this.drawTeams(data.id),
          "new-finance": () => this.openFinanceForm(),
          "delete-finance": () => this.deleteFinanceEntry(data.type, data.id),
          "rate-members": () => this.openMemberRatings(),
          players: () => this.openPlayers(),
          group: () => this.openGroupModal(),
          "create-group": () => this.openCreateGroupModal(),
          "join-group": () => this.openJoinGroupModal(),
          invite: () => this.openInviteModal(),
          "group-settings": () => this.openGroupSettings(),
          "manage-roles": () => this.openRoleManager(),
          "manage-member": () => this.openMemberManager(data.userId),
          announcement: () => this.openAnnouncementForm(),
          "announcement-center": () => this.openAnnouncementCenter(data.id),
          "notification-settings": () => this.openNotificationSettings(),
          profile: () => this.openProfileModal(),
          export: () => this.exportData(),
          "report-problem": () => this.openProblemReport(),
          "about-diagnostics": () => this.openDiagnostics(),
          "platform-admin": () => this.openPlatformAdmin(),
          "apply-update": () => this.applyUpdate(),
          "check-update": () => this.checkForUpdates(true),
          "sign-out": () => this.logout(),
          reload: () => location.reload()
        };
        if (["new-match", "rsvp", "new-finance", "create-group", "join-group", "announcement", "report-problem"].includes(action)) this.repo?.logEvent("ui_action", { action });
        if (actions[action]) await actions[action]();
      } catch (error) {
        console.error(error);
        this.toast(error.message || "Não foi possível concluir a ação.", true);
      }
    },

    renderBetaAccessDenied(error) {
      const email = this.repo?.state?.profile?.email || "esta conta";
      document.body.innerHTML = `<main class="auth-screen"><section class="auth-panel simple-auth access-denied-panel"><img class="auth-logo" src="login-logo-transparent-v0311.png" alt="Resenha FC"><span class="access-denied-icon">!</span><h1>Acesso restrito</h1><p>O Resenha FC está em beta fechado. A conta <strong>${escapeHtml(email)}</strong> não possui acesso ativo.</p><div class="notice auth-error"><strong>Motivo</strong><br>${escapeHtml(error?.message || "E-mail não autorizado.")}</div><p class="access-denied-help">Solicite à administração que autorize exatamente o e-mail usado na sua conta Google.</p><button id="deniedSignOut" class="btn btn-primary btn-block">Sair e usar outra conta</button><button class="btn btn-secondary btn-block" data-action="reload">Verificar novamente</button></section></main><div id="toastRoot" class="toast-root"></div>`;
      $("#deniedSignOut")?.addEventListener("click", async () => {
        try { await this.repo.signOut(); } catch {}
        location.reload();
      });
    },

    renderAuth() {
      const error = oauthErrorFromLocation();
      document.body.innerHTML = `<main class="auth-screen"><section class="auth-panel"><div class="auth-stadium"><div class="auth-lights"></div><img class="auth-logo" src="login-logo-transparent-v0311.png" alt="Resenha FC" width="178" height="178"><span class="auth-kicker">SUA PELADA. SEU GRUPO. SEU APP.</span></div><div class="auth-copy"><h1>Entre em campo</h1><p>Presença, times equilibrados, membros, caixa e churrasco em um único lugar.</p>${error ? `<div class="notice auth-error"><strong>Falha no login</strong><br>${escapeHtml(error)}</div>` : ""}<div class="google-card"><button id="googleLoginButton" class="google-oauth-button" type="button" aria-label="Continuar com Google"><svg class="google-g" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.23c1.89-1.74 2.99-4.3 2.99-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.36l-3.23-2.54c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.07v2.62A9.99 9.99 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.32-1.93V7.45H3.07A10 10 0 0 0 2 12c0 1.61.38 3.14 1.07 4.55l3.33-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a9.99 9.99 0 0 0-8.93 5.45l3.33 2.62C7.19 7.7 9.4 5.94 12 5.94Z"/></svg><span>Continuar com Google</span><span class="google-login-spinner" aria-hidden="true"></span></button><p id="googleLoginMessage">Use sua conta Google para continuar. Não há cadastro por e-mail ou senha.</p></div><div class="auth-features"><span>✓ Acesso seguro</span><span>✓ Dados em nuvem</span><span>✓ Sincronização entre celulares</span></div></div></section></main><div id="toastRoot" class="toast-root"></div>`;
      this.setupGoogleLogin();
      if (error && history.replaceState) history.replaceState({}, document.title, location.pathname);
    },

    setupGoogleLogin() {
      const button = $("#googleLoginButton");
      const message = $("#googleLoginMessage");
      if (!button) return;

      button.addEventListener("click", async () => {
        if (button.disabled) return;
        button.disabled = true;
        button.classList.add("is-loading");
        message.textContent = "Abrindo o acesso seguro do Google…";
        message.classList.remove("error-text");

        try {
          const { data, error } = await this.repo.signInWithGoogleOAuth();
          if (error) throw error;
          if (!data?.url) throw new Error("O endereço de autenticação não foi gerado.");
          window.location.assign(data.url);
        } catch (error) {
          console.error(error);
          button.disabled = false;
          button.classList.remove("is-loading");
          message.textContent = error?.message || "Não foi possível iniciar o login Google.";
          message.classList.add("error-text");
        }
      });
    },

    renderConfigurationError() {
      document.body.innerHTML = `<main class="auth-screen"><section class="auth-panel simple-auth"><img class="auth-logo" src="login-logo-transparent-v0311.png" alt="Resenha FC"><h1>Configuração necessária</h1><p>Preencha Supabase URL e Publishable key no arquivo <code>supabase-config.js</code>.</p><button class="btn btn-primary" data-action="reload">Verificar novamente</button></section></main>`;
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
      this.modal("Criar grupo", `<form id="createGroupForm" class="form-grid create-group-form"><div class="notice notice-success"><strong>Seu grupo, sua identidade</strong><br>Escolha um nome e um escudo. Você será o administrador do grupo.</div><div class="field"><label>Nome do grupo</label><input name="name" required minlength="2" maxlength="80" placeholder="Ex.: Resenha de quinta" autocomplete="off"></div><div class="field"><label>Escolha o escudo</label>${this.avatarPicker()}</div><button class="btn btn-primary btn-block">Criar grupo</button></form>`, (root, close) => {
        $("#createGroupForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await this.repo.createGroup(form.get("name"), form.get("avatar_key"));
          this.state = this.repo.state;
          localStorage.setItem("resenha-current-group", this.state.currentGroupId);
          close();
          this.route = "home";
          this.render();
          this.toast("Grupo criado. Você é o administrador.");
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
      if (!this.canManageGroup()) return this.toast("Apenas o administrador pode personalizar o grupo.", true);
      const group = this.currentGroup();
      const deleteArea = `<div class="danger-zone"><div><strong>Excluir grupo permanentemente</strong><p>Apaga jogos, histórico, caixa, avaliações, avisos e todos os vínculos. Não existe recuperação.</p></div><button type="button" class="btn btn-danger btn-block" id="openDeleteGroup">Excluir grupo</button></div>`;
      this.modal("Personalizar grupo", `<form id="groupSettingsForm" class="form-grid"><div class="field"><label>Nome</label><input name="name" value="${escapeHtml(group.name)}" required></div><div class="field"><label>Escudo</label>${this.avatarPicker(group.avatar_key)}</div><button class="btn btn-primary btn-block">Salvar alterações</button></form>${deleteArea}`, (root, close) => {
        $("#groupSettingsForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await this.repo.updateGroup(group.id, form.get("name"), form.get("avatar_key"));
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Grupo atualizado.");
        });
        $("#openDeleteGroup", root)?.addEventListener("click", () => {
          close();
          setTimeout(() => this.openDeleteGroupConfirmation(group), 0);
        });
      });
    },

    openDeleteGroupConfirmation(group) {
      if (this.currentRole() !== "admin") return this.toast("Somente o administrador pode excluir o grupo.", true);
      this.modal("Excluir grupo", `<form id="deleteGroupForm" class="form-grid"><div class="destructive-warning"><span>!</span><div><strong>Exclusão permanente e irreversível</strong><p>O grupo <b>${escapeHtml(group.name)}</b> e todos os seus jogos, históricos, membros, avaliações, avisos e dados financeiros serão apagados definitivamente.</p></div></div><div class="field"><label>Digite EXCLUIR para confirmar</label><input name="confirmation" required autocomplete="off" autocapitalize="characters" placeholder="EXCLUIR"></div><button class="btn btn-danger btn-block" disabled id="confirmDeleteGroup">Excluir definitivamente</button></form>`, (root, close) => {
        const input = $('[name="confirmation"]', root);
        const button = $("#confirmDeleteGroup", root);
        input.addEventListener("input", () => { button.disabled = input.value.trim().toUpperCase() !== "EXCLUIR"; });
        $("#deleteGroupForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          button.disabled = true;
          button.textContent = "Excluindo...";
          await this.repo.deleteGroup(group.id, form.get("confirmation"));
          this.state = this.repo.state;
          localStorage.removeItem("resenha-current-group");
          if (this.state.currentGroupId) localStorage.setItem("resenha-current-group", this.state.currentGroupId);
          close();
          this.route = "home";
          this.render();
          this.toast("Grupo excluído permanentemente.");
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
      if (!this.canManageGroup()) return this.toast("Somente o administrador pode gerenciar funções.", true);
      const group = this.currentGroup();
      this.modal("Gerenciar funções", `<div class="notice"><strong>Administrador único</strong><br>O administrador possui todos os privilégios do grupo. Ele pode delegar organizador, tesoureiro ou membro e transferir a administração para outro integrante.</div><div class="list">${this.state.members.map(member => {
        const player = this.memberPlayer(member) || { name: "Membro" };
        const isMe = member.user_id === this.state.profile.id;
        const isAdmin = ["admin", "owner"].includes(member.role);
        const normalizedRole = isAdmin ? "admin" : member.role;
        const canEditRole = !isMe && !isAdmin;
        const transferButton = !isMe && !isAdmin ? `<button class="transfer-button" data-transfer-admin="${member.user_id}" title="Transferir administração">♛</button>` : "";
        return `<div class="card role-row">${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(roleLabels[normalizedRole])}</small></div>${canEditRole ? `<select class="role-select" data-role-user="${member.user_id}">${["organizer", "treasurer", "member"].map(role => `<option value="${role}" ${role === normalizedRole ? "selected" : ""}>${roleLabels[role]}</option>`).join("")}</select>` : `<span class="role-pill ${roleClass(normalizedRole)}">${roleLabels[normalizedRole]}</span>`}${transferButton}</div>`;
      }).join("")}</div>`, (root, close) => {
        $$('[data-role-user]', root).forEach(select => select.addEventListener("change", async event => {
          event.currentTarget.disabled = true;
          await this.repo.setMemberRole(group.id, event.currentTarget.dataset.roleUser, event.currentTarget.value);
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Função atualizada.");
        }));
        $$('[data-transfer-admin]', root).forEach(button => button.addEventListener("click", async () => {
          const userId = button.dataset.transferAdmin;
          const player = this.memberPlayer(this.state.members.find(member => member.user_id === userId));
          if (!confirm(`Transferir a administração do grupo para ${player?.name || "este membro"}? Você passará a membro.`)) return;
          await this.repo.transferAdministration(group.id, userId);
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Administração transferida.");
        }));
      });
    },

    openMemberManager(userId) {
      if (!this.canManageMatches()) return this.toast("Somente administrador e organizador podem gerenciar integrantes.", true);
      const member = this.state.members.find(item => item.user_id === userId);
      if (!member) return this.toast("Membro não encontrado.", true);
      if (member.user_id === this.state.profile.id) return this.toast("Você não pode remover a si mesmo por esta opção.", true);
      if (["admin", "owner"].includes(member.role)) return this.toast("O administrador único não pode ser removido. Transfira a administração primeiro.", true);
      const player = this.memberPlayer(member) || { name: "Membro", primary_position: "Sem posição" };
      this.modal("Gerenciar membro", `<div class="member-manager-summary">${this.personAvatar(player)}<div><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.primary_position || "Sem posição")} · ${escapeHtml(roleLabels[member.role] || "Membro")}</small></div></div><div class="notice"><strong>Histórico preservado</strong><br>A remoção encerra imediatamente o acesso ao grupo e às notificações. Presenças, avaliações, pagamentos e registros anteriores permanecem no histórico.</div><button id="removeMemberButton" class="btn btn-danger btn-block">Remover do grupo</button>`, (root, close) => {
        $("#removeMemberButton", root)?.addEventListener("click", async event => {
          if (!confirm(`Remover ${player.name} deste grupo? O acesso será encerrado imediatamente.`)) return;
          const button = event.currentTarget;
          button.disabled = true;
          button.textContent = "Removendo…";
          try {
            await this.repo.removeGroupMember(this.state.currentGroupId, member.user_id);
            this.state = this.repo.state;
            await this.repo.logEvent("member_removed", { removed_user_id: member.user_id, removed_player_name: player.name });
            close();
            this.render();
            this.toast(`${player.name} foi removido do grupo.`);
          } catch (error) {
            button.disabled = false;
            button.textContent = "Remover do grupo";
            this.toast(error.message || "Não foi possível remover o membro.", true);
          }
        });
      });
    },

    openMemberRatings() {
      const me = this.myPlayer();
      const players = this.activePlayers().filter(player => player.id !== me?.id && player.user_id);
      if (!players.length) return this.toast("Ainda não há outros membros para avaliar.", true);
      this.modal("Avaliar membros", `<div class="notice"><strong>Avaliação confidencial</strong><br>Dê uma nota de 1 a 10 considerando o desempenho geral no futebol. Somente o administrador visualiza médias e quantidade de avaliações.</div><form id="memberRatingsForm" class="ratings-form">${players.map(player => {
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
      this.modal("Agendar pelada", `<form id="matchForm" class="form-grid"><div class="field"><label>Título</label><input name="title" required value="Pelada semanal"></div><div class="field"><label>Data e hora da primeira pelada</label><input name="starts_at" type="datetime-local" min="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}" required value="${local}"></div><div class="field"><label>Local</label><input name="location" required placeholder="Arena e número da quadra"></div><div class="field-row"><div class="field"><label>Máximo de jogadores</label><input name="max_players" type="number" min="4" max="60" value="12"></div><div class="field"><label>Jogadores por time</label><input name="players_per_team" type="number" min="2" max="11" value="6"></div></div><label class="check-row recurrence-toggle"><input name="repeat_weekly" type="checkbox"> Repetir esta pelada toda semana</label><div class="recurrence-panel" id="recurrencePanel" hidden><div class="field"><label>Quantidade total de peladas</label><input name="occurrences" type="number" min="2" max="52" value="8" inputmode="numeric"><small>Será criada uma ocorrência a cada 7 dias, sempre no mesmo horário.</small></div><div class="recurrence-preview" id="recurrencePreview">8 peladas semanais serão agendadas.</div></div><div class="field"><label>Observações</label><textarea name="notes" placeholder="Uniforme, prazo, regras..."></textarea></div><button class="btn btn-primary btn-block">Criar programação</button></form>`, (root, close) => {
        const repeat = $('[name="repeat_weekly"]', root);
        const panel = $("#recurrencePanel", root);
        const occurrencesInput = $('[name="occurrences"]', root);
        const preview = $("#recurrencePreview", root);
        const refreshRecurrence = () => {
          panel.hidden = !repeat.checked;
          const count = Math.max(2, Math.min(52, Number(occurrencesInput.value || 8)));
          preview.textContent = `${count} peladas semanais serão agendadas.`;
        };
        repeat.addEventListener("change", refreshRecurrence);
        occurrencesInput.addEventListener("input", refreshRecurrence);
        refreshRecurrence();
        $("#matchForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const startsAt = new Date(form.get("starts_at"));
          if (startsAt <= new Date()) return this.toast("Escolha uma data futura.", true);
          const occurrences = repeat.checked ? Math.max(2, Math.min(52, Number(form.get("occurrences") || 8))) : 1;
          const submit = event.submitter;
          submit.disabled = true;
          submit.textContent = occurrences > 1 ? "Criando série..." : "Criando...";
          const createdIds = await this.repo.createMatchSchedule({
            groupId: this.state.currentGroupId,
            title: form.get("title"),
            startsAt: startsAt.toISOString(),
            location: form.get("location"),
            maxPlayers: Number(form.get("max_players")),
            playersPerTeam: Number(form.get("players_per_team")),
            bbqEnabled: false,
            bbqPrice: 0,
            notes: form.get("notes") || "",
            occurrences
          });
          this.state = this.repo.state;
          close();
          this.render();
          let notificationText = "";
          try {
            const result = await this.repo.notifyMatchCreated(this.state.currentGroupId, createdIds?.[0]);
            notificationText = Number(result.sent || 0) > 0 ? ` Aviso enviado a ${result.sent} aparelho(s).` : " Nenhum aparelho vinculado recebeu push.";
          } catch (error) {
            console.warn("Pelada criada, mas a notificação falhou:", error);
            notificationText = " A pelada foi salva, mas o push não pôde ser enviado.";
          }
          this.toast((occurrences > 1 ? `${occurrences} peladas semanais agendadas.` : "Pelada agendada.") + notificationText);
        });
      });
    },

    openMatchDetails(id) {
      const match = this.state.matches.find(item => item.id === id);
      if (!match) return;
      const future = new Date(match.starts_at) > new Date();
      const recurring = Number(match.recurrence_total || 1) > 1;
      const grouped = { confirmed: [], maybe: [], waitlist: [], out: [] };
      this.attendanceFor(id).forEach(item => grouped[item.status]?.push(item));
      grouped.waitlist.sort((a, b) => Number(a.waitlist_position || 9999) - Number(b.waitlist_position || 9999));
      const pendingPlayers = this.activePlayers().filter(player => !this.attendanceFor(id).some(item => item.player_id === player.id));
      const confirmedCount = grouped.confirmed.length;
      const barbecueParticipants = this.attendanceFor(id).filter(item => item.bbq);
      const barbecueGuestsTotal = barbecueParticipants.reduce((sum, item) => sum + Number(item.bbq_guests || 0), 0);
      const barbecueTotal = barbecueParticipants.length + barbecueGuestsTotal;
      const barbecuePriceSummary = Number(match.bbq_price || 0) > 0 ? ` · ${money(match.bbq_price)} por pessoa` : "";
      const barbecueParticipantRows = barbecueParticipants
        .map(item => {
          const player = this.player(item.player_id) || { name: "Participante", primary_position: "" };
          const guests = Number(item.bbq_guests || 0);
          const details = [guests ? `${guests} acompanhante(s)` : "Sem acompanhantes", item.bbq_note ? `Levará: ${item.bbq_note}` : ""].filter(Boolean).join(" · ");
          return `<div class="bbq-participant-row">${this.personAvatar(player, "bbq-participant-avatar")}<div class="list-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(details)}</small></div>${this.isGuest(player) ? '<span class="guest-badge">Convidado</span>' : ""}</div>`;
        })
        .join("");
      const barbecueParticipantsPanel = barbecueParticipants.length
        ? `<div class="bbq-participants-panel bbq-summary-card"><button type="button" class="bbq-participants-toggle" data-toggle-bbq-participants aria-expanded="false" aria-controls="bbqParticipants-${match.id}"><span class="bbq-summary-icon" aria-hidden="true">♨</span><span class="bbq-participants-summary"><strong>Churrasco confirmado</strong><small>${barbecueParticipants.length} participante(s)${barbecueGuestsTotal ? ` + ${barbecueGuestsTotal} acompanhante(s)` : ""} · ${barbecueTotal} pessoa(s) no total${barbecuePriceSummary}</small></span><span class="bbq-participants-action"><span class="bbq-participants-action-label">Ver nomes</span><b aria-hidden="true">⌄</b></span></button><div id="bbqParticipants-${match.id}" class="bbq-participants-list" data-bbq-participants-list hidden>${barbecueParticipantRows}</div></div>`
        : `<div class="bbq-participants-panel bbq-summary-card is-empty"><div class="bbq-participants-toggle is-static"><span class="bbq-summary-icon" aria-hidden="true">♨</span><span class="bbq-participants-summary"><strong>Churrasco confirmado</strong><small>Nenhum participante confirmou até o momento${barbecuePriceSummary}.</small></span></div></div>`;
      const attendanceRow = (item, key) => {
        const player = this.player(item.player_id) || { name: "Jogador" };
        const trailing = key === "waitlist" ? `<span class="waitlist-position">#${Number(item.waitlist_position || 0) || "–"}</span>` : "";
        const managerNote = item.status_change_source === "manager" ? '<small class="attendance-managed-note">ajustado pela organização</small>' : "";
        const bbqBadge = item.bbq ? '<span class="bbq-attendance-badge" title="Participará do churrasco" aria-label="Participará do churrasco">♨</span>' : "";
        const guestBadge = this.isGuest(player) ? '<span class="guest-badge">Convidado</span>' : "";
        return `<div class="card list-row attendance-list-row">${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.primary_position || "Sem posição")}</small>${managerNote}</div><div class="attendance-row-trailing">${bbqBadge}${guestBadge}${trailing}</div></div>`;
      };
      const groupHtml = (title, key) => `<div class="section-title"><h2>${title} (${grouped[key].length})</h2></div><div class="list">${grouped[key].map(item => attendanceRow(item, key)).join("") || '<div class="card empty">Nenhum.</div>'}</div>`;
      const recurringInfo = recurring ? `<div class="recurrence-detail"><span>↻</span><div><strong>Pelada semanal recorrente</strong><small>Esta data pertence a uma série criada automaticamente.</small></div></div>` : "";

      const drawStatus = match.waitlist_drawn_at
        ? `<div class="draw-status ready"><span>✓</span><div><strong>Sorteio realizado</strong><small>${grouped.waitlist.length} pessoa(s) na espera inicial. O resultado permanece salvo até um novo sorteio.</small></div></div>`
        : `<div class="draw-status"><span>⇅</span><div><strong>Nenhum sorteio realizado</strong><small>Selecione livremente os participantes e quantos começarão na espera.</small></div></div>`;
      const drawSection = future
        ? `<section class="match-draw-section"><div class="section-title"><h2>Sorteio da espera</h2><small>Independente do limite de participantes.</small></div>${drawStatus}${this.canManageMatches() ? `<button class="btn btn-secondary btn-block" data-open-waitlist-draw="${match.id}">${match.waitlist_drawn_at ? "Refazer sorteio" : "Configurar sorteio"}</button>` : ""}</section>`
        : grouped.waitlist.length ? `<section class="match-draw-section"><div class="section-title"><h2>Resultado da espera</h2></div>${drawStatus}</section>` : "";

      const bbqExpanded = match.bbq_enabled
        ? `<section class="match-bbq-section is-enabled"><div class="section-title"><h2>Confraternização</h2><small>Configuração exclusiva desta pelada.</small></div>${barbecueParticipantsPanel}${future && this.canManageGroup() ? `<form id="matchBbqForm" class="match-bbq-form"><label class="check-row"><input name="bbq_enabled" type="checkbox" checked> Haverá churrasco nesta pelada</label><div class="bbq-expanded-options"><div class="field" id="matchBbqPriceField"><label>Valor por pessoa</label><input name="bbq_price" type="number" min="0" step="0.01" value="${Number(match.bbq_price || 0)}" inputmode="decimal"></div><button class="btn btn-secondary btn-block">Salvar churrasco</button></div></form>` : ""}</section>`
        : future && this.canManageGroup()
          ? `<section class="match-bbq-compact"><form id="matchBbqForm" class="match-bbq-form compact"><label class="check-row bbq-toggle-row"><input name="bbq_enabled" type="checkbox"> Haverá churrasco nesta pelada</label><div class="bbq-expanded-options" hidden><div class="bbq-status enabled"><span>♨</span><div><strong>Configurar churrasco</strong><small>Informe o valor e salve para abrir as opções aos participantes.</small></div></div><div class="field" id="matchBbqPriceField"><label>Valor por pessoa</label><input name="bbq_price" type="number" min="0" step="0.01" value="0" inputmode="decimal"></div><button class="btn btn-secondary btn-block">Salvar churrasco</button></div></form></section>`
          : "";

      const managerControls = future && this.canManageMatches()
        ? `<section class="attendance-manager-section"><div class="section-title"><h2>Gestão da escala</h2><small>${pendingPlayers.length} sem resposta.</small></div><div class="attendance-manager-actions"><button class="btn btn-secondary" data-manage-attendance="${match.id}">Gerenciar presenças</button></div></section>`
        : "";
      const deleteControls = future && this.canManageMatches() ? `<div class="delete-match-actions"><button class="btn btn-danger btn-block delete-match-button" data-delete-match="${match.id}">${recurring ? "Excluir somente esta data" : "Excluir jogo agendado"}</button>${recurring ? `<button class="btn btn-danger-outline btn-block" data-delete-series="${match.id}">Excluir esta e as próximas</button>` : ""}<p class="danger-help">A exclusão só é permitida antes do horário. Peladas realizadas permanecem no histórico.</p></div>` : "";
      this.modal(match.title, `<div class="match-detail-banner"><span class="status-pill ${future ? "status-maybe" : "status-confirmed"}">${future ? "Agendado" : "Histórico"}</span><strong>${escapeHtml(shortDate(match.starts_at))}</strong><p>${escapeHtml(match.location)}</p>${match.notes ? `<small>${escapeHtml(match.notes)}</small>` : ""}</div>${recurringInfo}${managerControls}${drawSection}${bbqExpanded}<div class="actions">${future ? `<button class="btn btn-primary" data-modal-rsvp="${match.id}">Minha presença</button>` : ""}${this.canManageMatches() ? `<button class="btn btn-secondary" data-modal-teams="${match.id}">Separar times</button>` : ""}</div>${deleteControls}${groupHtml("Começam jogando", "confirmed")}${groupHtml("Espera inicial", "waitlist")}${groupHtml("Talvez", "maybe")}${groupHtml("Não vão", "out")}`, (root, close) => {
        $("[data-modal-rsvp]", root)?.addEventListener("click", () => {
          close();
          this.openRsvp(match.id);
        });
        $("[data-modal-teams]", root)?.addEventListener("click", async () => { close(); await this.drawTeams(match.id); });
        $("[data-manage-attendance]", root)?.addEventListener("click", () => {
          close();
          this.openAttendanceManager(match.id);
        });
        $("[data-open-waitlist-draw]", root)?.addEventListener("click", () => {
          close();
          this.openWaitlistDraw(match.id);
        });
        const bbqParticipantsToggle = $("[data-toggle-bbq-participants]", root);
        if (bbqParticipantsToggle) {
          const participantsList = $("[data-bbq-participants-list]", root);
          const actionLabel = $(".bbq-participants-action-label", bbqParticipantsToggle);
          bbqParticipantsToggle.addEventListener("click", () => {
            const expanded = bbqParticipantsToggle.getAttribute("aria-expanded") !== "true";
            bbqParticipantsToggle.setAttribute("aria-expanded", String(expanded));
            bbqParticipantsToggle.classList.toggle("is-open", expanded);
            if (participantsList) participantsList.hidden = !expanded;
            if (actionLabel) actionLabel.textContent = expanded ? "Ocultar nomes" : "Ver nomes";
          });
        }
        const bbqForm = $("#matchBbqForm", root);
        if (bbqForm) {
          const enabled = $('[name="bbq_enabled"]', bbqForm);
          const options = $(".bbq-expanded-options", bbqForm);
          const price = $('[name="bbq_price"]', bbqForm);
          const refreshBbq = () => {
            if (options) options.hidden = !enabled.checked;
            if (price) price.disabled = !enabled.checked;
          };
          enabled.addEventListener("change", refreshBbq);
          refreshBbq();
          bbqForm.addEventListener("submit", async event => {
            event.preventDefault();
            const submit = event.submitter;
            if (!submit || submit.disabled) return;
            submit.disabled = true;
            submit.textContent = "Salvando...";
            await this.repo.updateMatchBbq(match.id, enabled.checked, Number(price?.value || 0));
            this.state = this.repo.state;
            close();
            this.render();
            this.openMatchDetails(match.id);
            this.toast(enabled.checked ? "Churrasco ativado para esta pelada." : "Churrasco removido desta pelada.");
          });
        }
        $("[data-delete-match]", root)?.addEventListener("click", async () => {
          const message = recurring ? "Excluir somente esta ocorrência da pelada semanal? As demais datas serão mantidas." : "Excluir definitivamente este jogo agendado?";
          if (!confirm(message)) return;
          await this.repo.deleteMatch(match.id);
          this.state = this.repo.state;
          close();
          this.render();
          this.toast(recurring ? "Ocorrência excluída. As demais foram mantidas." : "Jogo excluído.");
        });
        $("[data-delete-series]", root)?.addEventListener("click", async () => {
          if (!confirm("Excluir esta ocorrência e todas as próximas desta série semanal? Peladas anteriores e já realizadas serão preservadas.")) return;
          await this.repo.deleteMatchSeries(match.id);
          this.state = this.repo.state;
          close();
          this.render();
          this.toast("Esta ocorrência e as próximas foram excluídas.");
        });
      });
      if (this.launchMatchId && history.replaceState) {
        this.launchMatchId = "";
        history.replaceState({}, document.title, appBaseUrl());
      }
    },

    openWaitlistDraw(matchId) {
      if (!this.canManageMatches()) return this.toast("Somente administrador e organizador podem realizar o sorteio.", true);
      const match = this.state.matches.find(item => item.id === matchId);
      if (!match || new Date(match.starts_at) <= new Date()) return this.toast("O sorteio está disponível apenas em eventos futuros.", true);
      const eligibleAttendance = this.attendanceFor(matchId).filter(item => ["confirmed", "waitlist"].includes(item.status));
      const eligiblePlayers = eligibleAttendance.map(item => this.player(item.player_id)).filter(Boolean).sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));
      if (eligiblePlayers.length < 2) return this.toast("São necessárias ao menos duas presenças confirmadas para realizar o sorteio.", true);
      const currentWaitlist = new Set(eligibleAttendance.filter(item => item.status === "waitlist").map(item => item.player_id));
      const rows = eligiblePlayers.map(player => `<label class="draw-player-row"><input type="checkbox" name="draw_player" value="${player.id}" checked><span class="draw-player-check">✓</span>${this.personAvatar(player, "draw-player-avatar")}<span class="list-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.primary_position || "Sem posição")}${currentWaitlist.has(player.id) ? " · atualmente na espera" : ""}</small></span>${this.isGuest(player) ? '<span class="guest-badge">Convidado</span>' : ""}</label>`).join("");
      const initialCount = Math.max(1, Math.min(currentWaitlist.size || 1, eligiblePlayers.length - 1));
      this.modal("Sorteio da espera", `<form id="waitlistDrawForm" class="form-grid"><div class="notice"><strong>${escapeHtml(match.title)}</strong><br>Escolha exatamente quem participará do sorteio. O sorteio pode ser realizado mesmo sem exceder o limite da pelada.</div><div class="draw-selection-head"><strong>Participantes do sorteio</strong><button type="button" class="text-button" id="toggleDrawPlayers">Desmarcar todos</button></div><div class="draw-player-list">${rows}</div><div class="field"><label>Quantos começarão na espera</label><input type="number" name="waitlist_count" min="1" max="${eligiblePlayers.length - 1}" value="${initialCount}" required inputmode="numeric"><small id="drawCountHelp">Selecione ao menos 2 participantes.</small></div><div class="field"><label>Forma de exibição</label><div class="radio-grid draw-mode-grid"><label class="radio-card"><input type="radio" name="draw_mode" value="instant" checked>Instantâneo</label><label class="radio-card"><input type="radio" name="draw_mode" value="reveal">Revelação</label></div></div><button class="btn btn-primary btn-block">Realizar sorteio</button></form>`, (root, close) => {
        const form = $("#waitlistDrawForm", root);
        const checks = () => $$('input[name="draw_player"]', form);
        const countInput = $('[name="waitlist_count"]', form);
        const toggle = $("#toggleDrawPlayers", form);
        const updateLimits = () => {
          const selected = checks().filter(input => input.checked).length;
          countInput.max = String(Math.max(1, selected - 1));
          if (Number(countInput.value) > selected - 1) countInput.value = String(Math.max(1, selected - 1));
          countInput.disabled = selected < 2;
          $("#drawCountHelp", form).textContent = selected < 2 ? "Selecione ao menos 2 participantes." : `${selected} selecionado(s); até ${selected - 1} podem ir para a espera.`;
          toggle.textContent = selected ? "Desmarcar todos" : "Selecionar todos";
        };
        checks().forEach(input => input.addEventListener("change", updateLimits));
        toggle.addEventListener("click", () => {
          const shouldCheck = !checks().some(input => input.checked);
          checks().forEach(input => { input.checked = shouldCheck; });
          updateLimits();
        });
        updateLimits();
        form.addEventListener("submit", async event => {
          event.preventDefault();
          const selected = checks().filter(input => input.checked).map(input => input.value);
          const count = Number(countInput.value || 0);
          if (selected.length < 2) return this.toast("Selecione ao menos dois participantes.", true);
          if (count < 1 || count >= selected.length) return this.toast("A quantidade da espera deve ser menor que o total selecionado.", true);
          const mode = new FormData(form).get("draw_mode") || "instant";
          const submit = event.submitter;
          if (!submit || submit.disabled) return;
          submit.disabled = true;
          submit.textContent = "Sorteando...";
          try {
            const result = await this.repo.drawMatchWaitlist(matchId, selected, count);
            this.state = this.repo.state;
            close();
            this.render();
            const drawnIds = Array.isArray(result.waitlist_player_ids) ? result.waitlist_player_ids : [];
            if (!drawnIds.length) throw new Error("O sorteio não retornou participantes para a espera.");
            if (mode === "reveal") this.openWaitlistReveal(matchId, drawnIds);
            else {
              this.openMatchDetails(matchId);
              this.toast(`${Number(result.waitlist_count || count)} participante(s) sorteado(s) para a espera inicial.`);
            }
          } catch (error) {
            console.error("Falha ao realizar sorteio:", error);
            submit.disabled = false;
            submit.textContent = "Realizar sorteio";
            this.toast(error?.message || "Não foi possível realizar o sorteio.", true);
          }
        });
      });
    },

    openWaitlistReveal(matchId, playerIds) {
      const match = this.state.matches.find(item => item.id === matchId);
      const players = playerIds.map(id => this.player(id)).filter(Boolean);
      let index = 0;
      this.modal("Revelação do sorteio", `<div class="draw-reveal"><div class="draw-reveal-stage"><span class="draw-reveal-kicker">ESPERA INICIAL</span><div id="drawRevealCard" class="draw-reveal-card"><span>?</span><strong>Resultado oculto</strong><small>Toque para revelar o primeiro nome</small></div></div><div id="drawRevealProgress" class="draw-reveal-progress">0 de ${players.length} revelados</div><button class="btn btn-primary btn-block" id="revealNextDraw">Revelar próximo</button></div>`, (root, close) => {
        const card = $("#drawRevealCard", root);
        const button = $("#revealNextDraw", root);
        const progress = $("#drawRevealProgress", root);
        button.addEventListener("click", () => {
          if (index >= players.length) {
            close();
            this.openMatchDetails(matchId);
            return;
          }
          const player = players[index];
          index += 1;
          card.classList.remove("is-revealed");
          void card.offsetWidth;
          card.innerHTML = `${this.personAvatar(player, "draw-reveal-avatar")}<strong>${escapeHtml(player.name)}</strong><small>${index}º da espera inicial${this.isGuest(player) ? " · Convidado" : ""}</small>`;
          card.classList.add("is-revealed");
          progress.textContent = `${index} de ${players.length} revelados`;
          button.textContent = index >= players.length ? "Ver resultado completo" : "Revelar próximo";
        });
      });
    },

    openAttendanceManager(matchId) {
      if (!this.canManageMatches()) return this.toast("Somente administrador e organizador podem gerenciar presenças.", true);
      const match = this.state.matches.find(item => item.id === matchId);
      if (!match || new Date(match.starts_at) <= new Date()) return this.toast("As presenças de jogos do histórico não podem ser alteradas.", true);
      const attendance = new Map(this.attendanceFor(matchId).map(item => [item.player_id, item]));
      const players = this.matchPlayers(matchId).sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));
      const rows = players.map(player => {
        const current = attendance.get(player.id);
        const status = current?.status || "pending";
        const waitLabel = `Espera${current?.waitlist_position ? ` #${current.waitlist_position}` : ""}`;
        return `<label class="attendance-manager-row">${this.personAvatar(player, "attendance-manager-avatar")}<span><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.primary_position || "Sem posição")}</small></span><select name="attendance_${player.id}" data-player-id="${player.id}" data-original-status="${status}" aria-label="Presença de ${escapeHtml(player.name)}"><option value="pending" ${status === "pending" ? "selected" : ""}>Sem resposta</option><option value="confirmed" ${status === "confirmed" ? "selected" : ""}>Confirmado</option><option value="maybe" ${status === "maybe" ? "selected" : ""}>Talvez</option><option value="out" ${status === "out" ? "selected" : ""}>Ausente</option>${status === "waitlist" ? `<option value="waitlist" selected disabled>${waitLabel}</option>` : ""}</select></label>`;
      }).join("");
      this.modal("Gerenciar presenças", `<form id="attendanceManagerForm" class="form-grid"><div class="notice"><strong>${escapeHtml(match.title)}</strong><br>Administrador e organizador podem registrar respostas recebidas fora do aplicativo. A espera inicial continua sendo definida pelo sorteio.</div><div class="attendance-manager-list">${rows}</div><button class="btn btn-primary btn-block">Salvar alterações</button></form>`, (root, close) => {
        $("#attendanceManagerForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const changes = $$('select[data-player-id]', event.currentTarget).map(select => ({
            playerId: select.dataset.playerId,
            status: select.value,
            originalStatus: select.dataset.originalStatus
          })).filter(item => item.status !== item.originalStatus && item.status !== "waitlist");
          if (!changes.length) return this.toast("Nenhuma presença foi alterada.");
          const submit = event.submitter;
          submit.disabled = true;
          submit.textContent = "Salvando...";
          await this.repo.manageAttendances(matchId, changes);
          this.state = this.repo.state;
          close();
          this.render();
          this.openMatchDetails(matchId);
          this.toast(`${changes.length} presença(s) atualizada(s).`);
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
      const hadMaybeStatus = current.status === "maybe";
      const selectedStatus = current.status === "waitlist" ? "confirmed" : hadMaybeStatus ? "" : current.status;
      const waitlistNotice = current.status === "waitlist" ? `<div class="notice attendance-waitlist-notice"><strong>Você está na espera inicial</strong><br>Posição atual: ${Number(current.waitlist_position || 0) || "a definir"}. Ao escolher “Vou jogar”, sua intenção de participar será mantida.</div>` : "";
      const definitiveAnswerNotice = hadMaybeStatus ? `<div class="notice"><strong>Escolha uma resposta definitiva</strong><br>A opção “Talvez” foi removida. Confirme se você vai ou não vai participar.</div>` : "";
      this.modal("Confirmar presença", `<form id="rsvpForm" class="form-grid"><div class="notice"><strong>${escapeHtml(match.title)}</strong><br>${escapeHtml(shortDate(match.starts_at))} · ${escapeHtml(match.location)}</div>${waitlistNotice}${definitiveAnswerNotice}<div class="radio-grid">${[["confirmed", "Vou jogar"], ["out", "Não vou"]].map(([value, label]) => `<label class="radio-card"><input type="radio" name="status" value="${value}" required ${selectedStatus === value || (!current.status && value === "confirmed") ? "checked" : ""}>${label}</label>`).join("")}</div>${match.bbq_enabled ? `<label class="check-row"><input type="checkbox" name="bbq" ${current.bbq ? "checked" : ""}> Participarei do churrasco</label><div class="field"><label>Acompanhantes</label><input type="number" name="bbq_guests" min="0" max="20" value="${current.bbq_guests || 0}"></div><div class="field"><label>O que vou levar</label><input name="bbq_note" value="${escapeHtml(current.bbq_note || "")}" placeholder="Refrigerante, pão de alho..."></div>` : ""}<button class="btn btn-primary btn-block">Salvar resposta</button></form>`, (root, close) => {
        $("#rsvpForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const requestedStatus = String(form.get("status") || "");
          if (!["confirmed", "out"].includes(requestedStatus)) return this.toast("Escolha se você vai ou não vai participar.", true);
          const submit = event.submitter;
          submit.disabled = true;
          submit.textContent = "Salvando...";
          const result = await this.repo.setMyAttendance(matchId, {
            status: requestedStatus,
            bbq: form.get("bbq") === "on",
            bbqGuests: Number(form.get("bbq_guests") || 0),
            bbqNote: form.get("bbq_note") || ""
          });
          this.state = this.repo.state;
          close();
          this.render();
          const effectiveStatus = result.status || requestedStatus;
          if (effectiveStatus === "confirmed" && current.status !== "confirmed") {
            try {
              await this.repo.notifyAttendanceConfirmed(this.state.currentGroupId, matchId, player.id);
            } catch (error) {
              console.warn("Presença confirmada, mas a notificação falhou:", error);
            }
          }
          if (effectiveStatus === "waitlist") {
            this.toast(`Limite inicial preenchido. Você está na posição ${Number(result.waitlist_position || 0) || "final"} da espera.`);
          } else {
            this.toast("Presença atualizada.");
          }
        });
      });
    },

    async drawTeams(matchId) {
      if (!this.canManageMatches()) return this.toast("Seu perfil não pode formar os times.", true);
      const match = this.state.matches.find(item => item.id === matchId);
      if (match && this.confirmedFor(matchId).length > Number(match.max_players)) {
        this.openMatchDetails(matchId);
        return this.toast("Faça o sorteio da espera inicial antes de separar os times.", true);
      }
      await this.repo.balanceTeams(matchId);
      this.state = this.repo.state;
      this.route = "teams";
      this.render();
      this.toast("Times equilibrados por posição e avaliação.");
    },

    openFinanceForm() {
      if (!this.canManageFinance()) return this.toast("Somente administração e tesouraria podem alterar o caixa.", true);
      const players = this.activePlayers();
      this.modal("Novo lançamento", `<form id="financeForm" class="form-grid"><div class="field"><label>Tipo</label><select name="type"><option value="payment">Pagamento recebido</option><option value="expense">Despesa</option><option value="charge">Nova cobrança</option></select></div><div class="field"><label>Jogador</label><select name="player_id"><option value="">Não se aplica</option>${players.map(player => `<option value="${player.id}">${escapeHtml(player.name)}</option>`).join("")}</select></div><div class="notice finance-payment-link" id="paymentChargeInfo" hidden></div><div class="field"><label>Descrição</label><input name="description" required placeholder="Mensalidade, quadra, bola..."></div><div class="field"><label>Valor</label><input name="amount" type="number" min="0.01" step="0.01" required></div><button class="btn btn-primary btn-block">Salvar lançamento</button></form>`, (root, close) => {
        const formElement = $("#financeForm", root);
        const typeInput = $('[name="type"]', formElement);
        const playerInput = $('[name="player_id"]', formElement);
        const amountInput = $('[name="amount"]', formElement);
        const chargeInfo = $("#paymentChargeInfo", formElement);
        const linkedCharge = playerId => {
          if (!playerId) return null;
          return this.state.charges
            .filter(item => item.player_id === playerId && !["paid", "cancelled"].includes(item.status))
            .map(charge => {
              const paidAmount = this.state.payments
                .filter(payment => payment.charge_id === charge.id)
                .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
              return { ...charge, paidAmount, remaining: Math.max(0, Number(charge.amount || 0) - paidAmount) };
            })
            .filter(charge => charge.remaining > 0)
            .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0] || null;
        };
        const refreshPaymentLink = () => {
          const isPayment = typeInput.value === "payment";
          const charge = isPayment ? linkedCharge(playerInput.value) : null;
          chargeInfo.hidden = !isPayment;
          amountInput.removeAttribute("max");
          if (!isPayment) return;
          if (!playerInput.value) {
            chargeInfo.innerHTML = "<strong>Pagamento sem participante</strong><br>Escolha um jogador para vincular automaticamente uma cobrança pendente.";
            return;
          }
          if (!charge) {
            chargeInfo.innerHTML = "<strong>Nenhuma cobrança pendente</strong><br>O pagamento será registrado sem vínculo com cobrança.";
            return;
          }
          amountInput.max = charge.remaining.toFixed(2);
          chargeInfo.innerHTML = `<strong>Cobrança vinculada: ${escapeHtml(charge.description)}</strong><br>Total: ${money(charge.amount)} · Já pago: ${money(charge.paidAmount)} · Saldo: ${money(charge.remaining)}`;
        };
        typeInput.addEventListener("change", refreshPaymentLink);
        playerInput.addEventListener("change", refreshPaymentLink);
        refreshPaymentLink();

        formElement.addEventListener("submit", async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const type = form.get("type");
          const playerId = form.get("player_id") || null;
          const amount = Number(form.get("amount"));
          const base = { id: uid(), group_id: this.state.currentGroupId, description: form.get("description"), amount, player_id: playerId };
          let successMessage = "Lançamento salvo.";
          if (type === "payment") {
            const charge = linkedCharge(playerId);
            if (charge && amount > charge.remaining + 0.000001) {
              return this.toast(`O valor excede o saldo restante de ${money(charge.remaining)}.`, true);
            }
            await this.repo.recordPayment({ ...base, paid_at: nowIso(), method: "manual" }, charge);
            if (charge) {
              const remainingAfter = Math.max(0, charge.remaining - amount);
              successMessage = remainingAfter > 0
                ? `Pagamento parcial registrado. Restam ${money(remainingAfter)}.`
                : "Pagamento registrado. Cobrança quitada.";
            } else {
              successMessage = "Pagamento registrado sem cobrança vinculada.";
            }
          } else if (type === "expense") {
            await this.repo.mutate("expenses", { ...base, occurred_at: nowIso(), category: "outros" });
            successMessage = "Despesa registrada.";
          } else {
            await this.repo.mutate("charges", { ...base, due_date: new Date().toISOString().slice(0, 10), status: "open" });
            successMessage = "Cobrança criada.";
          }
          this.state = this.repo.state;
          close();
          this.render();
          this.toast(successMessage);
        });
      });
    },

    async deleteFinanceEntry(entryType, entryId) {
      if (!this.canManageFinance()) return this.toast("Somente administrador e tesoureiro podem excluir lançamentos.", true);
      const labels = { payment: "pagamento", expense: "despesa", charge: "cobrança" };
      const label = labels[entryType] || "lançamento";
      const complement = entryType === "payment" ? " Se estiver vinculado a uma cobrança, o valor pago, o saldo e o status serão recalculados." : "";
      if (!confirm(`Excluir este ${label} definitivamente?${complement}`)) return;
      await this.repo.deleteFinanceEntry(this.state.currentGroupId, entryType, entryId);
      this.state = this.repo.state;
      this.render();
      this.toast(`${label.charAt(0).toUpperCase() + label.slice(1)} excluído(a).`);
    },

    openPlayers() {
      if (!this.canManageMatches()) return this.toast("Somente administrador e organizador podem gerenciar convidados.", true);
      const guests = this.guestPlayers().sort((a, b) => {
        const matchA = this.state.matches.find(item => item.id === a.guest_match_id);
        const matchB = this.state.matches.find(item => item.id === b.guest_match_id);
        return new Date(matchA?.starts_at || 0) - new Date(matchB?.starts_at || 0) || String(a.name).localeCompare(String(b.name), "pt-BR");
      });
      const rows = guests.map(player => {
        const match = this.state.matches.find(item => item.id === player.guest_match_id);
        const eventLabel = match ? `${match.title} · ${shortDate(match.starts_at)}` : "Evento indisponível";
        return `<button type="button" class="card list-row guest-manage-row" data-edit-guest="${player.id}">${this.personAvatar(player)}<div class="list-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.primary_position)} · ${escapeHtml(eventLabel)}</small></div><span class="guest-badge">Convidado</span><strong>›</strong></button>`;
      }).join("");
      this.modal("Convidados por evento", `<button class="btn btn-primary btn-block" id="addPlayer">+ Incluir convidado</button><div class="section-title"><h2>Convidados cadastrados</h2><small>Visíveis somente no evento escolhido.</small></div><div class="list">${rows || '<div class="card empty">Nenhum convidado cadastrado.</div>'}</div>`, root => {
        $("#addPlayer", root)?.addEventListener("click", event => {
          if (event.currentTarget.disabled) return;
          event.currentTarget.disabled = true;
          this.openPlayerForm();
        }, { once: true });
        $$('[data-edit-guest]', root).forEach(button => button.addEventListener("click", () => this.openPlayerForm(button.dataset.editGuest), { once: true }));
      });
    },

    openPlayerForm(playerId = null) {
      if (!this.canManageMatches()) return this.toast("Sem permissão para gerenciar convidados.", true);
      const player = playerId ? this.state.players.find(item => item.id === playerId && item.guest_match_id) : null;
      if (playerId && !player) return this.toast("Convidado não encontrado.", true);
      const futureMatches = this.state.matches
        .filter(match => new Date(match.starts_at) > new Date() && !["cancelled", "finished"].includes(match.status))
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      if (!player && !futureMatches.length) return this.toast("Crie um evento futuro antes de incluir convidados.", true);
      const eventOptions = futureMatches.map(match => `<option value="${match.id}" ${player?.guest_match_id === match.id ? "selected" : ""}>${escapeHtml(match.title)} · ${escapeHtml(shortDate(match.starts_at))}</option>`).join("");
      const positionItems = positionOptions.map(position => `<option value="${position}" ${player?.primary_position === position ? "selected" : ""}>${position}</option>`).join("");
      const title = player ? "Editar convidado" : "Incluir convidado";
      this.modal(title, `<form id="playerForm" class="form-grid" novalidate><div class="field"><label>Evento</label><select name="match_id" required ${player ? "disabled" : ""}><option value="">Selecione o evento</option>${eventOptions}</select>${player ? `<input type="hidden" name="match_id" value="${player.guest_match_id}">` : ""}</div><div class="field"><label>Nome</label><input name="name" required minlength="2" maxlength="80" autocomplete="off" value="${escapeHtml(player?.name || "")}" placeholder="Ex.: João da Silva"><small>Letras, espaços, ponto, apóstrofo e hífen.</small></div><div class="field"><label>Apelido <span class="optional-label">opcional</span></label><input name="nickname" maxlength="40" autocomplete="off" value="${escapeHtml(player?.nickname || "")}" placeholder="Ex.: João"></div><div class="field"><label>Posição</label><select name="position" required><option value="">Selecione a posição</option>${positionItems}</select></div><label class="check-row"><input name="goalkeeper" type="checkbox" ${player?.goalkeeper ? "checked" : ""}> Também joga no gol</label><button class="btn btn-primary btn-block" type="submit">${player ? "Salvar alterações" : "Incluir convidado"}</button>${player ? '<button class="btn btn-danger-outline btn-block" type="button" id="deleteGuest">Excluir convidado</button>' : ""}</form>`, (root, close) => {
        const formEl = $("#playerForm", root);
        let submitting = false;
        formEl.addEventListener("submit", async event => {
          event.preventDefault();
          if (submitting) return;
          const form = new FormData(formEl);
          const name = String(form.get("name") || "").trim().replace(/\s+/g, " ");
          const nickname = String(form.get("nickname") || "").trim().replace(/\s+/g, " ");
          const position = String(form.get("position") || "");
          const matchId = String(form.get("match_id") || "");
          const validText = /^[\p{L}][\p{L}\p{M} .’'\-]{1,79}$/u;
          const validNickname = !nickname || /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .’'\-]{0,39}$/u.test(nickname);
          if (!matchId) return this.toast("Selecione o evento do convidado.", true);
          if (!validText.test(name)) return this.toast("Informe um nome válido usando letras, espaços, ponto, apóstrofo ou hífen.", true);
          if (!validNickname) return this.toast("O apelido contém caracteres não permitidos.", true);
          if (!positionOptions.includes(position)) return this.toast("Selecione a posição do convidado.", true);
          submitting = true;
          const submit = formEl.querySelector('button[type="submit"]');
          $$('button, input, select', formEl).forEach(control => control.disabled = true);
          submit.textContent = player ? "Salvando..." : "Incluindo...";
          try {
            const payload = { playerId: player?.id, matchId, name, nickname, position, goalkeeper: form.get("goalkeeper") === "on" || position === "Goleiro" };
            if (player) await this.repo.updateMatchGuest(payload); else await this.repo.createMatchGuest(payload);
            this.state = this.repo.state;
            close();
            this.render();
            this.toast(player ? "Dados do convidado atualizados." : "Convidado incluído no evento.");
          } catch (error) {
            submitting = false;
            $$('button, input, select', formEl).forEach(control => control.disabled = false);
            if (player) $('[name="match_id"]', formEl).disabled = true;
            submit.textContent = player ? "Salvar alterações" : "Incluir convidado";
            this.toast(error.message || "Não foi possível salvar o convidado.", true);
          }
        });
        $("#deleteGuest", root)?.addEventListener("click", async event => {
          if (submitting || !confirm(`Excluir ${player.name} deste evento?`)) return;
          submitting = true;
          event.currentTarget.disabled = true;
          event.currentTarget.textContent = "Excluindo...";
          try {
            await this.repo.deleteMatchGuest(player.id);
            this.state = this.repo.state;
            close();
            this.render();
            this.toast("Convidado excluído do evento.");
          } catch (error) {
            submitting = false;
            event.currentTarget.disabled = false;
            event.currentTarget.textContent = "Excluir convidado";
            this.toast(error.message || "Não foi possível excluir o convidado.", true);
          }
        }, { once: true });
      });
    },

    openProblemReport() {
      this.modal("Reportar problema", `<form id="problemForm" class="form-grid"><div class="notice"><strong>Beta fechado</strong><br>O relatório inclui automaticamente versão, aparelho, tela atual e estado das notificações. Não inclua senhas ou dados sensíveis.</div><div class="field"><label>Categoria</label><select name="category"><option value="erro">Erro ou função que não respondeu</option><option value="visual">Problema visual</option><option value="notificacao">Notificação</option><option value="sugestao">Sugestão de melhoria</option></select></div><div class="field"><label>Resumo</label><input name="title" maxlength="100" required placeholder="Ex.: não consegui confirmar presença"></div><div class="field"><label>O que aconteceu?</label><textarea name="description" maxlength="1500" required placeholder="Descreva os passos, o resultado esperado e o que apareceu na tela."></textarea></div><label class="check-row"><input type="checkbox" name="contact_ok" checked><span>O suporte pode entrar em contato pelo e-mail da minha conta.</span></label><button type="submit" class="btn btn-primary btn-block">Enviar relatório</button></form>`, (root, close) => {
        $("#problemForm", root).addEventListener("submit", async event => {
          event.preventDefault();
          const button = event.currentTarget.querySelector('button[type="submit"]');
          const form = new FormData(event.currentTarget);
          button.disabled = true; button.textContent = "Enviando…";
          try {
            await this.repo.reportProblem({ category: form.get("category"), title: form.get("title"), description: form.get("description"), contactOk: form.get("contact_ok") === "on" });
            close();
            this.toast("Relatório enviado. Obrigado por ajudar no beta.");
          } catch (error) {
            button.disabled = false; button.textContent = "Enviar relatório";
            this.toast(error.message || "Não foi possível enviar o relatório.", true);
          }
        });
      });
    },

    async openDiagnostics() {
      const online = navigator.onLine;
      const push = pushSupported() ? Notification.permission : "não suportado";
      const subscription = pushSupported() ? await this.currentPushSubscription().catch(() => null) : null;
      let dbStatus = "Disponível";
      try { await this.repo.session(); } catch { dbStatus = "Falha"; }
      const sync = this.lastSyncAt ? shortDate(this.lastSyncAt) : "Não registrada";
      const updateText = this.updateAvailable ? "Atualização pendente" : "Sem atualização detectada";
      this.modal("Sobre e diagnóstico", `<div class="diagnostic-grid"><div class="diagnostic-item ${online ? "ok" : "bad"}"><span></span><div><small>Internet</small><strong>${online ? "Conectado" : "Offline"}</strong></div></div><div class="diagnostic-item ${dbStatus === "Disponível" ? "ok" : "bad"}"><span></span><div><small>Banco e sessão</small><strong>${dbStatus}</strong></div></div><div class="diagnostic-item ${subscription ? "ok" : "warn"}"><span></span><div><small>Push deste aparelho</small><strong>${escapeHtml(subscription ? "Vinculado" : push)}</strong></div></div><div class="diagnostic-item ${this.updateAvailable ? "warn" : "ok"}"><span></span><div><small>Atualização</small><strong>${escapeHtml(updateText)}</strong></div></div></div><div class="system-info-card"><div><span>Aplicativo</span><strong>${APP_RELEASE.version}</strong></div><div><span>Build</span><strong>${APP_RELEASE.build}</strong></div><div><span>Banco esperado</span><strong>${APP_RELEASE.database}</strong></div><div><span>Última sincronização</span><strong>${escapeHtml(sync)}</strong></div><div><span>Modo</span><strong>${isStandalone() ? "Instalado" : "Navegador"}</strong></div><div><span>Dispositivo</span><strong>${escapeHtml(deviceLabel())}</strong></div></div><button class="btn btn-secondary btn-block" data-action="check-update">Verificar atualização</button><button class="btn btn-primary btn-block" data-action="report-problem">Reportar problema</button>`, () => {});
    },

    async openPlatformAdmin() {
      if (!this.state.is_platform_admin) return this.toast("Acesso restrito à administração da plataforma.", true);
      this.modal("Painel Beta", `<div class="admin-loading">Carregando indicadores, acessos e erros…</div>`, () => {});
      try {
        const data = await this.repo.platformDashboard();
        const s = data.summary || {};
        const security = data.security || {};
        const errorGroups = data.errorGroups || [];
        const accessList = data.accessList || [];
        document.querySelector(".modal-layer")?.remove();

        const stat = (label, value, tone = "") => `<div class="admin-stat ${tone}"><small>${escapeHtml(label)}</small><strong>${escapeHtml(String(value ?? 0))}</strong></div>`;
        const statusLabel = status => ({ active: "Ativo", invited: "Convidado", blocked: "Bloqueado" }[status] || status);
        const accessRows = accessList.map(item => {
          const status = item.status || "invited";
          const action = status === "blocked" ? "active" : "blocked";
          const actionLabel = status === "blocked" ? "Reativar" : "Bloquear";
          const lastSeen = item.last_seen_at ? shortDate(item.last_seen_at) : "Ainda não acessou";
          const isCurrentAdmin = String(item.email || "").toLowerCase() === String(this.state.profile?.email || "").toLowerCase();
          const actionButton = isCurrentAdmin ? '<span class="access-self-label">Você</span>' : `<button type="button" class="access-action ${action === "blocked" ? "danger" : "restore"}" data-access-email="${escapeHtml(item.email)}" data-access-status="${action}">${actionLabel}</button>`;
          return `<article class="beta-access-row"><div class="beta-access-main"><div><strong>${escapeHtml(item.user_name || item.email)}</strong><small>${escapeHtml(item.email)} · ${escapeHtml(lastSeen)}</small></div><span class="beta-access-status ${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span></div><div class="beta-access-meta"><span>${Number(item.groups_count || 0)} grupo(s)</span>${item.notes ? `<span>${escapeHtml(item.notes)}</span>` : ""}</div>${actionButton}</article>`;
        }).join("") || '<div class="card empty">Nenhum e-mail cadastrado.</div>';

        const errorRows = errorGroups.map((item, index) => {
          const build = item.build ? `Build ${item.build}` : "Build não informada";
          const location = [item.source, item.line ? `linha ${item.line}` : ""].filter(Boolean).join(" · ");
          return `<article class="admin-error-group"><div class="admin-error-head"><span class="admin-error-count">${Number(item.occurrences || 0)}×</span><div><strong>${escapeHtml(item.message || "Erro sem mensagem")}</strong><small>${escapeHtml(item.event_type)} · ${escapeHtml(build)}${location ? ` · ${escapeHtml(location)}` : ""}</small></div></div><div class="admin-error-metrics"><span>${Number(item.affected_users || 0)} usuário(s)</span><span>Primeiro: ${escapeHtml(shortDate(item.first_seen))}</span><span>Último: ${escapeHtml(shortDate(item.last_seen))}</span></div><button type="button" class="btn btn-secondary btn-small" data-error-index="${index}">Ver ocorrências e metadados</button></article>`;
        }).join("") || '<div class="card empty">Nenhum erro registrado nas últimas 24 horas.</div>';

        const reports = (data.reports || []).map(item => `<details class="admin-feed-item"><summary><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(shortDate(item.created_at))}</small></div></summary><p>${escapeHtml(item.description)}</p><span>${escapeHtml(item.reporter_name || item.reporter_email || "Usuário")}${item.group_name ? ` · ${escapeHtml(item.group_name)}` : ""}</span><pre>${escapeHtml(JSON.stringify(item.context || {}, null, 2))}</pre></details>`).join("") || '<div class="card empty">Nenhum relato recebido.</div>';
        const logs = (data.logs || []).map(item => `<details class="admin-log-detail"><summary><span class="log-dot ${escapeHtml(item.severity)}"></span><div><strong>${escapeHtml(item.event_type)}</strong><small>${escapeHtml(shortDate(item.created_at))}${item.group_name ? ` · ${escapeHtml(item.group_name)}` : ""}</small></div></summary><pre>${escapeHtml(JSON.stringify(item.metadata || {}, null, 2))}</pre></details>`).join("") || '<div class="card empty">Nenhum log recente.</div>';

        const securityTone = Number(security.tables_without_rls || 0) || Number(security.auth_users_without_access || 0) ? "warn" : "ok";
        const systemStatus = Number(s.errors_24h || 0) ? "Sistema requer análise" : "Sistema operacional";
        const errorSubtitle = `${Number(s.errors_24h || 0)} registro(s) distribuído(s) em ${Number(s.error_groups_24h || 0)} erro(s) distinto(s)`;

        this.modal("Painel Beta", `<div class="health-strip ${Number(s.errors_24h || 0) ? "warn" : "ok"}"><span></span><div><strong>${systemStatus}</strong><small>${escapeHtml(errorSubtitle)}</small></div></div><div class="admin-toolbar"><button id="sendSystemNotification" class="btn btn-primary">Enviar notificação</button><button id="refreshPlatformPanel" class="btn btn-secondary">Atualizar painel</button></div><div class="admin-stats">${stat("Usuários", s.users_total)}${stat("Acessos ativos", s.beta_active)}${stat("Convites pendentes", s.beta_invited, Number(s.beta_invited || 0) ? "warning" : "")}${stat("Bloqueados", s.beta_blocked, Number(s.beta_blocked || 0) ? "danger" : "")}${stat("Grupos", s.groups_total)}${stat("Peladas futuras", s.matches_upcoming)}${stat("Relatos abertos", s.feedback_open, Number(s.feedback_open || 0) ? "warning" : "")}${stat("Erros 24h", s.errors_24h, Number(s.errors_24h || 0) ? "danger" : "")}</div>

        <details class="admin-section-card" open><summary><div><strong>Acessos do beta</strong><small>Autorize o e-mail antes do primeiro login.</small></div><span>${accessList.length}</span></summary><form id="betaAccessForm" class="beta-access-form"><div class="field"><label>E-mail da conta Google</label><input type="email" name="email" required autocomplete="off" placeholder="membro@gmail.com"></div><div class="field"><label>Observação <span class="optional-label">opcional</span></label><input name="notes" maxlength="500" placeholder="Grupo ou responsável pelo convite"></div><button type="submit" class="btn btn-primary btn-block">Autorizar e-mail</button></form><div class="beta-access-list">${accessRows}</div></details>

        <details class="admin-section-card" open><summary><div><strong>Erros agrupados — 24 horas</strong><small>Analise causas distintas, não apenas o contador bruto.</small></div><span>${errorGroups.length}</span></summary><div class="admin-error-list">${errorRows}</div></details>

        <details class="admin-section-card"><summary><div><strong>Segurança e integridade</strong><small>Verificações automáticas do banco.</small></div><span class="security-mini ${securityTone}">${securityTone === "ok" ? "OK" : "Atenção"}</span></summary><div class="security-grid">${stat("Tabelas sem RLS", security.tables_without_rls, Number(security.tables_without_rls || 0) ? "danger" : "")}${stat("Auth sem acesso", security.auth_users_without_access, Number(security.auth_users_without_access || 0) ? "danger" : "")}${stat("Vínculos bloqueados", security.blocked_group_memberships, Number(security.blocked_group_memberships || 0) ? "warning" : "")}${stat("Função do hook", security.hook_function_ready ? "Preparada" : "Ausente", security.hook_function_ready ? "" : "danger")}</div><div class="notice"><strong>Proteção de novos cadastros</strong><br>A função do hook foi instalada. Ative-a uma vez em Authentication → Hooks → Before User Created para impedir que contas não autorizadas sejam criadas.</div></details>

        <details class="admin-section-card"><summary><div><strong>Relatos recentes</strong><small>Descrição e contexto técnico completo.</small></div><span>${(data.reports || []).length}</span></summary><div class="admin-feed">${reports}</div></details>
        <details class="admin-section-card"><summary><div><strong>Logs recentes</strong><small>Abra cada registro para consultar os metadados.</small></div><span>${(data.logs || []).length}</span></summary><div class="admin-logs">${logs}</div></details>
        <button id="exportOperationalSnapshot" class="btn btn-secondary btn-block">Exportar dados operacionais — 30 dias</button>`, (root, close) => {
          $("#sendSystemNotification", root)?.addEventListener("click", () => this.openSystemNotificationForm());
          $("#refreshPlatformPanel", root)?.addEventListener("click", () => { close(); this.openPlatformAdmin(); });
          $("#betaAccessForm", root)?.addEventListener("submit", async event => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const button = event.submitter;
            button.disabled = true;
            button.textContent = "Autorizando…";
            try {
              await this.repo.inviteBetaAccess(String(form.get("email") || ""), String(form.get("notes") || ""));
              close();
              this.toast("E-mail autorizado para o beta.");
              this.openPlatformAdmin();
            } catch (error) {
              button.disabled = false;
              button.textContent = "Autorizar e-mail";
              this.toast(error.message || "Não foi possível autorizar o e-mail.", true);
            }
          });
          $$('[data-access-email]', root).forEach(button => button.addEventListener("click", async event => {
            const target = event.currentTarget;
            const email = target.dataset.accessEmail;
            const status = target.dataset.accessStatus;
            const verb = status === "blocked" ? "bloquear" : "reativar";
            if (!confirm(`Deseja ${verb} o acesso de ${email}?`)) return;
            target.disabled = true;
            try {
              await this.repo.setBetaAccessStatus(email, status);
              close();
              this.toast(status === "blocked" ? "Acesso bloqueado imediatamente." : "Acesso reativado.");
              this.openPlatformAdmin();
            } catch (error) {
              target.disabled = false;
              this.toast(error.message || "Não foi possível alterar o acesso.", true);
            }
          }));
          $$('[data-error-index]', root).forEach(button => button.addEventListener("click", () => {
            const group = errorGroups[Number(button.dataset.errorIndex)];
            if (group) this.openPlatformErrorDetails(group);
          }));
          $("#exportOperationalSnapshot", root)?.addEventListener("click", async event => {
            const button = event.currentTarget;
            button.disabled = true;
            button.textContent = "Preparando exportação…";
            try {
              const exported = await this.repo.platformOperationalExport(30, 5000);
              const blob = new Blob([JSON.stringify({ release: APP_RELEASE, ...exported }, null, 2)], { type: "application/json" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `resenha-fc-beta-operacao-${new Date().toISOString().slice(0,10)}.json`;
              link.click();
              URL.revokeObjectURL(link.href);
              button.disabled = false;
              button.textContent = "Exportar dados operacionais — 30 dias";
            } catch (error) {
              button.disabled = false;
              button.textContent = "Exportar dados operacionais — 30 dias";
              this.toast(error.message || "Não foi possível exportar os dados.", true);
            }
          });
        });
      } catch (error) {
        document.querySelector(".modal-layer")?.remove();
        this.toast(error.message || "Não foi possível carregar o painel.", true);
      }
    },

    async openPlatformErrorDetails(group) {
      if (!this.state.is_platform_admin) return;
      this.modal("Detalhes do erro", `<div class="admin-loading">Carregando ocorrências…</div>`, () => {});
      try {
        const rows = await this.repo.platformErrorDetails(group);
        document.querySelector(".modal-layer")?.remove();
        const details = rows.map(item => `<details class="error-occurrence"><summary><div><strong>${escapeHtml(item.user_name || item.user_email || "Usuário não identificado")}</strong><small>${escapeHtml(shortDate(item.created_at))}${item.group_name ? ` · ${escapeHtml(item.group_name)}` : ""}</small></div><span>Ver JSON</span></summary><pre>${escapeHtml(JSON.stringify(item.metadata || {}, null, 2))}</pre></details>`).join("") || '<div class="card empty">Nenhuma ocorrência encontrada.</div>';
        this.modal("Detalhes do erro", `<div class="error-detail-summary"><span>${Number(group.occurrences || 0)} ocorrência(s)</span><strong>${escapeHtml(group.message || "Erro sem mensagem")}</strong><small>${escapeHtml(group.event_type)}${group.build ? ` · Build ${escapeHtml(group.build)}` : ""}</small></div><div class="error-occurrence-list">${details}</div>`, () => {});
      } catch (error) {
        document.querySelector(".modal-layer")?.remove();
        this.toast(error.message || "Não foi possível carregar as ocorrências.", true);
      }
    },

    openAnnouncementCenter(selectedId = "") {
      const announcements = [...(this.state.announcements || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const canManage = this.canManageMatches();
      const list = announcements.length ? announcements.map(item => `<article class="announcement-card ${item.id === selectedId ? "is-selected" : ""}"><div class="announcement-icon">📣</div><div class="announcement-content"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(shortDate(item.created_at))}${item.push_sent_count || item.push_failed_count ? ` · ${Number(item.push_sent_count || 0)} enviado(s)` : ""}</small><p>${escapeHtml(item.body)}</p>${canManage ? `<div class="announcement-actions"><button class="announcement-action resend" data-resend-announcement="${item.id}">↻ Reenviar</button><button class="announcement-action delete" data-delete-announcement="${item.id}">Excluir</button></div>` : ""}</div></article>`).join("") : '<div class="card empty"><strong>Nenhum aviso publicado</strong><span>Os comunicados do grupo aparecerão aqui.</span></div>';
      this.modal("Avisos do grupo", `<div class="announcement-list">${list}</div>`, (root, close) => {
        if (selectedId) root.querySelector(".announcement-card.is-selected")?.scrollIntoView({ block: "center" });
        $$('[data-resend-announcement]', root).forEach(button => button.addEventListener("click", async event => {
          const target = event.currentTarget;
          target.disabled = true;
          target.textContent = "Reenviando…";
          try {
            const result = await this.repo.resendAnnouncement(this.state.currentGroupId, target.dataset.resendAnnouncement);
            this.state = this.repo.state;
            const sent = Number(result.sent || 0);
            const failed = Number(result.failed || 0);
            close();
            this.render();
            this.toast(sent ? `Aviso reenviado a ${sent} aparelho(s)${failed ? `; ${failed} falharam` : ""}.` : "Aviso mantido, mas nenhum aparelho recebeu o push.", !sent);
          } catch (error) {
            target.disabled = false;
            target.textContent = "↻ Reenviar";
            this.toast(error.message || "Não foi possível reenviar o aviso.", true);
          }
        }));
        $$('[data-delete-announcement]', root).forEach(button => button.addEventListener("click", async event => {
          if (!confirm("Excluir este aviso definitivamente? Ele será removido da Central de avisos, mas notificações já entregues não podem ser apagadas do celular.")) return;
          const target = event.currentTarget;
          target.disabled = true;
          try {
            await this.repo.deleteAnnouncement(target.dataset.deleteAnnouncement);
            this.state = this.repo.state;
            close();
            this.render();
            this.toast("Aviso excluído.");
          } catch (error) {
            target.disabled = false;
            this.toast(error.message || "Não foi possível excluir o aviso.", true);
          }
        }));
      });
      navigator.clearAppBadge?.().catch?.(() => {});
      if (this.launchAnnouncementId && history.replaceState) {
        this.launchAnnouncementId = "";
        history.replaceState({}, document.title, appBaseUrl());
      }
    },

    async currentPushSubscription() {
      if (!pushSupported()) return null;
      const registration = await this.ensureServiceWorker();
      return registration?.pushManager?.getSubscription() || null;
    },

    async enablePushNotifications() {
      if (!pushSupported()) throw new Error("Este navegador não oferece notificações push.");
      const publicKey = String(window.RESENHA_CONFIG?.vapidPublicKey || "").trim();
      if (!publicKey) throw new Error("A chave pública VAPID ainda não foi configurada.");
      if (isIos() && !isStandalone()) throw new Error("No iPhone, adicione o Resenha FC à Tela de Início e abra pelo ícone antes de ativar as notificações.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error(permission === "denied" ? "As notificações foram bloqueadas nos ajustes do aparelho." : "A permissão para notificações não foi concedida.");
      const registration = await this.ensureServiceWorker();
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(publicKey)
        });
      }
      await this.repo.savePushSubscription(subscription);
      this.state = this.repo.state;
      return subscription;
    },

    async disablePushNotifications(silent = false) {
      if (!pushSupported()) return;
      try {
        const subscription = await this.currentPushSubscription();
        if (!subscription) return;
        await this.repo.removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
        this.state = this.repo.state;
      } catch (error) {
        if (!silent) throw error;
        console.warn("Não foi possível remover a assinatura push durante a saída.", error);
      }
    },

    async maybeShowNotificationOnboarding() {
      const key = "resenha-notification-onboarding-v1";
      if (localStorage.getItem(key) === "done") return;
      if (!isStandalone() || !pushSupported()) return;
      if (!String(window.RESENHA_CONFIG?.vapidPublicKey || "").trim()) return;
      if (Notification.permission === "denied") {
        localStorage.setItem(key, "done");
        return;
      }
      try {
        const subscription = await this.currentPushSubscription();
        const endpoint = subscription?.endpoint || "";
        const linked = Boolean(endpoint && (this.state.push_subscriptions || []).some(item => item.endpoint === endpoint && item.enabled));
        if (subscription && linked) {
          localStorage.setItem(key, "done");
          return;
        }
      } catch (error) {
        console.warn("Falha ao verificar o primeiro acesso às notificações.", error);
      }

      const overlay = document.createElement("div");
      overlay.className = "notification-onboarding-overlay";
      overlay.innerHTML = `<section class="notification-onboarding-card" role="dialog" aria-modal="true" aria-labelledby="notificationOnboardingTitle"><div class="notification-onboarding-icon">🔔</div><h2 id="notificationOnboardingTitle">Ative as notificações</h2><p>Receba avisos do grupo, novas peladas e confirmações de presença mesmo quando o Resenha FC estiver fechado.</p><button type="button" class="btn btn-primary btn-block" id="notificationOnboardingEnable">Ativar agora</button><button type="button" class="notification-onboarding-later" id="notificationOnboardingLater">Agora não</button><small>Você poderá alterar esta opção depois em Mais → Notificações no celular.</small></section>`;
      document.body.appendChild(overlay);
      const finish = () => {
        localStorage.setItem(key, "done");
        overlay.remove();
      };
      $("#notificationOnboardingLater", overlay)?.addEventListener("click", finish);
      $("#notificationOnboardingEnable", overlay)?.addEventListener("click", async event => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "Ativando…";
        try {
          await this.enablePushNotifications();
          finish();
          this.toast("Notificações ativadas neste aparelho.");
        } catch (error) {
          button.disabled = false;
          button.textContent = "Ativar agora";
          this.toast(error.message || "Não foi possível ativar as notificações.", true);
        }
      });
    },

    openSystemNotificationForm() {
      if (!this.state.is_platform_admin) return this.toast("Acesso restrito à administração da plataforma.", true);
      this.modal("Notificação do sistema", `<form id="systemNotificationForm" class="form-grid"><div class="notice notice-success"><strong>Envio para toda a plataforma</strong><br>A notificação será enviada a todos os aparelhos ativos vinculados ao Resenha FC.</div><div class="field"><label>Título</label><input name="title" required maxlength="80" autocomplete="off" placeholder="Ex.: Atualização disponível"></div><div class="field"><label>Mensagem</label><textarea name="body" required maxlength="500" placeholder="Escreva a comunicação do sistema"></textarea></div><button id="publishSystemNotificationButton" type="submit" class="btn btn-primary btn-block">Enviar para todos</button></form>`, (root, close) => {
        const form = $("#systemNotificationForm", root);
        const button = $("#publishSystemNotificationButton", root);
        form?.addEventListener("submit", async event => {
          event.preventDefault();
          if (!button || button.disabled) return;
          const data = new FormData(event.currentTarget);
          const title = String(data.get("title") || "").trim();
          const body = String(data.get("body") || "").trim();
          if (title.length < 2 || body.length < 2) return this.toast("Informe um título e uma mensagem válidos.", true);
          if (!confirm("Enviar esta notificação para todos os usuários com aparelho vinculado?")) return;
          button.disabled = true;
          button.textContent = "Enviando…";
          try {
            const result = await this.repo.publishSystemNotification(title, body);
            close();
            const sent = Number(result.sent || 0);
            const failed = Number(result.failed || 0);
            this.toast(sent ? `Notificação enviada a ${sent} aparelho(s)${failed ? `; ${failed} falharam` : ""}.` : "Nenhum aparelho ativo recebeu a notificação.", !sent);
          } catch (error) {
            button.disabled = false;
            button.textContent = "Enviar para todos";
            this.toast(error.message || "Não foi possível enviar a notificação do sistema.", true);
          }
        });
      });
    },

    async openNotificationSettings() {
      const supported = pushSupported();
      const configured = Boolean(String(window.RESENHA_CONFIG?.vapidPublicKey || "").trim());
      const subscription = supported ? await this.currentPushSubscription() : null;
      const endpoint = subscription?.endpoint || "";
      const linked = Boolean(endpoint && (this.state.push_subscriptions || []).some(item => item.endpoint === endpoint && item.enabled));
      const permission = supported ? Notification.permission : "unsupported";
      const iosInstallRequired = isIos() && !isStandalone();
      const active = Boolean(subscription && linked);
      const status = active ? "Ativas neste aparelho" : subscription && !linked ? "Aguardando vinculação" : permission === "denied" ? "Bloqueadas nos ajustes" : "Desativadas neste aparelho";
      const explanation = !supported ? "O navegador deste aparelho não oferece a tecnologia necessária." : !configured ? "A chave pública VAPID precisa ser adicionada ao supabase-config.js." : iosInstallRequired ? "No iPhone, notificações funcionam quando o site é adicionado à Tela de Início e aberto pelo ícone." : subscription && !linked ? "A permissão existe no aparelho, mas a assinatura ainda não está registrada no grupo. Toque em Vincular novamente." : "Você receberá os avisos publicados pelo administrador ou organizador, mesmo com o aplicativo fechado.";
      const action = active ? '<button class="btn btn-danger btn-block" id="disablePush">Desativar neste aparelho</button>' : `<button class="btn btn-primary btn-block" id="enablePush">${subscription ? "Vincular novamente" : "Ativar notificações"}</button>`;
      this.modal("Notificações no celular", `<div class="notification-status-card ${active ? "is-active" : ""}"><span>🔔</span><div><strong>${escapeHtml(status)}</strong><p>${escapeHtml(explanation)}</p></div></div>${configured && supported && !iosInstallRequired ? action : ""}<div class="notice"><strong>Privacidade</strong><br>A ativação vale somente para este aparelho. Você pode desativar a qualquer momento.</div>`, (root, close) => {
        $("#enablePush", root)?.addEventListener("click", async event => {
          const button = event.currentTarget; button.disabled = true; button.textContent = "Ativando…";
          try { await this.enablePushNotifications(); close(); this.toast("Notificações ativadas e vinculadas neste aparelho."); }
          catch (error) { button.disabled = false; button.textContent = subscription ? "Vincular novamente" : "Ativar notificações"; this.toast(error.message, true); }
        });
        $("#disablePush", root)?.addEventListener("click", async event => {
          const button = event.currentTarget; button.disabled = true; button.textContent = "Desativando…";
          try { await this.disablePushNotifications(); close(); this.toast("Notificações desativadas neste aparelho."); }
          catch (error) { button.disabled = false; button.textContent = "Desativar neste aparelho"; this.toast(error.message, true); }
        });
      });
    },

    openAnnouncementForm() {
      if (!this.canManageMatches()) return this.toast("Sem permissão para publicar avisos.", true);
      this.modal("Publicar aviso", `<form id="noticeForm" class="form-grid"><div class="notice notice-success"><strong>Aviso com notificação</strong><br>O comunicado será salvo no grupo e enviado aos aparelhos que ativaram notificações.</div><div class="field"><label>Título</label><input name="title" required maxlength="80" autocomplete="off"></div><div class="field"><label>Mensagem</label><textarea name="body" required maxlength="500"></textarea></div><button id="publishNoticeButton" type="submit" class="btn btn-primary btn-block">Publicar e notificar</button></form>`, (root, close) => {
        const noticeForm = $("#noticeForm", root);
        const button = $("#publishNoticeButton", root);
        noticeForm?.addEventListener("submit", async event => {
          event.preventDefault();
          if (!button || button.disabled) return;

          const form = new FormData(event.currentTarget);
          const title = String(form.get("title") || "").trim();
          const body = String(form.get("body") || "").trim();
          if (title.length < 2 || body.length < 2) {
            this.toast("Informe um título e uma mensagem válidos.", true);
            return;
          }

          button.disabled = true;
          button.textContent = "Publicando…";
          try {
            const result = await this.repo.publishAnnouncement(this.state.currentGroupId, title, body);
            this.state = this.repo.state;
            close();
            this.render();
            const sent = Number(result.sent || 0);
            const failed = Number(result.failed || 0);
            const subscriptions = Number(result.subscriptions || 0);
            if (sent > 0) {
              this.toast(`Aviso publicado e enviado a ${sent} aparelho(s)${failed ? `; ${failed} envio(s) falharam` : ""}.`);
            } else if (subscriptions > 0 || failed > 0) {
              const reason = String(result.failureReason || "").trim();
              const status = Number(result.failureStatus || 0);
              this.toast(`Aviso publicado, mas o envio falhou em ${failed || subscriptions} aparelho(s)${status ? ` (código ${status})` : ""}${reason ? `: ${reason}` : "."}`, true);
            } else {
              this.toast("Aviso publicado. Nenhum integrante possui assinatura vinculada no banco.");
            }
          } catch (error) {
            button.disabled = false;
            button.textContent = "Publicar e notificar";
            console.error("Falha ao publicar aviso:", error);
            this.toast(error?.message || "Não foi possível publicar o aviso.", true);
          }
        });
      });
    },

    async logout() {
      if (!confirm("Deseja sair da sua conta neste aparelho?")) return;
      clearInterval(this.accessCheckTimer);
      await this.disablePushNotifications(true);
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
