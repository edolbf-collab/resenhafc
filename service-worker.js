const CACHE = "resenha-fc-beta-1.0-build-118";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=beta118",
  "/app.js?v=beta118",
  "/pwa-bootstrap.js?v=beta118",
  "/supabase-config.js?v=0.3.3",
  "/cloud-client-loader.js?v=beta118",
  "/group-avatars-data.js?v=beta118",
  "/manifest.json",
  "/offline.html",
  "/version.json",
  "/resenhafc-icon-192.png",
  "/resenhafc-icon-512.png",
  "/resenhafc-maskable-192.png",
  "/resenhafc-maskable-512.png",
  "/apple-touch-icon.png",
  "/login-logo-transparent-v0311.png",
  "/brand/brand-mark-transparent-v0311.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    const isCloudLibrary = (url.hostname === "cdn.jsdelivr.net" || url.hostname === "unpkg.com")
      && url.pathname.includes("@supabase/supabase-js");
    if (!isCloudLibrary) {
      event.respondWith(fetch(event.request));
      return;
    }
    event.respondWith(caches.open(CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      try {
        const response = await fetch(event.request);
        if (response.ok || response.type === "opaque") cache.put(event.request, response.clone()).catch(() => {});
        return response;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    }));
    return;
  }
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put("/index.html", response.clone())).catch(() => {});
      return response;
    }).catch(async () => (await caches.match("/index.html")) || caches.match("/")));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => {
    const network = fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone())).catch(() => {});
      return response;
    });
    return cached || network;
  }));
});

self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data?.json() || {}; }
  catch { payload = { body: event.data?.text() || "Novo aviso do grupo." }; }

  const title = payload.title || "Resenha FC";
  const options = {
    body: payload.body || "Novo aviso do grupo.",
    icon: payload.icon || "./icons/icon-192-v023.png",
    badge: payload.badge || "./icons/icon-96.png",
    tag: payload.tag || "resenha-fc-aviso",
    renotify: true,
    data: payload.data || { url: payload.url || "./?page=home" },
    vibrate: [120, 60, 120],
    timestamp: payload.timestamp || Date.now()
  };

  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    try { await self.registration.setAppBadge?.(1); } catch {}
  })());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./?page=home", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("navigate" in client) await client.navigate(target);
      if ("focus" in client) return client.focus();
    }
    return self.clients.openWindow(target);
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
