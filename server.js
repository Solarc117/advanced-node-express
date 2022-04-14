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

  app.route('/').get((req, res) =>
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
    })
  )

  app.route('/logout').get((req, res) => {
    req.logout()
    res.redirect('/')
  })

  app
    .route('/login')
    .post(
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res) => res.redirect('/profile')
    )

  app.route('/register').post(
    (req, res, next) => {
      const { username, password } = req.body
      // The logic of the registration route should be as follows: Register the new user > Authenticate the new user > Redirect to /profile

      // The logic of step 1, registering the new user, should be as follows:
      // a) Query database with a findOne command:
      // i) if user is returned then it exists and redirect back to home
      // ii) if user is undefined and no error occurs then 'insertOne' into the database with the username and password, and, as long as no errors occur, call next to go to step 2, authenticating the new user, which we've already written the logic for in our POST /login route.
      myDataBase.findOne({ username }, (err, existingUser) => {
        return err
          ? next(err)
          : existingUser
          ? res.redirect('/')
          : myDataBase.insertOne({ username, password }, (err, newUser) =>
              // @ts-ignore
              err ? res.redirect('/') : next(null, newUser.ops[0])
            )
      })
    },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => res.redirect('/profile')
  )

  app.route('/profile').get(ensureAuthenticated, (req, res) =>
    // @ts-ignore
    res.render('pug/profile', { username: req.user.username })
  )

  app.use((req, res, next) => res.status(404).type('text').send('Not Found'))

  // @ts-ignore
  passport.serializeUser((user, done) => done(null, user._id))
  passport.deserializeUser((id, done) =>
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) =>
      err ? console.error(err) : done(null, doc)
    )
  )
  passport.use(
    // @ts-ignore
    new LocalStrategy((username, password, done) =>
      myDataBase.findOne({ username }, (err, user) => {
        console.log(`User ${username} attempted to log in.`)

        return err
          ? done(err)
          : !user || password !== user.password
          ? done(null, false)
          : done(null, user)
      })
    )
  )
}).catch(err =>
  app.get('/', (req, res) =>
    res.render('pug', { title: err, message: 'Unable to login' })
  )
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Listening on port ' + PORT))
