/*
 * Module dependencies
 */

var _ = require('underscore');
var messaging = require('../../lib/helpers/messaging')
var validator = require('validator');
var mongoose = require('mongoose');
var User = mongoose.model('User');


/*
 * Show
 */
exports.show = function(req, res) {
  return res.status(200).json(req.account);
}

/*
 * Update
 */
exports.update = function(req, res, next) {

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
