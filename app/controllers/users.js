/*
 * Module dependencies
 */

var _ = require('underscore');
var messaging = require('../../lib/helpers/messaging')
var mongoose = require('mongoose');
var User = mongoose.model('User');

/*
 * Load user
 */
exports.load = function (req, res, next, id){
  /* Try to load user */
  User.findById(id, function (err, user) {
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else if (!user)
      return res.status(404).json(messaging.error('errors.users.not_found'));
    else {
      req.user = user;
      next();
    }
  });
};

/*
 * Create new user.
 */
exports.new = function(req, res) {
  var user = new User(req.body);
  user.save(function(err){
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else {
      // user.sendEmailConfirmation();
      return res.status(201).json(user);
    }
  });
};


/*
 * Update a user
 */
exports.update = function(req, res, next) {
  var user = _.extend(req.user, req.body);

  user.save(function(err) {
    if (err) return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else res.status(200).json(user);
  });
}

/*
 * Update account
 */
exports.account = function(req, res, next) {

  /* do not allow role or email change for non-admins*/
  if (req.account.role != 'admin') {
    delete req.body.role;
    delete req.body.email;
  }

  /* require old password when changing password */
  var password = req.body.password;
  var oldPassword = req.body.oldPassword;
  if (password) {
    if (!oldPassword)
      return res.status(400).json(messaging.error('account.old_password_missing'));
    else if (!req.account.authenticate(oldPassword))
      return res.status(400).json(messaging.error('account.old_password_wrong'));
  }

  var user = _.extend(req.account, req.body);
  user.save(function(err) {
    if (err) return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else res.status(200).json(user);
  });
}
