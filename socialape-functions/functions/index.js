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





// Helper Functions 

const isEmpty = (string) => {
  if (string.trim() === '') return true
  else return false 
}

const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  if(email.match(regEx)){
    return true
  } else {
    return false
  }
}


// MIDDLEWARE


const FBAuth = (req, res, next) => {
  let idToken 
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){ 
    idToken = req.headers.authorization
                .split('Bearer ')[1] // splits the auth header into an arr, 1st val = 'Bearer ' 2nd val = token
  } else {
    console.error('No token found')
    return res.status(403).json({ error: 'Unauthorized' })
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken
      console.log(decodedToken);
      return db.collection('users') // handle is not stored in fbauth so need to add manually 
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()
    })
    .then(data => {
      req.user.handle = data.docs[0] // even though we only request one object it's still returned in docs which is an arr
                            .data() // extracts the data from the function
                            .handle
      return next() // allows the request to proceed
    })
    .catch(err => {
      console.error('Error while verifying token', err)
      return res.status(403).json(err)
    })
}


// GET REQUESTS


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


// POST REQUESTS


// Post one scream
app.post('/scream', FBAuth, (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString() // recognised time type
  } 

  let token, userId // init token and userId

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

  // user validation

  let errors = {}

  if (isEmpty(newUser.email)) {
    errors.email = 'Must not be empty'
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email address'
  }

  if (isEmpty(newUser.password)) errors.password = 'Must not be empty'
  if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match'
  if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty'

  if(Object.keys(errors).length > 0) return res.status(400).json(errors)

  // User signup

  db
    .doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if(doc.exists){ // user handle is taken
        return res.status(400).json({ handle: 'This handle is already taken' })
      } else {
        // create user
        return firebase
                .auth()
                .createUserWithEmailAndPassword(newUser.email, newUser.password)
      }
    })
    .then(data => {
      // request token
      userId = data.user.uid
      return data.user.getIdToken()
    })
    .then(idToken => {
      token = idToken
      const userCredentials = {
        handle: newUser.handle,
        email:newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId
      }
      return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    })
    .then(() => {
      return res.status(201).json({ token })
    })
    .catch(err => {
      console.error(err)
      if(err.code === 'auth/email-already-in-use'){
        return res.status(400).json({ email: 'Email is already in use' })
      } else if(err.code === 'auth/weak-password'){
        return res.status(400).json({ password: 'Weak password please try again' })
      } else {
        return res.status(500).json({ error: err.code })
      }
    })
})

// User login

app.post('/login', (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  }

  // Validation

  let errors = {}

  if(isEmpty(user.email)) errors.email = 'Must not be empty'
  if(isEmpty(user.password)) errors.password = 'Must not be empty'

  if(Object.keys(errors).length > 0) return res.status(400).json(errors)

  // Login

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      // request user token
      return data.user.getIdToken()
    })
    .then(token => {
      // send it to the front
      return res.json({ token })
    })
    .catch(err => {
      console.error(err)
      if(err.code = "auth/wrong-password") {
        return res.status(403).json({ general: 'Wrong credentials, please try again' })
      }
      return res.status(500).json({ error: err.code })
    })
})

exports.api = functions.https.onRequest(app) 
// exports.api = functions.region('europe-west1').https.onRequest(app)

