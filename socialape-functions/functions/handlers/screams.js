const { db } = require('../util/admin')


exports.getAllScreams = (req, res) => {
  db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let screams = []
      data.forEach(doc => { // doc = a document reference
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          userImage: doc.data().userImage
        }) // data() is a function that returns the data within the document
      })
      return res.json(screams)
    })
    .catch(err => {
      res.status(500).json({ error: 'something went wrong '}) // note: changes status code from 200
      console.error(err)
    })
}

exports.postOneScream = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ body: 'Body must not be empty' })
  }

  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(), // recognised time type
    userImage: req.user.imageUrl,
    likeCount: 0,
    commentCount: 0
  } 

  db
    .collection('screams')
    .add(newScream)
    .then((doc) => {
      const resScream = newScream
      resScream.screamId = doc.id
      res.json(resScream)
    })
    .catch(err => {
      res.status(500).json({ error: 'something went wrong '}) // note: changes status code from 200
      console.error(err)
    })
}

exports.getScream = (req, res) => {
  let screamData = {}
  db.doc(`/screams/${req.params.screamId}`).get() // returns doc
  .then(doc => {
    if(!doc.exists){
      return res.status(404).json({ error: 'Scream not found' })
    } 
    // returns scream 
    screamData = doc.data()
    screamData.screamId = doc.id
    
    return db.collection('comments')
             .orderBy('createdAt', 'desc')
             .where('screamId', '==', req.params.screamId)
             .get()
  })
  .then(data => {
    screamData.comments = []
    data.forEach(comment => {
      screamData.comments.push(comment.data())
    })
    return res.json(screamData)
  })
  .catch(err => {
    console.error(err)
    res.status(500).json({ error: err.code })
  })
}

exports.commentOnScream = (req, res) => {
  if(req.body.body.trim() === '') return res.status(400).json({ comment: 'Must not be empty' })
  // build comment
  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    screamId: req.params.screamId,
    userHandle: req.user.handle, // from middleware 
    userImage: req.user.imageUrl
  }
  // check scream exists
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then(doc => {
      if(!doc.exists){
        return res.status(404).json({ comment: 'Scream not found' })
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 })
    })
    .then(() => {
      return db.collection('comments').add(newComment)
    })
    .then(() => {
      //return comment to front end
      res.json(newComment)
    })
    .catch(err => {
      console.error(err)
      return res.status(500).json({ error: 'Something went wrong' })
    })
}

exports.likeScream = (req, res) => {
  // check to see if scream already liked & check if scream exists
  const likeDocument = db.collection('likes')
                        .where('userHandle', '==', req.user.handle)
                        .where('screamId', '==', req.params.screamId)
                        .limit(1) // will return arr with 1x doc
  const screamDocument = db.doc(`/screams/${req.params.screamId}`)

  let screamData

  screamDocument
    .get()
    .then(doc => {
      if(doc.exists){
        screamData = doc.data()
        screamData.screamId = doc.id
        return likeDocument.get()
      } else {
        return res.status(404).json({ error: 'Scream not found' })
      }
    })
    .then(data => {
      if(data.empty){
        return db.collection('likes').add({
          screamId: req.params.screamId,
          userHandle: req.user.handle
        })
        // cant do a return then handle the promise in the next .then() because if it's
        // not empty it may go through so we need to nest the then inside the if block
        .then(() => {
          screamData.likeCount++
          return screamDocument.update({ likeCount: screamData.likeCount })
        })
        .then(() => {
          return res.json(screamData) // success!
        })
      } else { // user has already liked this scream
        return res.status(400).json({ error: 'Scream already liked' })
      }
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({ error: err.code })
    })
}

exports.unlikeScream = (req, res) => {
  // check to see if scream already liked & check if scream exists
  const likeDocument = db.collection('likes')
                        .where('userHandle', '==', req.user.handle)
                        .where('screamId', '==', req.params.screamId)
                        .limit(1) // will return arr with 1x doc
  const screamDocument = db.doc(`/screams/${req.params.screamId}`)

  let screamData

  screamDocument
    .get()
    .then(doc => {
      if(doc.exists){
        screamData = doc.data()
        screamData.screamId = doc.id
        return likeDocument.get()
      } else {
        return res.status(404).json({ error: 'Scream not found' })
      }
    })
    .then(data => {
      if(data.empty){
        return res.status(400).json({ error: 'Scream not liked' })
      } else { 
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            screamData.likeCount--
            return screamDocument.update({ likeCount: screamData.likeCount })
          })
          .then(() => {
            res.json(screamData)
          })
      }
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({ error: err.code })
    })
}

exports.deleteScream = (req, res) => {
  const document = db.doc(`/screams/${req.params.screamId}`)
  document.get()
    .then(doc => {
      if(!doc.exists){
        return res.status(404).json({ error: 'Scream not found' })
      }
      if(doc.data().userHandle !== req.user.handle){
        return res.status(403).json({ error: 'Unauthorized' })
      } else {
        return document.delete()
      }
    })
    .then(() => {
      res.json({ message: 'Scream deleted successfully' })
    })
    .catch(err => {
      console.error(err)
      return res.status(500).json({ error: err.code })
    })
}