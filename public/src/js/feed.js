let shareImageButton = document.querySelector('#share-image-button');
let createPostArea = document.querySelector('#create-post');
let closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
let sharedMomentsArea = document.querySelector('#shared-moments');

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
  if (deferredPwaPrompt) {
    openPwaPrompt(deferredPwaPrompt);
    deferredPwaPrompt = null;
  }
};

let closeCreatePostModal = () => createPostArea.style.transform = 'translateY(100vh)';

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

let postsUrl = 'https://for-pwa-sample.firebaseio.com/posts.json';
let networkDataReceived = false;

fetch(postsUrl)
  .then(res => res.json())
  .then(data => {
    networkDataReceived = true;
    console.log('data from internet: ', data);
    addCardsFromResponse(data);
  });

getDataFromIndexedDB(DBStore.POSTS).then(data => {
  if (!networkDataReceived && data) {
    addCardsFromResponse(data);
  }
});

// NOT DONE ANYMORE AS THIS DATA IS NOW TAKEN FROM INDEXED-DB
// caches.match(postsUrl)
//   .then(response => response ? response.json() : undefined)
//   .then(data => {
//     console.log('data from cache: ', data);
//     if (!networkDataReceived && data) {
//       addCardsFromResponse(data);
//     }
//   });
