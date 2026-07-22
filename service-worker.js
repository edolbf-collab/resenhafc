const CACHE = "resenha-fc-beta-1.0-build-104";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./supabase-config.js",
  "./manifest.webmanifest",
  "./offline.html",
  "./version.json",
  "./brand/brand-mark.png",
  "./brand/logo-resenha-fc.png",
  "./login-logo-transparent-v0311.png",
  "./brand/brand-mark-transparent-v0311.png",
  "./group-avatars-data.js",
  "./icons/favicon-16x16.png",
  "./icons/favicon-32x32.png",
  "./icons/icon-96.png",
  "./icons/icon-192-v023.png",
  "./icons/icon-512-v023.png",
  "./icons/maskable-icon-192.png",
  "./icons/maskable-icon-512.png",
  "./apple-touch-icon.png",
  "./apple-touch-icon-180x180-v023.png",
  ...Array.from({ length: 20 }, (_, index) => `./assets/group-avatars/badge-${String(index + 1).padStart(2, "0")}.png`)
];

self.addEventListener("install", event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await Promise.allSettled(ASSETS.map(async asset => {
    try { await cache.add(asset); }
    catch (error) { console.warn("Asset não armazenado no cache:", asset, error); }
  }));
  await self.skipWaiting();
})()));

self.addEventListener("activate", event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())
));

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  const navigation = event.request.mode === "navigate";
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response?.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }).then(hit => hit || (navigation ? caches.match("./index.html", { ignoreSearch: true }) : caches.match("./offline.html", { ignoreSearch: true }))))
  );
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
