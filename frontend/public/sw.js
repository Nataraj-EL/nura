const CACHE_NAME = "nura-assets-v1";
const STATIC_ASSETS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // SECURE SW CACHING BOUNDARY RULES:
  // 1. NEVER cache any API calls
  // 2. NEVER cache HTML page navigations (e.g. /, /cycle, /wellness, /dashboard) to prevent caching private logged context
  // 3. Only cache explicitly public/static files (manifest, brand pngs)
  if (url.pathname.startsWith("/api/") || 
      event.request.mode === "navigate" || 
      event.request.destination === "document") {
    // Force direct network loading without service worker caching
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
