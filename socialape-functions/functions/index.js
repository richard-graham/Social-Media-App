const functions = require('firebase-functions');
const admin = require('firebase-admin')
const app = require('express')()

//init application
// reverts to default in .firebaserc as no app passed in to initializeApp()
admin.initializeApp()

const config = {
  apiKey: "AIzaSyDy5aSBoHw-9d72gm7OLXXjuE0zH7eNyQ4",
  authDomain: "social-media-app-632e6.firebaseapp.com",
  databaseURL: "https://social-media-app-632e6.firebaseio.com",
  projectId: "social-media-app-632e6",
  storageBucket: "social-media-app-632e6.appspot.com",
  messagingSenderId: "754034985074"
};

const firebase = require('firebase')
firebase.initializeApp(config)

const db = admin.firestore()

// DB Requests

app.get('/screams', (req, res) => {
  db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      console.log(data);
      let screams = []
      data.forEach(doc => { // doc = a document reference
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        }) // data() is a function that returns the data within the document
      })
      return res.json(screams)
    })
    .catch(err => {
      res.status(500).json({ error: 'something went wrong '}) // note: changes status code from 200
      console.error(err)
    })
})


app.post('/scream', (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString() // recognised time type
  } 

  db
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

//Sign Up Route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }

  db
    .doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if(doc.exists){ // user handle is taken
        return res.status(400).json({ handle: 'This handle is already taken' })
      } else {
        console.log('ping');
        // create user
        return firebase
                .auth()
                .createUserWithEmailAndPassword(newUser.email, newUser.password)
      }
    })
    .then(data => {
      // request token
      return data.user.getIdToken()
    })
    .then(token => {
      // get token
      return res.status(201).json({ token })
    })
    .catch(err => {
      console.error(err)
      return res.status(500).json({ error: err.code })
    })
})



exports.api = functions.https.onRequest(app) 
// exports.api = functions.region('europe-west1').https.onRequest(app)