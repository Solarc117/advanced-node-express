const passport = require('passport'),
  ObjectID = require('mongodb').ObjectID,
  bcrypt = require('bcrypt'),
  LocalStrategy = require('passport-local')

module.exports = function (app, myDataBase) {
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
          : !user || !bcrypt.compareSync(password, user.password)
          ? done(null, false)
          : done(null, user)
      })
    )
  )
}
