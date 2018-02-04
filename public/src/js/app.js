
/** Add polyfills */
if (!window.Promise) { window.Promise = Promise; }
if (!window.fetch) { window.fetch = fetch; }

if ('serviceWorker' in navigator) {
  /** Register sample service-worker.js */
  navigator.serviceWorker.register('/workbox-service-worker.js', { scope: '/' })
    .then(() => console.log('Workbox service worker registered'));
  
  /** Unregister service workers on click */
  document.querySelectorAll('.delete-service-worker')
    .forEach(button => button.addEventListener('click', event => {
      navigator.serviceWorker.getRegistrations()
        .then(registrations => registrations.forEach(registration => registration.unregister()));
  }));
}

let deferredPwaPrompt;

window.addEventListener('beforeinstallprompt', event => {
  console.log('beforeinstallprompt event fired');
  event.preventDefault();
  deferredPwaPrompt = event;
  return false;
});

let displayConfirmNotification = () => {
  navigator.serviceWorker.ready.then(serviceWorker => {
    serviceWorker.showNotification('Successfully subscribed!', notificationOptions);
  });
};

let configurePushSubscription = () => {
  let serviceWorker;
  navigator.serviceWorker.ready
    .then(sw => {
      serviceWorker = sw;
      return sw.pushManager.getSubscription();
    })
    .then(subscription => {
      if (subscription === null || subscription === undefined) {
        console.log('no subscription available, creating one..');
        return serviceWorker.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }
      return new Promise(resolve => resolve(subscription));
    })
    .then(subscription => {
      console.log('subscription created: ', subscription);
      let subscriptionsUrl = 'https://for-pwa-sample.firebaseio.com/subscriptions.json';
      return fetch(subscriptionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
    })
    .then(response => {
      if (response.ok) {
        displayConfirmNotification();
      }
    })
    .catch(error => console.warn(error));
};

if ('Notification' in window) {
  document.querySelectorAll('.enable-notifications')
    .forEach(element => {
      element.addEventListener('click', event => {
        Notification.requestPermission(result => {
          console.log('user allowed notifications result: ', result);
          if (result === 'granted') {
            configurePushSubscription();
          }
        });
      });
    });
}
