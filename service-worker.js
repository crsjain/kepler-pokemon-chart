const CACHE_NAME = 'poke-chart-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './particles.js',
  './icon.png',
  './manifest.json'
];

// Install Event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - cache-first for static assets and sprites
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle PokeAPI sprite requests (external GitHub raw URLs)
  const isPokeapiSprite = url.hostname === 'raw.githubusercontent.com' && url.pathname.includes('/sprites/pokemon/');
  const isLocalAsset = ASSETS_TO_CACHE.some(asset => event.request.url.includes(asset.replace('./', '')));

  if (isLocalAsset || isPokeapiSprite) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached version
            // For local assets, we can optionally update cache in background (Stale-While-Revalidate)
            if (isLocalAsset) {
              fetch(event.request).then(networkResponse => {
                if (networkResponse.status === 200) {
                  caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
                }
              }).catch(() => {}); // Ignore network errors
            }
            return cachedResponse;
          }

          // Fetch from network and cache
          return fetch(event.request)
            .then(networkResponse => {
              if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && !isPokeapiSprite)) {
                return networkResponse;
              }
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return networkResponse;
            })
            .catch(() => {
              // Offline fallback for images if not cached
              if (isPokeapiSprite) {
                // Return a default pokeball placeholder if offline and sprite not cached
                return caches.match('./icon.png');
              }
            });
        })
    );
  }
});
