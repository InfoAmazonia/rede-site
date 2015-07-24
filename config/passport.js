/*
 * Module dependencies
 */
var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var User = mongoose.model('User');
var AccessToken = mongoose.model('Token');


module.exports = function (passport, config) {
  // serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id)
  })

  passport.deserializeUser(function(id, done) {
    User.load({ criteria: { _id: id } }, function (err, user) {
      done(err, user)
    })
  })

  // use these strategies
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      User.findOne({email: email}, function (err, user) {
        if (err) return done(err)

        if (!user)
          return done(null, false, { message: 'Unknown user' });

        if (!user.authenticate(password))
          return done(null, false, { message: 'Invalid password' });

        return done(null, user);
      });
    })
  );

  passport.use(new BearerStrategy({}, function(token, done) {
		AccessToken.load({'_id': token}, function(err, token) {
			if(err)
				return done(err);

			if(!token || !token.user)
				return done(null, false);

			return done(null, token.user);
		});
	}));
}
