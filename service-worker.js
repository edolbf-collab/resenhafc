const CACHE = "resenha-fc-v0.3.0";
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
  "./login-logo-v024.png",
  "./icons/favicon-16x16.png",
  "./icons/favicon-32x32.png",
  "./icons/icon-192-v023.png",
  "./icons/icon-512-v023.png",
  "./icons/maskable-icon-192.png",
  "./icons/maskable-icon-512.png",
  "./apple-touch-icon.png",
  "./apple-touch-icon-180x180-v023.png",
  "./assets/group-avatars/badge-01.svg",
  "./assets/group-avatars/badge-02.svg",
  "./assets/group-avatars/badge-03.svg",
  "./assets/group-avatars/badge-04.svg",
  "./assets/group-avatars/badge-05.svg",
  "./assets/group-avatars/badge-06.svg",
  "./assets/group-avatars/badge-07.svg",
  "./assets/group-avatars/badge-08.svg",
  "./assets/group-avatars/badge-09.svg",
  "./assets/group-avatars/badge-10.svg",
  "./assets/group-avatars/badge-11.svg",
  "./assets/group-avatars/badge-12.svg",
  "./assets/group-avatars/badge-13.svg",
  "./assets/group-avatars/badge-14.svg",
  "./assets/group-avatars/badge-15.svg",
  "./assets/group-avatars/badge-16.svg",
  "./assets/group-avatars/badge-17.svg",
  "./assets/group-avatars/badge-18.svg",
  "./assets/group-avatars/badge-19.svg",
  "./assets/group-avatars/badge-20.svg"
];

self.addEventListener("install", event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
));

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
      .catch(() => caches.match(event.request).then(hit => hit || (navigation ? caches.match("./index.html") : caches.match("./offline.html"))))
  );
});
