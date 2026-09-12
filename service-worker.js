const CACHE_NAME = 'poke-chart-cache-v139';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './state.js',
  './firebase.js',
  './migrations.js',
  './vault.js',
  './badges.js',
  './shop.js',
  './guide.js',
  './pokemon_data.js',
  './date_utils.js',
  './admin.js',
  './audio.js',
  './particles.js',
  './icon.png',
  './manifest.json'
];

// Install Event - cache core assets with cache-busting/bypass HTTP cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Force network fetch for all assets to bypass browser HTTP cache during SW install
        const requests = ASSETS_TO_CACHE.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
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

// Fetch Event - network-first for navigation, cache-busting aware for local assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle PokeAPI sprite requests (external GitHub raw URLs)
  const isPokeapiSprite = url.hostname === 'raw.githubusercontent.com' && (url.pathname.includes('/sprites/pokemon/') || url.pathname.includes('/sprites/items/'));
  const isLocalAsset = ASSETS_TO_CACHE.some(asset => {
    if (asset === './') {
      return url.pathname === '/' || url.pathname === '/index.html';
    }
    const cleanAsset = asset.replace('./', '');
    return url.pathname.endsWith(cleanAsset);
  });

  if (isLocalAsset || isPokeapiSprite) {
    // For navigation requests (index.html), use Network-First so app updates load immediately when online
    if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
      event.respondWith(
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put('./index.html', responseToCache));
            }
            return networkResponse;
          })
          .catch(() => caches.match('./index.html', { ignoreSearch: true }))
      );
      return;
    }

    // For local assets with explicit query parameters (e.g. style.css?v=10.25), do NOT ignoreSearch
    // so cache-busting query strings fetch fresh code instead of returning stale cached CSS/JS!
    const matchOptions = (isLocalAsset && url.search) ? {} : { ignoreSearch: true };
    event.respondWith(
      caches.match(event.request, matchOptions)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fetch from network and cache
          return fetch(event.request)
            .then(networkResponse => {
              if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && !isPokeapiSprite)) {
                return networkResponse;
              }
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
              return networkResponse;
            })
            .catch(() => {
              // Offline fallback for images if not cached
              if (isPokeapiSprite) {
                return caches.match('./icon.png');
              }
            });
        })
    );
  }
});
