const CACHE_NAME = 'civicfix-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/issues.html',
  '/my-reports.html',
  '/admin.html',
  '/admin-login.html',
  '/issue.html',
  '/style.css',
  '/language.js',
  '/app.js',
  '/dashboard.js',
  '/public.js',
  '/admin.js',
  '/issue.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass API, uploads, and non-GET requests from service worker cache
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads') || event.request.method !== 'GET') {
    return;
  }

  // Network-First strategy: always fetch fresh assets from server; fallback to cache if offline
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network is offline or unreachable
        return caches.match(event.request);
      })
  );
});
