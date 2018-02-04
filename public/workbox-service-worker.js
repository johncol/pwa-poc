importScripts('workbox-sw.prod.v2.1.2.js');
importScripts('/src/js/libs/idb.js');
importScripts('/src/js/indexed-db.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(/.*(?:googleapis)\.com.*$/, 
  workboxSW.strategies.staleWhileRevalidate({ 
    cacheName: 'google',
    cacheExpiration: {
      maxEnties: 10,
      maxAgeSeconds: 60 * 60 * 24 * 30 // one month
    }
  }));

workboxSW.router.registerRoute(/.*(?:gstatic)\.com.*$/, 
  workboxSW.strategies.staleWhileRevalidate({ 
    cacheName: 'fonts'
  }));

workboxSW.router.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/, 
  workboxSW.strategies.staleWhileRevalidate({ 
    cacheName: 'firebase-images'
  }));

workboxSW.router.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', 
  workboxSW.strategies.staleWhileRevalidate({ 
    cacheName: 'material-css'
  }));

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

workboxSW.router.registerRoute('https://for-pwa-sample.firebaseio.com/posts.json', 
  args => networkThenIndexedDB(args.event)
);

let isFetchEventForHtmlResource = routeData => routeData.event.request.headers.get('accept').includes('text/html');

const NOT_INITIALLY_CACHED_HTML_RESOURCES = 'some-html';
let cacheWithNetworkFallbackPlusOfflineFallback = event => caches.match(event.request).then(cachedResponse => {
  return cachedResponse ? cachedResponse : fetch(event.request)
    .then(response => {
      return caches.open(NOT_INITIALLY_CACHED_HTML_RESOURCES).then(cache => {
        cache.put(event.request.url, response.clone());
        return response;
      });
    })
    .catch(error => caches.match('/offline.html'));
});

workboxSW.router.registerRoute(isFetchEventForHtmlResource, 
  args => cacheWithNetworkFallbackPlusOfflineFallback(args.event)
);

workboxSW.precache([
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "1fec4c1ecc4cede35119029f41b7438e"
  },
  {
    "url": "manifest.json",
    "revision": "e9a1f6796064e3559928a475ab33b9fc"
  },
  {
    "url": "offline.html",
    "revision": "63ddcba3f97402bc6c2779f50030c98d"
  },
  {
    "url": "old-service-worker.js",
    "revision": "66e241fe06a1a5a9349e7f010dc516d8"
  },
  {
    "url": "service-worker-base.js",
    "revision": "f4372a337b06be23e8d11876eabf2a8c"
  },
  {
    "url": "src/css/app.css",
    "revision": "de072d5b8066a651ca6d944f96f688f9"
  },
  {
    "url": "src/css/feed.css",
    "revision": "3e26a8e153f84e9a95d4612f86eb5c40"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "0ce4c5c3026cd5a510382851d3d3267e"
  },
  {
    "url": "src/js/background-sync.js",
    "revision": "183df3e19992e68aa7a48e6949f40bda"
  },
  {
    "url": "src/js/feed.js",
    "revision": "211ab9c432e26e662028be6fde5b3031"
  },
  {
    "url": "src/js/indexed-db.js",
    "revision": "19299dea8def35f2283d909b57a262bf"
  },
  {
    "url": "src/js/libs/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "f90ad16048c0edaf185e4217092f1d81"
  },
  {
    "url": "src/js/notification.js",
    "revision": "548cd11481bed5d712ccee1d591d987e"
  },
  {
    "url": "src/js/polyfills/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/polyfills/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/sample-code/fetch-api.js",
    "revision": "07eb590fe51a0e70c61796682367f94b"
  },
  {
    "url": "src/js/sample-code/promises.js",
    "revision": "b0522611a8b2737824efc84be74035fe"
  },
  {
    "url": "workbox-service-worker.js",
    "revision": "cb0af13c7f332019954fa45930298ea5"
  },
  {
    "url": "workbox-sw.prod.v2.1.2.js",
    "revision": "685d1ceb6b9a9f94aacf71d6aeef8b51"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);

/**
 * Next not related to caching code:
 */
const newPostUrl = 'https://us-central1-for-pwa-sample.cloudfunctions.net/newPost';
const NEW_POSTS = 'sync-new-posts';

self.addEventListener('sync', event => {
  console.log('Background sync event triggered - tag:', event.tag);
  switch (event.tag) {
    case NEW_POSTS:
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
