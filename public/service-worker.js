
const CacheType = {
  STATIC_CONTENT: 'v1-static-content',
  DYNAMIC_CONTENT: 'v2-dynamic-content',
};

const nonCacheableRequestProtocols = ['chrome-extension'];

let cacheStaticResources = function (cache) {
  console.log('Caching static content..');
  cache.addAll([
    '/',
    '/index.html',
    '/offline.html',
    '/favicon.ico',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  ]);
};

self.addEventListener('install', event => {
  console.log('Service worker installed:', event);
  event.waitUntil(caches.open(CacheType.STATIC_CONTENT).then(cacheStaticResources));
});

self.addEventListener('activate', event => {
  console.log('Service worker activated:', event);
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key !== CacheType.STATIC_CONTENT && key !== CacheType.DYNAMIC_CONTENT)
    .map(key => caches.delete(key))
  )));
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request)
    .then(cachedResponse => {
        console.log('Fetch:', event.request.method + ' ' + event.request.url);
        console.log('  cached response is:', cachedResponse);
        return cachedResponse ? cachedResponse : fetch(event.request)
          .then(response => {
            return caches.open(CacheType.DYNAMIC_CONTENT).then(cache => {
              let url = event.request.url;
              if (!nonCacheableRequestProtocols.find(protocol => url.startsWith(protocol))) {
                cache.put(url, response.clone());
              }
              return response;
            });
          })
          .catch(error => caches.open(CacheType.STATIC_CONTENT).then(cache => cache.match('/offline.html')));
      }));
});
