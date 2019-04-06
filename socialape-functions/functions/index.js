const functions = require('firebase-functions');
const app = require('express')()
const FBAuth = require('./util/fbAuth')

const { db } = require('./util/admin')

const { 
  getAllScreams, 
  postOneScream, 
  getScream, 
  commentOnScream, 
  likeScream, 
  unlikeScream,
  deleteScream
} = require('./handlers/screams')

const { 
  signup, 
  login, 
  uploadImage, 
  addUserDetails, 
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
 } = require('./handlers/users')

// Scream routes
app.get('/screams', getAllScreams)
app.get('/scream/:screamId', getScream)
app.post('/scream', FBAuth, postOneScream)
app.post('/scream/:screamId/comment', FBAuth, commentOnScream)
app.get('/scream/:screamId/like', FBAuth, likeScream)
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream)
app.delete('/scream/:screamId', FBAuth, deleteScream)


// User routes
app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)
app.get('/user/:handle', getUserDetails)
app.post('/notifications', FBAuth, markNotificationsRead)


exports.api = functions.region('us-central1').https.onRequest(app) 
// exports.api = functions.region('europe-west1').https.onRequest(app)

exports.createNotificationOnLike = functions.region('us-central1').firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
    .then(doc => {
      if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
    .catch(err => {
      console.error(err)
    })
  })

exports.deleteNotificationOnUnlike = functions.region('us-central1').firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err)
        return
      })
  })

exports.createNotificationOnComment = functions.region('us-central1').firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
    .then(doc => {
      if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
    .catch(err => {
      console.error(err)
      return // no need to return as function is a database trigger
    })
  })

exports.onUserImageChange = functions.region('us-central1').firestore.document('/users/${userId}')
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    // changing multiple docs so need to use batch
    if(change.before.data().imageUrl !== change.after.data().imageUrl){
    console.log('image has changed');
    let batch = db.batch()
    return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
      .then((data) => {
        data.forEach((doc) => { // doc refers to each document the user has created
          const scream = db.doc(`/screams/${doc.id}`)
          batch.update(scream, { userImage: change.after.data().imageUrl })
        })
        return batch.commit()
      })
    }
  })

exports.onScreamDelete = functions.region('us-central1').firestore.document('/screams/${screamId}')
  .onDelete((snapshot, context) => { // contest has the params that we have in the url
    const screamId = context.params.screamId
    let batch = db.batch()
    return db.collection('comments').where('screamId', '==', screamId).get() // find comments
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/comments/${doc.id}`)) // delete comments
        })
        return db.collection('likes').where('screamId', '==', screamId) // find likes
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/likes/${doc.id}`)) // delete likes
        })
        return db.collection('notifications').where('screamId', '==', screamId) //etc etc
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/notifications/${doc.id}`))
        })
        return batch.commit()
      })
      .catch(err => {
        console.error(err)
      })
  })