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
      data.forEach(doc => { // doc = a document reference
        screams.push(doc.data()) // data() is a function that returns the data within the document
      })
      return res.json(screams)
    })
    .catch(err => {
      console.log(err)
    })
})

exports.createScream = functions.https.onRequest((req, res) => {
  // validate request
  if(req.method !== 'POST'){
    return res.status(400).json({ error: 'Method not allowed, use a POST request' })
  }
  
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
  } 
  admin
    .firestore()
    .collection('screams')
    .add(newScream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully ` })
    })
    .catch(err => {
      res.status(500).json({ error: 'something went wrong '}) // note: changes status code from 200
      console.error(err)
    })
})