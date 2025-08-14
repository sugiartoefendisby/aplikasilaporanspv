const CACHE_NAME = 'laporan-spv-v4';
const OFFLINE_URL = '/offline.html';
const CACHE_FILES = [
  '/',
  '/index.html',
  '/report-form.html',
  '/offline.html',
  '/login-style.css',
  '/report-style.css',
  '/login.js',
  '/report.js',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_FILES))
  );
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, response));
        return response.clone();
      })
      .catch(() => {
        // Fallback to offline page for HTML requests
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
        // For other files (CSS, JS, images)
        return caches.match(event.request);
      })
  );
});

// Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});