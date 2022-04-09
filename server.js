'use strict'
require('dotenv').config()
const express = require('express'),
  myDB = require('./connection'),
  fccTesting = require('./freeCodeCamp/fcctesting.js'),
  session = require('express-session'),
  passport = require('passport'),
  ObjectID = require('mongodb').ObjectID,
  LocalStrategy = require('passport-local')

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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) next()
  else res.redirect('/')
}

myDB(async client => {
  const myDataBase = await client.db('database').collection('users')

  app.get('/', (req, res) =>
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
    })
  )

  app.post(
    '/login',
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/profile')
    }
  )

  // @ts-ignore
  app.get('/profile', ensureAuthenticated, (req, res) =>
    res.render('pug/profile', { username: req.user.username })
  )

  // @ts-ignore
  passport.serializeUser((user, done) => done(null, user._id))
  passport.deserializeUser((id, done) =>
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => done(null, doc))
  )
  passport.use(
    // @ts-ignore
    new LocalStrategy((username, password, done) =>
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log(`User ${username} attempted to log in.`)

        return err
          ? done(err)
          : !user || password !== user.password
          ? done(null, false)
          : done(null, user)
      })
    )
  )
}).catch(err => {
  app.get('/', (req, res) =>
    res.render('pug', { title: err, message: 'Unable to login' })
  )
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Listening on port ' + PORT))
