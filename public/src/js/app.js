
/** Add polyfills */
if (!window.Promise) { window.Promise = Promise; }
if (!window.fetch) { window.fetch = fetch; }

if ('serviceWorker' in navigator) {
  /** Register sample service-worker.js */
  navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
  .then(() => console.log('Service worker registered'));
  
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