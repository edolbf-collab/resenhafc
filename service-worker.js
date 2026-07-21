const CACHE = "resenha-fc-v0.3.2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./supabase-config.js",
  "./manifest.webmanifest",
  "./offline.html",
  "./brand/brand-mark.png",
  "./brand/logo-resenha-fc.png",
  "./login-logo-transparent-v0311.png",
  "./brand/brand-mark-transparent-v0311.png",
  "./group-avatars-data.js",
  "./icons/favicon-16x16.png",
  "./icons/favicon-32x32.png",
  "./icons/icon-192-v023.png",
  "./icons/icon-512-v023.png",
  "./icons/maskable-icon-192.png",
  "./icons/maskable-icon-512.png",
  "./apple-touch-icon.png",
  "./apple-touch-icon-180x180-v023.png",
  "./assets/group-avatars/badge-01.png",
  "./assets/group-avatars/badge-02.png",
  "./assets/group-avatars/badge-03.png",
  "./assets/group-avatars/badge-04.png",
  "./assets/group-avatars/badge-05.png",
  "./assets/group-avatars/badge-06.png",
  "./assets/group-avatars/badge-07.png",
  "./assets/group-avatars/badge-08.png",
  "./assets/group-avatars/badge-09.png",
  "./assets/group-avatars/badge-10.png",
  "./assets/group-avatars/badge-11.png",
  "./assets/group-avatars/badge-12.png",
  "./assets/group-avatars/badge-13.png",
  "./assets/group-avatars/badge-14.png",
  "./assets/group-avatars/badge-15.png",
  "./assets/group-avatars/badge-16.png",
  "./assets/group-avatars/badge-17.png",
  "./assets/group-avatars/badge-18.png",
  "./assets/group-avatars/badge-19.png",
  "./assets/group-avatars/badge-20.png"
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
