const CACHE = "resenha-fc-v0.2.1";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./supabase-config.js", "./manifest.webmanifest", "./offline.html", "./brand/brand-mark.png", "./brand/logo-resenha-fc.png", "./icons/favicon-16x16.png", "./icons/favicon-32x32.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-icon-192.png", "./icons/maskable-icon-512.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
));
self.addEventListener("activate", event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(hit => hit || caches.match("./offline.html")))
  );
});
