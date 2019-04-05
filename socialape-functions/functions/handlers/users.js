const { db } = require('../util/admin')

const config = require('../util/config')

const firebase = require('firebase')
firebase.initializeApp(config)

const { validateSignUpData, validateLoginData } = require('../util/validators')

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }

  const { valid, errors } = validateSignUpData(newUser)

  if (!valid) return res.status(400).json(errors)

  let token, userId
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
}



exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  }

  const { valid, errors } = validateLoginData(user)

  if (!valid) return res.status(400).json(errors)

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
}