'use strict'
require('dotenv').config()
const express = require('express'),
  // myDB = require('./connection'),
  fccTesting = require('./freeCodeCamp/fcctesting.js'),
  session = require('express-session'),
  passport = require('passport'),
  mDB = require('mongodb')

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

const ObjectID = mDB.ObjectID
passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => done(null, null))

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

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Listening on port ' + PORT))
