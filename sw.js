// ==========================================
// APEX SCHOOL PORTAL - SERVICE WORKER v1.8.0
// ==========================================

const CACHE_NAME = 'apex-school-v2.3.0';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './feed.xml',
  './css/variables.css',
  './css/layout.css',
  './css/components.css',
  './css/mobile.css',
  './js/db.js',
  './js/auth.js',
  './js/feed.js',
  './js/dashboard.js',
  './js/router.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

function toCacheKey(input) {
  const url = typeof input === 'string' ? new URL(input, self.location.origin) : new URL(input.url);
  url.hash = '';
  url.search = '';

  if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    return './index.html';
  }

  if (url.pathname === '/' || url.pathname === '') {
    return './';
  }

  return `.${url.pathname}`;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pre-caching app shell');
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })
  );
});

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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (
    !isSameOrigin ||
    url.pathname.startsWith('/api/') ||
    event.request.url.includes('rss2json') ||
    event.request.url.includes('api.github.com') ||
    event.request.url.includes('unpkg.com')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  const cacheKey = toCacheKey(event.request);

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(cacheKey);
        if (cached) return cached;

        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }

        return new Response('', { status: 503 });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
