var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');

function openPwaPrompt(installPwa) {
  installPwa.prompt();
  installPwa.userChoice.then(result => {
    console.log('PWA prompt result:', result);
    if (result.outcome === 'dismissed') {
      console.log('PWA installation cancelled..');
    } else {
      console.log('PWA installation accepted..');
    }
  });
}

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  if (deferredPwaPrompt) {
    openPwaPrompt(deferredPwaPrompt);
    deferredPwaPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);
