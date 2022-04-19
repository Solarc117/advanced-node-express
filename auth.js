'use strict'
const passport = require('passport'),
  ObjectID = require('mongodb').ObjectID,
  bcrypt = require('bcrypt'),
  LocalStrategy = require('passport-local'),
  GitHubStrategy = require('passport-github').Strategy

module.exports = function (app, myDataBase) {
  // @ts-ignore
  passport.serializeUser((user, done) => done(null, user._id))
  passport.deserializeUser((id, done) =>
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, user) =>
      err ? console.error(err) : done(null, user)
    )
  )

  passport.use(
    // @ts-ignore
    new LocalStrategy((usernameInput, passwordInput, done) =>
      myDataBase.findOne({ username: usernameInput }, (err, user) => {
        console.log(`User ${usernameInput} attempted to log in.`)

        const [loginMessage, doneParams] = err
          ? [[`Could not search db for user ${usernameInput}:`, err], [err]]
          : !user
          ? [
              [`Could not find a user with username ${usernameInput}`],
              [null, false],
            ]
          : !bcrypt.compareSync(passwordInput, user.password)
          ? [['Password is incorrect'], [null, false]]
          : [[`Successfully logged in ${usernameInput}`], [null, user]]

        console.log(...loginMessage)
        return done(...doneParams)
      })
    )
  )

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          'https://solarc117-fcc-adv-node-express.herokuapp.com/auth/github/callback',
      },
      (accessToken, refreshToken, profile, cb) => {
        const { id, displayName, photos, emails, provider } = profile
        console.log('accessToken:', accessToken)
        console.log('refreshToken:', refreshToken)
        console.log('profile:', profile)
        console.log('cb:', cb)

        myDataBase.findOneAndUpdate(
          { id: id },
          // 🤔 One thing that confuses me currently (though I won't edit it yet) is why the object in setOnInsert doesn't match the format of our local strat, which simply contains a username and a hashed passw. Seems like bad practice.
          {
            $setOnInsert: {
              id: id,
              name: displayName || 'John Doe',
              photo: photos[0].value || '',
              email: Array.isArray(emails)
                ? emails[0].value
                : 'No public email',
              created_on: new Date(),
              provider: provider || '',
            },
            $set: {
              last_login: new Date(),
            },
            $inc: {
              login_count: 1,
            },
          },
          { upsert: true, new: true },
          (err, user) => {
            console.log('err:', err)
            console.log('result:', user)

            return cb(null, user.value)
          }
        )
      }
    )
  )
}
