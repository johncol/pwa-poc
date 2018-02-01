
const NotificationAction = {
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
};

const vapidPublicKey = 'BFnEdVuyjr7xnrX9IhHwSz1N5hZ4vuQK_OUr8AK0EQJ5mMc36eQWFU8Z4YLJqC-AGkHoaHdNfxsFmYTB7NKJO5s';

const notificationOptions = {
  body: 'You successfully subscribed to our Notification service!',
  icon: '/src/images/icons/app-icon-96x96.png',
  image: '/src/images/sf-boat.jpg',
  dir: 'ltr',
  lang: 'en-US',
  vibrate: [100, 50, 200],
  badge: '/src/images/icons/app-icon-96x96.png',
  tag: 'confirm-notification',
  renotify: false,
  actions: [
    { action: NotificationAction.CONFIRM, title: 'Confirm', icon: '/src/images/icons/confirm.png' },
    { action: NotificationAction.CANCEL, title: 'Cancel', icon: '/src/images/icons/cancel.png' },
  ]
};

let urlBase64ToUint8Array = base64String => {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
