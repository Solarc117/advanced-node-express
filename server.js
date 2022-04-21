'use strict'

require('dotenv').config()

const express = require('express'),
  myDB = require('./connection'),
  fccTesting = require('./freeCodeCamp/fcctesting'),
  session = require('express-session'),
  passport = require('passport'),
  routes = require('./routes'),
  auth = require('./auth')

const app = express()
app.set('view engine', 'pug')

const http = require('http').createServer(app),
  // @ts-ignore
  io = require('socket.io')(http)

function log() { console.log(...arguments) }

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

myDB(async client => {
  const myDataBase = await client.db('database').collection('users')

  routes(app, myDataBase)
  auth(app, myDataBase)

  let currentUsers = 0
  io.on('connection', socket => {
    currentUsers++
    io.emit('user count', currentUsers)
  })
}).catch(err =>
  app.get('/', (req, res) =>
    res.render('pug', { title: err, message: 'Unable to login' })
  )
)

const PORT = process.env.PORT || 3000
http.listen(PORT, () => log('Listening on port ' + PORT))
