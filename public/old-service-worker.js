
importScripts('/src/js/libs/idb.js');
importScripts('/src/js/indexed-db.js');
importScripts('/src/js/background-sync.js');
importScripts('/src/js/notification.js');

const CacheType = {
  STATIC_CONTENT: 'v1-static-content',
  DYNAMIC_CONTENT: 'v1-dynamic-content',
};
const nonCacheableRequestProtocols = ['chrome-extension'];

const staticResources = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/src/js/libs/idb.js',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
];

const networkThenCacheResources = [
  'https://for-pwa-sample.firebaseio.com/posts.json'
];

let cacheStaticResources = function (cache) {
  console.log('Caching static content..');
  cache.addAll(staticResources);
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

let cacheWithNetworkFallback = event => caches.match(event.request).then(cachedResponse => {
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
    .catch(error => caches.open(CacheType.STATIC_CONTENT).then(cache => {
      if (event.request.headers.get('accept').includes('text/html')) {
        return cache.match('/offline.html');
      }
    }));
});

let networkThenCache = event => caches.open(CacheType.DYNAMIC_CONTENT).then(cache => {
  return fetch(event.request).then(response => {
    cache.add(event.request, response.clone());
    return response;
  }).catch(error => {
    return caches.match(event.request);
  });
});

let cacheOnlyStrategy = event => caches.match(event.request);

let networkThenIndexedDB = event => {
  return fetch(event.request).then(response => {
    clearAllDataFromIndexedDB(DBStore.POSTS).then(() => {
      response.json().then(data => {
        for (let key in data) {
          saveDataToIndexedDB(DBStore.POSTS, data[key]);
        }
      });
    });
    return response.clone();
  }).catch(error => {
    return caches.match(event.request);
  });
};

self.addEventListener('fetch', event => {
  console.log('Fetch:', event.request.method + ' ' + event.request.url);
  if (networkThenCacheResources.find(url => event.request.url === url)) {
    console.log('  network then indexedDB strategy');
    event.respondWith(networkThenIndexedDB(event));
  } else if (staticResources.indexOf((event.request.url.indexOf(self.origin) === 0 ? event.request.url.substring(self.origin.length) : event.request.url)) > -1) {
    console.log('  cache only strategy');
    event.respondWith(cacheOnlyStrategy(event));
  } else {
    console.log('  cache then network strategy');
    event.respondWith(cacheWithNetworkFallback(event));
  }
});

let newPostUrl = 'https://us-central1-for-pwa-sample.cloudfunctions.net/newPost';

self.addEventListener('sync', event => {
  console.log('Background sync event triggered - tag:', event.tag);
  switch (event.tag) {
    case SyncTask.NEW_POSTS:
      event.waitUntil(getDataFromIndexedDB(DBStore.SYNC_POSTS).then(postsToSync => {
        postsToSync.forEach(post => {
          fetch(newPostUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(post)
          }).then(response => {
            if (response.ok) {
              response.json() 
                .then(responseBody => deleteDataFromIndexedDB(DBStore.SYNC_POSTS, responseBody.id));
            }
          });
        });
      }));
  }
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  console.log('notification: ', notification);
  console.log('action: ', event.action);

  switch (event.action) {
    case NotificationAction.CONFIRM:
      console.log('Notification confirmed!! :)');
      break;
    case NotificationAction.CANCEL:
      console.log('Notification canceled..  :(');
      break;
  }

  notification.close();
});

self.addEventListener('notificationclose', event => {
  console.log('notification closed: ', event);
});

self.addEventListener('push', event => {
  console.log('push notification event: ', event);
  if (event.data) {
    let data = JSON.parse(event.data.text());
    let options = {
      body: data.content,
      icon: '/src/images/icons/apple-icon-76x76.png',
      badge: '/src/images/icons/apple-icon-76x76.png'
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

