/// <reference lib="webworker" />
// The service worker. It keeps the app shell in a cache so Desk opens offline.
// It never caches /api/ responses.

export {};

const sw = self as unknown as ServiceWorkerGlobalScope;
declare const DESK_BUILD: string;
declare const DESK_SHELL: string[];

const CACHE = `desk-shell-${DESK_BUILD}`;

sw.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(DESK_SHELL))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("desk-shell-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => sw.clients.claim()),
  );
});

sw.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== sw.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    // Network first for pages, so a new version shows at once. The cached shell is the offline fallback.
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/", { cacheName: CACHE })) ?? Response.error()),
    );
    return;
  }

  event.respondWith(caches.match(request, { cacheName: CACHE }).then((cached) => cached ?? fetch(request)));
});
