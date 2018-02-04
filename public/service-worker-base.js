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

workboxSW.precache([]);

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
