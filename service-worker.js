const CACHE_NAME = 'poke-chart-cache-v190';
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
  './rewards_admin.js',
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

// Fetch Event
//
// Local app code (HTML, JS modules, CSS, manifest) is NETWORK-FIRST, with the
// cache used only as an offline fallback. Every ES module is also versioned via
// <script type="importmap"> in index.html so even a pre-Checkpoint-63 cache-first
// Service Worker treats imported modules as cache-busted URLs.
//
// `cache: 'no-cache'` makes the browser revalidate with GitHub Pages' ETag
// instead of trusting its 10-minute `max-age`, so an unchanged file is a cheap
// 304 and a changed file is never served stale from the HTTP cache.
//
// PokeAPI sprites are immutable, so they stay cache-first.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Handle PokeAPI sprite requests (external GitHub raw URLs)
  const isPokeapiSprite = url.hostname === 'raw.githubusercontent.com' && (url.pathname.includes('/sprites/pokemon/') || url.pathname.includes('/sprites/items/'));
  const isNavigation = event.request.mode === 'navigate';
  const isLocalAsset = url.origin === self.location.origin && (
    isNavigation ||
    /\.(?:js|css|html|json)$/i.test(url.pathname) ||
    ASSETS_TO_CACHE.some(asset => {
      if (asset === './') {
        return url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
      }
      return url.pathname.endsWith(asset.replace('./', ''));
    })
  );

  if (isLocalAsset) {
    // Navigations are cached under './index.html' so the offline fallback finds them.
    const cacheKey = isNavigation ? './index.html' : event.request;
    const networkRequest = isNavigation ? event.request : new Request(event.request.url, { cache: 'no-cache' });
    event.respondWith(
      fetch(networkRequest)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(cacheKey, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(cacheKey, { ignoreSearch: true }))
    );
    return;
  }

  if (isPokeapiSprite) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
              }
              return networkResponse;
            })
            // Offline fallback for sprites that were never cached
            .catch(() => caches.match('./icon.png'));
        })
    );
  }
});
