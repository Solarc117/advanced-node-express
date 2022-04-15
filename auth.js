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
    new LocalStrategy((username, password, done) =>
      myDataBase.findOne({ username }, (err, user) => {
        console.log(`User ${username} attempted to log in.`)

        return err
          ? done(err)
          : !user || !bcrypt.compareSync(password, user.password)
          ? done(null, false)
          : done(null, user)
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
        console.log(profile)

        myDataBase.findOneAndUpdate(
          { id: profile.id },
          {},
          {
            $setOnInsert: {
              id: profile.id,
              name: profile.displayName || 'John Doe',
              photo: profile.photos[0].value || '',
              email: Array.isArray(profile.emails)
                ? profile.emails[0].value
                : 'No public email',
              created_on: new Date(),
              provider: profile.provider || '',
            },
            $set: {
              last_login: new Date(),
            },
            $inc: {
              login_count: 1,
            },
          },
          { upsert: true, new: true },
          (err, user) => cb(null, user.value)
        )
      }
    )
  )
}
