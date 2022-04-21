'use strict'

require('dotenv').config()

const express = require('express'),
  myDB = require('./connection'),
  fccTesting = require('./freeCodeCamp/fcctesting'),
  session = require('express-session'),
  passport = require('passport'),
  routes = require('./routes'),
  auth = require('./auth'),
  passportSocketIo = require('passport.socketio'),
  cookieParser = require('cookie-parser'),
  MongoStore = require('connect-mongo')(session),
  store = new MongoStore({ url: process.env.MONGO_URI })

const app = express()
app.set('view engine', 'pug')

const http = require('http').createServer(app),
  // @ts-ignore
  io = require('socket.io')(http),
  key = 'express.sid'

io.use(
  passportSocketIo.authorize({
    // @ts-ignore - might be incompatible though.
    cookieParser,
    key,
    secret: process.env.SESSION_SECRET,
    store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  })
)

fccTesting(app) // For FCC testing purposes.
app.use('/public', express.static(process.cwd() + '/public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    // @ts-ignore
    key,
    store,
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
)
app.use(passport.initialize())
app.use(passport.session())

myDB(async client => {
  let currentUsers = 0,
    emitUsers = () => io.emit('user count', currentUsers),
    myDataBase = await client.db('database').collection('users')

  routes(app, myDataBase)
  auth(app, myDataBase)

  io.on('connection', socket => {
    const { username } = socket.request.user

    log(`user ${username} connected`)
    currentUsers++
    emitUsers()

    socket.on('disconnect', () => {
      log('user disconnected')
      currentUsers--
      emitUsers()
    })
  })
}).catch(err =>
  app
    .route('/')
    .get((req, res) =>
      res.render('pug', { title: err, message: 'Unable to login' })
    )
)

function log() {
  console.log(...arguments)
}

function onAuthorizeSuccess(data, accept) {
  log('successful connection to socket.io')
  accept(null, true)
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message)

  log('failed connection to socket.io:', message)
  accept(null, false)
}

const PORT = process.env.PORT || 3000
http.listen(PORT, () => log('Listening on port ' + PORT))
