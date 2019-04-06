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
          createdAt: doc.data().createdAt
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
  if(req.body.body.trim() === '') return res.status(400).json({ error: 'Must not be empty' })
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
        return res.status(404).json({ error: 'Scream not found' })
      }
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