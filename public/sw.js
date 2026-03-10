// Service worker — minimal, just enables PWA install prompt
// No caching strategy since data must always be fresh from Redis

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Pass all fetches through to network — no caching
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
