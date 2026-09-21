const CACHE_VERSION = 'naga-v4';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;

const PRECACHE_ROUTES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/admin',
  '/admin/staff',
  '/admin/resident',
  '/admin/guest',
  '/admin/staff/dashboard',
  '/hope',
];

const STATIC_EXTS   = /\.(js|css|woff2?|ttf|otf)(\?.*)?$/;
const IMAGE_EXTS    = /\.(png|jpe?g|svg|gif|webp|avif|ico)(\?.*)?$/;
const NEVER_CACHE   = /\/(api|socket|hmr)\//;

// ── Install: cache shell routes ─────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then((c) => c.addAll(PRECACHE_ROUTES))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge old caches, notify clients of update ───────────
self.addEventListener('activate', (e) => {
  const current = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !current.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED' })))
  );
});

// ── Message: skip waiting on demand ────────────────────────────────
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (NEVER_CACHE.test(url.pathname)) return;

  // External resources — network with fallback
  if (url.origin !== location.origin) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // Images — cache-first, long-lived
  if (IMAGE_EXTS.test(url.pathname)) {
    e.respondWith(cacheFirst(e.request, IMAGE_CACHE));
    return;
  }

  // JS / CSS / fonts — stale-while-revalidate
  if (STATIC_EXTS.test(url.pathname)) {
    e.respondWith(staleWhileRevalidate(e.request, STATIC_CACHE));
    return;
  }

  // HTML / navigation — network-first (always get latest shell)
  e.respondWith(networkFirst(e.request, DYNAMIC_CACHE));
});

// ── Strategies ──────────────────────────────────────────────────────
async function cacheFirst(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fresh  = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fresh;
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    // SPA fallback: root shell, then branded offline page
    const root = await cache.match('/');
    if (root) return root;
    const offline = await cache.match('/offline.html');
    return offline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

// ── Background sync stub ────────────────────────────────────────────
self.addEventListener('sync', (e) => {
  if (e.tag === 'naga-sync') {
    e.waitUntil(Promise.resolve());
  }
});

// ── Push notification stub ──────────────────────────────────────────
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'NAGA', body: 'You have a new notification.' };
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'NAGA', {
      body:    data.body ?? '',
      icon:    '/icon-192.svg',
      badge:   '/icon-192.svg',
      tag:     'naga-push',
      renotify: false,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url ?? '/admin/staff'));
});
