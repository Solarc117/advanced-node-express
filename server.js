'use strict'
require('dotenv').config()
const express = require('express'),
  myDB = require('./connection'),
  fccTesting = require('./freeCodeCamp/fcctesting.js'),
  session = require('express-session'),
  passport = require('passport'),
  ObjectID = require('mongodb').ObjectID

const app = express()
app.set('view engine', 'pug')

fccTesting(app) // For FCC testing purposes.
app.use('/public', express.static(process.cwd() + '/public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
)
app.use(passport.initialize())
app.use(passport.session())

app.route('/').get((req, res) => {
  // res.render('pug/index.pug') // ✅
  // res.render('./pug/index.pug') // ✅
  // res.render('pug/index.pug') // ✅
  // res.render('./pug/index') // ✅
  // res.render('/pug/index') // ❌
  // res.render('pug/index') // ✅
  // res.render('./pug/') // ✅
  // res.render('/pug/') // ❌
  // res.render('pug/') // ✅
  res.render('pug', {
    title: 'Hello',
    message: 'Please login',
  }) // ✅
})

myDB(async client => {
  const dataBase = await client.db('database').collection('users')

  // Be sure to change the title.
  app.route('/').get((req, res) => {
    // Change the response to render the Pug template.
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
    })
  })

  passport.serializeUser((user, done) => done(null, user._id))
  passport.deserializeUser((id, done) =>
    dataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => done(null, doc))
  )
}).catch(err => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: err, message: 'Unable to login' })
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Listening on port ' + PORT))
