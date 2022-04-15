const passport = require('passport'),
  bcrypt = require('bcrypt')

module.exports = function (app, myDataBase) {
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) next()
    else res.redirect('/')
  }

  app.route('/').get((req, res) =>
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,
    })
  )

  app
    .route('/login')
    .post(
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res) => res.redirect('/profile')
    )

  app.route('/profile').get(ensureAuthenticated, (req, res) =>
    res.render(process.cwd() + 'views/pug/profile', {
      // @ts-ignore
      username: req.user.username,
    })
  )

  app.route('/logout').get((req, res) => {
    req.logout()
    res.redirect('/')
  })

  app.route('/register').post(
    (req, res, next) => {
      const { username, password } = req.body,
        hash = bcrypt.hashSync(password, 12)

      myDataBase.findOne({ username }, (err, existingUser) => {
        return err
          ? next(err)
          : existingUser
          ? res.redirect('/')
          : myDataBase.insertOne({ username, password: hash }, (err, newUser) =>
              // @ts-ignore
              err ? res.redirect('/') : next(null, newUser.ops[0])
            )
      })
    },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => res.redirect('/profile')
  )

  app.route('/auth/github').get(passport.authenticate('github'))

  app
    .route('/auth/github/callback')
    .get(
      passport.authenticate('github', { failureRedirect: '/' }, (req, res) =>
        res.redirect('/profile')
      )
    )
}
