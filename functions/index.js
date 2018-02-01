const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webPush = require('web-push');

const serviceAccount = require('./for-pwa-sample-firebase-adminsdk.json');
admin.initializeApp({
  databaseURL: 'https://for-pwa-sample.firebaseio.com/',
  credential: admin.credential.cert(serviceAccount)
});

const vapid = {
  publicKey: 'BFnEdVuyjr7xnrX9IhHwSz1N5hZ4vuQK_OUr8AK0EQJ5mMc36eQWFU8Z4YLJqC-AGkHoaHdNfxsFmYTB7NKJO5s',
  privateKey: 'K_v5tuk4X1qOhYnvIO_RkRYtGB1MEZbc8WXKIIxMkfs'
};

exports.newPost = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    admin.database().ref('posts').push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      image: request.body.image
    })
    .then(() => {
      webPush.setVapidDetails('mailto:john.19col@gmail.com', vapid.publicKey, vapid.privateKey);
      return admin.database().ref('subscriptions').once('value');
    })
    .then(subscriptions => {
      subscriptions.forEach(subscription => {
        webPush.sendNotification(subscription, JSON.stringify({
          title: 'New Post',
          content: 'Just added new post titled "' + request.body.title + '"'
        }));
      });
      response.status(201).json({
        message: 'Cool, it works!',
        id: request.body.id
      });
    })
    .catch(error => {
      response.status(500).json({
        message: 'Shit, it did not work!',
        error: error
      });
    });
  });

});
