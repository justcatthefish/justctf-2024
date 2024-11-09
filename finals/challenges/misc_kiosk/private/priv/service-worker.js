const CACHE_NAME = 'mycache';
const FILES_TO_CACHE = [
  '/',
  '/service-worker.js',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/images/favicon.ico',
  '/images/mstile-144x144.png',
  '/js/functionality.js',
];

// Install the service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return the cached response if found, else fetch it from the network
        return response || fetch(event.request);
      })
  );
});

// Update the service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
console.log("Service worker registered!");