const CACHE_NAME = 'grainflow-v1';
const RUNTIME_CACHE = 'grainflow-runtime-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
// Replace your existing Fetch event with this "Network-First" logic
self.addEventListener('fetch', event => {
  const { request } = event;
  
  event.respondWith(
    fetch(request)
      .then(response => {
        // If network is successful, update the cache and return response
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails (OFFLINE), look in cache
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          // If even cache fails, show the offline index.html
          return caches.match('/index.html');
        });
      })
  );
});

// Background sync for offline transactions (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      // Sync logic here when connection is restored
      Promise.resolve()
    );
  }
});
