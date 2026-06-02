/**
 * Hujjat.uz Service Worker — PWA offline support
 * Strategy: Network-first for navigation, cache-first for static assets.
 * API calls (/api/*) are never cached — they need live server.
 */

const CACHE = 'hujjat-uz-v3';
const SHELL  = ['/', '/index.html'];

// ── Install: cache app shell ──────────────────────────────────────────────────
self.addEventListener('install', ev => {
  self.skipWaiting();
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .catch(e => console.warn('[SW] Shell cache failed:', e))
  );
});

// ── Activate: delete stale caches ────────────────────────────────────────────
self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', ev => {
  const req = ev.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests
  if (req.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // Never cache API calls — they need a live key
  if (url.pathname.startsWith('/api/')) return;

  ev.respondWith(handleFetch(req));
});

async function handleFetch(req) {
  // Static assets (JS, CSS, fonts, images): cache-first
  const isAsset = /\.(js|css|woff2?|ttf|svg|png|jpg|ico)$/i.test(new URL(req.url).pathname);

  if (isAsset) {
    const cached = await caches.match(req);
    if (cached) return cached;
  }

  // Network first for everything else
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached || caches.match('/index.html');
  }
}

// ── Message: force update ─────────────────────────────────────────────────────
self.addEventListener('message', ev => {
  if (ev.data === 'SKIP_WAITING') self.skipWaiting();
});
