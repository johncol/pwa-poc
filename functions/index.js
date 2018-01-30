const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

const serviceAccount = require('./for-pwa-sample-firebase-adminsdk.json');
admin.initializeApp({
  databaseURL: 'https://for-pwa-sample.firebaseio.com/',
  credential: admin.credential.cert(serviceAccount)
});

exports.newPost = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    admin.database().ref('posts').push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      image: request.body.image
    }).then(() => {
      response.status(201)
        .json({
          message: 'Cool, it works!',
          id: request.body.id
        });
    }).catch(error => {
      response.status(500)
        .json({
          message: 'Shit, it did not work!',
          error: error
        });
    });
  });

});
