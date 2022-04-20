const passport = require('passport'),
  bcrypt = require('bcrypt')

function log() {
  console.log(...arguments)
}

module.exports = function (app, myDataBase) {
  app.route('/').get((req, res) =>
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,
    })
  )

  app.route('/login').post(
    passport.authenticate('local', {
      failureRedirect: '/',
      failureMessage: true,
    }),
    (req, res) => {
      log(`Redirecting ${req.user.username} to /profile...`)
      res.redirect('/profile')
    }
  )

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    const { username } = req.user

    res.render(process.cwd() + '/views/pug/profile', {
      username,
    })
  })

  app.route('/logout').get((req, res) => {
    const { username } = req.user
    log(`Logging out ${username}...`)

    req.logout()
    res.redirect('/')
  })

  app.route('/register').post(
    (req, res, next) => {
      const { username, password } = req.body,
        hash = bcrypt.hashSync(password, 12)
      log(`Attempting to register user ${username}...`)

      myDataBase.findOne({ username }, (err, existingUser) => {
        if (err) {
          console.error(
            'Could not query user during registration process: ',
            err
          )
          return next(err)
        }

        if (existingUser) {
          console.warn(
            `Could not register - a user with username ${username} already exists`
          )
          return res.redirect('/')
        }

        myDataBase.insertOne({ username, password: hash }, (err, newUser) => {
          if (err) {
            console.error(`Could not create new user ${username}: `, err)
            return res.redirect('/')
          }

          log(`Successfully registered new user ${username}`)
          next(null, newUser.ops[0])
        })
      })
    },
    passport.authenticate('local', {
      failureRedirect: '/',
      failureMessage: true,
    }),
    (req, res, next) => {
      const { username } = req.user

      log(`Successfully registered ${username} - redirecting to /profile...`)
      res.redirect('/profile')
    }
  )

  app.route('/auth/github').get(passport.authenticate('github'))

  app.route('/auth/github/callback').get(
    passport.authenticate('github', {
      failureRedirect: '/',
      failureMessage: true,
    }),
    (req, res) => res.redirect('/profile')
  )

  app.use((req, res, next) => res.status(404).type('text').send('Not Found'))
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) next()
  else res.redirect('/')
}
