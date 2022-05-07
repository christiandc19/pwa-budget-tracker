const APP_PREFIX = 'budget-tracker-';     
const VERSION = 'version_01';
const DATA_CACHE_NAME = APP_PREFIX + 'data-' + VERSION;
const CACHE_NAME = APP_PREFIX + VERSION;

const FILES_TO_CACHE = [
    "/",
    "./index.html",
    "./assets/css/styles.css",
    "./assets/js/index.js",
    "./manifest.json",
    "./assets/js/db.js",
    "./assets/icons/icon-192x192.png",
    "./assets/icons/icon-512x512.png",
    "./assets/icons/icon-384x384.png",
  ];

// Install the service worker
self.addEventListener('install', function(evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log('Installing cache: ' + CACHE_NAME);
        console.log('cache', cache)
        return cache.addAll(FILES_TO_CACHE);
      }).catch(error => console.log(error))
    );
  
    self.skipWaiting();
  });
  
// Activate the service worker and remove old data from the cache
self.addEventListener('activate', function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log('Removing old cache data', key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });
  

// Intercept fetch requests
self.addEventListener('fetch', function(evt) {
    if (evt.request.url.includes('/api/')) {
      evt.respondWith(
        caches
          .open(DATA_CACHE_NAME)
          .then(cache => {
            return fetch(evt.request)
              .then(response => {
                // If the response was good, clone it and store it in the cache.
                if (response.status === 200) {
                  cache.put(evt.request.url, response.clone());
                }
  
                return response;
              })
              .catch(err => {
                // Network request failed, try to get it from the cache.
                return cache.match(evt.request);
              });
          })
          .catch(err => console.log(err))
      );
  
      return;
    }
  
    evt.respondWith(
      fetch(evt.request).catch(function() {
        return caches.match(evt.request).then(function(response) {
          if (response) {
            return response;
          } else {
            // return the cached home page for all requests for html pages
            return fetch(evt.request);
          }
        });
      })
    );
  });