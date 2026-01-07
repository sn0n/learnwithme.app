// Service Worker for Learn With Me App
const VERSION = '1.0.1';
const CACHE_NAME = `learn-with-me-v${VERSION}`;
const DATA_CACHE_NAME = `learn-with-me-data-v${VERSION}`;

const urlsToCache = [
  '/',
  '/index.html',
  '/data.json',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml'
];

// CDN resources cached separately with network-first strategy
const cdnUrls = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing version ${VERSION}...`);
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })))
          .catch((error) => {
            console.error('[Service Worker] Failed to cache app shell:', error);
            return Promise.resolve();
          });
      }),
      caches.open(DATA_CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching CDN resources');
        return cache.addAll(cdnUrls.map(url => new Request(url, { cache: 'reload' })))
          .catch((error) => {
            console.error('[Service Worker] Failed to cache CDN resources:', error);
            return Promise.resolve();
          });
      })
    ]).then(() => {
      console.log(`[Service Worker] Version ${VERSION} installed successfully`);
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Activating version ${VERSION}...`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log(`[Service Worker] Version ${VERSION} activated successfully`);
      // Notify all clients about the new version
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: VERSION
          });
        });
      });
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle CDN resources with network-first strategy
  if (cdnUrls.some(cdnUrl => request.url.includes(new URL(cdnUrl).hostname))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(DATA_CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Handle app resources with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          // For data.json, check for updates in the background
          if (request.url.includes('data.json')) {
            fetch(request).then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, networkResponse);
                });
              }
            }).catch(() => {});
          }
          return response;
        }

        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);
          return new Response('Offline - please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});

// Periodic background sync for updates (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'update-check') {
    event.waitUntil(
      fetch('/sw.js')
        .then(response => response.text())
        .then(text => {
          const versionMatch = text.match(/const VERSION = '(.+)'/);
          if (versionMatch && versionMatch[1] !== VERSION) {
            self.registration.update();
          }
        })
        .catch(error => console.error('[Service Worker] Update check failed:', error))
    );
  }
});
