const functions = require('firebase-functions');
const admin = require('firebase-admin')

//init application
// reverts to default in .firebaserc as no app passed in to initializeApp()
admin.initializeApp()

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

exports.getScreams = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection('screams')
    .get()
    .then(data => {
      let screams = []
      data.forEach(doc => {
        screams.push(doc.data()) // data() is a function that returns the data within the document
      })
      return res.json(screams)
    })
    .catch(err => {
      console.log(err)
    })
})

