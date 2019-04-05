const admin = require('firebase-admin')

//init application
// reverts to default in .firebaserc as no app passed in to initializeApp()
admin.initializeApp()

const db = admin.firestore()

module.exports = { admin, db }