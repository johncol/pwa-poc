let shareImageButton = document.querySelector('#share-image-button');
let createPostArea = document.querySelector('#create-post');
let closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
let sharedMomentsArea = document.querySelector('#shared-moments');
let form = document.querySelector('form');
let titleInput = document.querySelector('#title');
let locationInput = document.querySelector('#location');
let snackbarContainer = document.querySelector('#confirmation-toast');

let player = document.querySelector('#player');
let canvas = document.querySelector('#canvas');
let captureBtn = document.querySelector('#capture-btn');
let pickImageArea = document.querySelector('#pick-image');
let imagePicker = document.querySelector('#image-picker');

let prepareNavigatorMediaFallback = () => {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }
  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = constraints => {
      let userMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  
      if (!userMedia) {
        return Promise.reject(new Error('UserMedia could not be provided'));
      }
  
      return new Promise((resolve, reject) => {
        getUserMedia(navigator, constraints, resolve, reject);
      });
    };
  }
};

let initializeMedia = () => {
  prepareNavigatorMediaFallback();

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      player.srcObject = stream;
      player.style.display = 'block';
      captureBtn.style.display = 'block';
    })
    .catch(error => {
      console.warn('error: ', error);
      pickImageArea.style.display = 'block';
    });
};

let openPwaPrompt = function (installPwa) {
  installPwa.prompt();
  installPwa.userChoice.then(result => {
    console.log('PWA prompt result:', result);
    if (result.outcome === 'dismissed') {
      console.log('PWA installation cancelled..');
    } else {
      console.log('PWA installation accepted..');
    }
  });
};

let openCreatePostModal = function () {
  createPostArea.style.transform = 'translateY(0)';
  initializeMedia();
  if (deferredPwaPrompt) {
    openPwaPrompt(deferredPwaPrompt);
    deferredPwaPrompt = null;
  }
};

let closeCreatePostModal = () => {
  createPostArea.style.transform = 'translateY(100vh)';
  canvas.style.display = 'none';
  player.style.display = 'none';
  captureBtn.style.display = 'none';
  pickImageArea.style.display = 'none';
  if (player.srcObject) {
    player.srcObject.getVideoTracks().forEach(track => track.stop());
  }
};

let onSaveButtonClicked = event => console.log('clicked');

shareImageButton.addEventListener('click', openCreatePostModal);
closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

let clearCards = () => {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
};

let createCard = post => {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("' + post.image + '")';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = post.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = post.location;
  cardSupportingText.style.textAlign = 'center';
  var cardSaveButton = document.createElement('button');
  cardSaveButton.textContent = 'Save';
  cardSaveButton.addEventListener('click', onSaveButtonClicked);
  cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
};

let addCardsFromResponse = cards => {
  clearCards();
  for (let cardKey in cards) {
    createCard(cards[cardKey]);
  }
};

let fetchPosts = () => {
  let postsUrl = 'https://for-pwa-sample.firebaseio.com/posts.json';
  let networkDataReceived = false;
  
  getDataFromIndexedDB(DBStore.POSTS).then(data => {
    if (!networkDataReceived && data) {
      addCardsFromResponse(data);
    }
  });

  return fetch(postsUrl)
    .then(res => res.json())
    .then(data => {
      networkDataReceived = true;
      console.log('data from internet: ', data);
      return new Promise(resolve => resolve(addCardsFromResponse(data)));
    }).catch(error => console.log('An error occurred, maybe we are offline'));
};

let buildPostPayload = () => ({
  id: (new Date()).toISOString(),
  title: titleInput.value,
  location: locationInput.value,
  image: 'https://firebasestorage.googleapis.com/v0/b/for-pwa-sample.appspot.com/o/10-great-travel-gifts-under-35-1509554666.jpg?alt=media&token=09f85af5-c651-4d54-8020-d38006968f95'
});

let newPostUrl = 'https://us-central1-for-pwa-sample.cloudfunctions.net/newPost';

let sendNewPost = () => {
  fetch(newPostUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(buildPostPayload())
  }).then(() => fetchPosts().then(() => closeCreatePostModal()))
  .catch(error => console.warn(error));
};

form.addEventListener('submit', event => {
  event.preventDefault();
  if (titleInput.value && locationInput.value) {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(serviceWorker => {
        saveDataToIndexedDB(DBStore.SYNC_POSTS, buildPostPayload())
          .then(() => serviceWorker.sync.register(SyncTask.NEW_POSTS))
          .then(() => {
            fetchPosts().then(() => closeCreatePostModal());
          })
          .catch(error => console.warn(error));
      });
    } else {
      sendNewPost();
    }
  } else {
    alert('All fields required');
  }
});

fetchPosts();

// NOT DONE ANYMORE AS THIS DATA IS NOW TAKEN FROM INDEXED-DB
// caches.match(postsUrl)
//   .then(response => response ? response.json() : undefined)
//   .then(data => {
//     console.log('data from cache: ', data);
//     if (!networkDataReceived && data) {
//       addCardsFromResponse(data);
//     }
//   });

captureBtn.addEventListener('click', event => {
  canvas.style.display = 'block';
  player.style.display = 'none';
  captureBtn.style.display = 'none';
  let context = canvas.getContext('2d');
  context.drawImage(player, 0, 0, canvas.width, player.videoHeight / (player.videoWidth / canvas.width));
  player.srcObject.getVideoTracks().forEach(track => track.stop());
});
