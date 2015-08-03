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
 * Update user
 */
exports.update = function(req, res, next) {
  var user = _.extend(req.user, req.body);

  user.save(function(err) {
    if (err) return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else res.status(200).json(user);
  });
}
