// ==========================================
// APEX SCHOOL PORTAL - SERVICE WORKER v1.6.0
// ==========================================

const CACHE_NAME = 'apex-school-v2.0.1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/layout.css',
  './css/components.css',
  './css/mobile.css',
  './js/db.js',
  './js/feed.js',
  './js/dashboard.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json'
];

// ── Install: cache all static assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Network-first for RSS/API, Cache-first for assets ──────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always go to network for external APIs (RSS feeds, rss2json)
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith('/api/') ||
    event.request.url.includes('rss2json') ||
    event.request.url.includes('unpkg.com')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Cache-first strategy for local static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Cache valid responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── Background Sync / Push (future-ready) ─────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
