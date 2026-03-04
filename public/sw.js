const CACHE = 'tarteel-v1'
const STATIC = 'tarteel-static-v1'

// App shell — adjust paths to match your Next.js output
const PRECACHE = [
  '/',
  '/read',
  '/offline',
]

// ── Install: precache shell ──────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

// ── Activate: purge old caches ───────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== STATIC).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// ── Fetch strategy ───────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return

  // Audio CDN — cache-first (large files, rarely change)
  if (url.hostname === 'cdn.islamic.network') {
    e.respondWith(cacheFirst(request, CACHE))
    return
  }

  // Quran API — network-first, fallback to cache
  if (url.hostname === 'api.alquran.cloud') {
    e.respondWith(networkFirst(request, CACHE))
    return
  }

  // Next.js static assets (_next/static) — cache-first
  if (url.pathname.startsWith('/_next/static')) {
    e.respondWith(cacheFirst(request, STATIC))
    return
  }

  // Navigation (HTML pages) — network-first, fallback /offline
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline') || caches.match('/')
      )
    )
    return
  }

  // Everything else — stale-while-revalidate
  e.respondWith(staleWhileRevalidate(request, CACHE))
})

// ── Helpers ──────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    throw new Error('Network error and no cache available')
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)
  return cached || fetchPromise
}
