/* ============================================================
   MindFlash — Service Worker (PWA)
   Strategi:
   - Shell aplikasi di-precache saat install (offline siap pakai)
   - Navigasi halaman  : network-first, fallback ke shell (offline)
   - Aset same-origin  : cache-first + update di latar belakang
   - Font Google       : cache-first (offline tetap tampil cantik)
   - API Supabase      : tidak di-cache (selalu data terbaru)
   ============================================================ */

const CACHE = 'mindflash-v2'

const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Navigasi halaman: network-first, offline → shell dari cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy))
          return res
        })
        .catch(() =>
          caches.match(req).then((m) => m || caches.match('/index.html')),
        ),
    )
    return
  }

  // Font Google: cache-first supaya offline tetap memakai font kustom
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetched = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone()
              caches.open(CACHE).then((cache) => cache.put(req, copy))
            }
            return res
          })
          .catch(() => cached)
        return cached || fetched
      }),
    )
    return
  }

  // Aset statis same-origin (JS/CSS/gambar ber-hash): cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetched = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone()
              caches.open(CACHE).then((cache) => cache.put(req, copy))
            }
            return res
          })
          .catch(() => cached)
        return cached || fetched
      }),
    )
    return
  }

  // API & lainnya (Supabase): biarkan jaringan menangani
})
