/* ================================================================
   Memphis Live Traffic — Service Worker
   Cache-first for app shell, network-first for API/tile data
   ================================================================ */

const CACHE_NAME = 'memphis-live-v4';

// App shell files to cache on install
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './scanner.js',
  './scanner_data.js',
  './speedcams.js',
  './vox.js',
  './cameras.json',
  './ms_cameras.json',
  './ar_cameras.json',
  './tn_speed_cams.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// External resources to cache on install
const EXT_CACHE = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap',
];

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([...APP_SHELL, ...EXT_CACHE]);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-only for API calls (live data should always be fresh)
  if (
    url.hostname.includes('tdot.tn.gov') ||
    url.hostname.includes('tspatial.tdot.tn.gov') ||
    url.hostname.includes('mdottraffic.com') ||
    url.hostname.includes('idrivearkansas.com') ||
    url.hostname.includes('broadcastify.com') ||
    url.hostname.includes('allorigins') ||
    url.hostname.includes('api.tomtom.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for tile images (map tiles are large, change rarely)
  if (
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('basemaps.cartocdn.com') ||
    url.hostname.includes('server.arcgisonline.com')
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return resp;
        });
      })
    );
    return;
  }

  // Cache-first for app shell, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(resp => {
        if (resp.ok && event.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return resp;
      });
    })
  );
});
