const { admin, db } = require('../util/admin')

const config = require('../util/config')

const firebase = require('firebase')
firebase.initializeApp(config)

const { validateSignUpData, validateLoginData, reduceUserDetails } = require('../util/validators')


// SIGN UP

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }

  const { valid, errors } = validateSignUpData(newUser)

  if (!valid) return res.status(400).json(errors)

  const noImg = 'no-img.png'

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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

// LOGIN

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

// ADD USER

exports.addUserDetails = (req,res) => {
  let userDetails = reduceUserDetails(req.body)

  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ messgae: 'Details added successfully'} )
    })
    .catch(err => {
      console.error(err)
      return res.status(500).json({ error: err.code })
    })
}

// GET OWN USER DETAILS

exports.getAuthenticatedUser = (req, res) => {
  let userData = {}
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then(doc => {
      if (doc.exists){
        userData.credentials = doc.data()
        return db.collection('likes').where('userHandle', '==', req.user.handle).get()
      }
    })
    .then(data => {
      userData.likes = []
      data.forEach(doc => {
        userData.likes.push(doc.data())
      })
      return db.collection('notifications')
               .where('recipient', '==', req.user.handle)
               .orderBy('createdAt', 'desc')
               .limit(10)
               .get()
    })
    .then(data => {
      userData.notifications = []
      data.forEach(doc => {
        userData.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          screamId: doc.data().recipient,
          type: doc.data().type,
          read: doc.data().read,
          notificationId: doc.id
        })
      })
      return res.json(userData)
    })
    .catch(err => {
      console.error(err)
      return res.status(500).json({ error: err.code })
    })
}

// GET ANY USERS DETAILS

exports.getUserDetails = (req, res) => {
  let userData = {}
  db.doc(`/users/${req.params.handle}`)
    .get()
    .then(doc => {
      if(doc.exists){
        userData.user = doc.data()
        return db.collection('screams').where('userHandle', '==', req.params.handle).orderBy('createdAt', 'desc').get()
      } else {
        return res.status(404).json({ error: 'User not found' })
      }
    })
    .then((data) => {
      userData.screams = []
      data.forEach(scream => {
        userData.screams.push({
          body: scream.data().body,
          createdAt: scream.data().createdAt,
          userHandle: scream.data().userHandle,
          userImage: scream.data().userImage,
          likeCount: scream.data().likeCount,
          commentCount: scream.data().body,
          screamId: scream.id
        })
      })
      return res.json(userData)
    })
    .catch(err => {
      console.error(err)
      return res.status(500).json({ error: err.code })
    })
}

// UPLOAD IMAGE

exports.uploadImage = (req, res) => {
  const BusBoy = require('busBoy')
  const path = require('path') // default package
  const os = require('os')
  const fs = require('fs')

  let imageFileName
  let imageToBeUploaded = {} 

  const busboy = new BusBoy({ headers: req.headers })

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

    // console.log('fieldname', fieldname)  image
    // console.log('filename', filename)    user-image.png   
    // console.log('mimetype', mimetype)    image/png

    // validation

    if(mimetype !== 'image/jpeg' && mimetype !== 'image/png'){
      return res.status(400).json({ error: 'Wrong file type submitted' })
    }

    // img.png or my.img.png -> split string by dots -> select last value
    const imageExtension = filename.split('.')[filename.split('.').length -1]
    // 783645987326.png
    imageFileName = `${Math.round(Math.random()*1000000000)}.${imageExtension}`
    const filepath = path.join(os.tmpdir(), imageFileName)
    imageToBeUploaded = { filepath, mimetype}
    file.pipe(fs.createWriteStream(filepath))
  })
  busboy.on('finish', () => {
    admin.storage().bucket().upload(imageToBeUploaded.filepath, {
      resumable: false,
      metadata: {
        metadata: {
          contentType: imageToBeUploaded.mimetype
        }
      }
    })
    .then(() => {
      // next construct the image url to add it to the user
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
      return db.doc(`/users/${req.user.handle}`).update({ imageUrl: imageUrl }) // Note: req.user comes from the FBAuth middleware in index.js
    })
    .then(() => {
      return res.json({ message: 'Image uploaded successfully' })
    })
    .catch(err => {
      console.error(err)
      return res.status(500).json({ error: err.code })
    })
  })
  busboy.end(req.rawBody)
}

// MARK NOTIFICATIONS AS READ

exports.markNotificationsRead = (req, res) => {
  // when user opens notification dropdown send server arr of id's  -> notifications just seen
  // and mark as read
  let batch = db.batch() // batch allows you to update multiple documents
  req.body.forEach(notificationId => {
    const notification = db.doc(`/notifications/${notificationId}`)
    batch.update(notification, { read: true })
  })
  batch.commit()
  .then(() => {
    res.json({ message: 'Notifications marked as read' })
  })
  .catch(err => {
    console.error(err)
    return res.status(500).json({ error: err.code })
  })
}