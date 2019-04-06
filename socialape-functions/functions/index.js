const functions = require('firebase-functions');
const app = require('express')()
const FBAuth = require('./util/fbAuth')

const db = require('./util/admin')

const { 
  getAllScreams, 
  postOneScream, 
  getScream, 
  commentOnScream, 
  likeScream, 
  unlikeScream,
  deleteScream
} = require('./handlers/screams')
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users')

// Scream routes
app.get('/screams', getAllScreams)
app.get('/scream/:screamId', getScream)
app.post('/scream', FBAuth, postOneScream)
app.post('/scream/:screamId/comment', FBAuth, commentOnScream)
app.get('/scream/:screamId/like', FBAuth, likeScream)
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream)
app.delete('/scream/:screamId', FBAuth, deleteScream)
// TODO
// deletescream
// likescream
// unlikeScream
// commentOnScream

// User routes
app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)

// Helper Functions 


exports.api = functions.https.onRequest(app) 
// exports.api = functions.region('europe-west1').https.onRequest(app)

exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    db.document(`/screams/${snapshot.data().screamId}`).get()
    .then(doc => {
      if(doc.exists){
        return db.doc(`/notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient: doc.data().userHandle,
          sender: snapshot.data().userHandle,
          type: 'like',
          read: false,
          screamId: doc.id
        })
      }
    })
    .then(() => {
      return 
    })
    .catch(err => {
      console.error(err)
      return // no need to return as function is a database trigger
    })
  })

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {
        return 
      })
      .catch(err => {
        console.error(err)
        return
      })
  })

exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    db.document(`/screams/${snapshot.data().screamId}`).get()
    .then(doc => {
      if(doc.exists){
        return db.doc(`/notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient: doc.data().userHandle,
          sender: snapshot.data().userHandle,
          type: 'comment',
          read: false,
          screamId: doc.id
        })
      }
    })
    .then(() => {
      return 
    })
    .catch(err => {
      console.error(err)
      return // no need to return as function is a database trigger
    })
  })
