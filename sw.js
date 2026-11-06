// Offline support for The Snooker Century Game.
// Bump CACHE when files change so phones pick up the new version.
const CACHE = "snooker-century-v21";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", event => {
  // Fetch fresh copies (not the browser's HTTP cache) when installing a new version.
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // Pages: network first so updates show up, fall back to cache when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      // "no-cache" skips GitHub's 10-minute browser cache so new versions show up straight away.
      fetch(req, { cache: "no-cache" })
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Everything else: cache first.
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
