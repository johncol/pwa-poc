
/** Add polyfills */
if (!window.Promise) { window.Promise = Promise; }
if (!window.fetch) { window.fetch = fetch; }

/** Register sample service-worker.js */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
    .then(() => console.log('Service worker registered'));
}

let deferredPwaPrompt;

window.addEventListener('beforeinstallprompt', event => {
  console.log('beforeinstallprompt event fired');
  event.preventDefault();
  deferredPwaPrompt = event;
  return false;
});
