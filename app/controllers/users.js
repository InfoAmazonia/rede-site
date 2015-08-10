/*
 * Module dependencies
 */

var _ = require('underscore');
var messaging = require('../../lib/helpers/messaging')
var validator = require('validator');
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
 * Show
 */
exports.show = function(req, res) {
  return res.status(200).json(req.user.privateInfo());
}

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
 * Remove
 */
exports.remove = function(req, res) {
  var user = req.user;

  user.remove(function(err) {
    if (err) return res.sendStatus(500);
    else res.sendStatus(200);
  });
}

/*
 * User list
 */
exports.list = function(req, res) {
  var page = req.query['page'];
  var perPage = req.query['perPage'];

  /* Validate query parameters */
  if (page) {
    if (!validator.isInt(page))
      return res.status(400).json(messaging.error('invalid_pagination'));
    else
      page = parseInt(page) - 1;
  } else page = 0;

  if (perPage){
    if (!validator.isInt(perPage))
      return res.status(400).json(messaging.error('invalid_pagination'));
    else
      perPage = parseInt(perPage);
  } else perPage = 20;

  /* Mongoose Options */
  var options = {
    perPage: perPage,
    page: page
  };

  User.list(options, function (err, users) {
    if (err)
      return res.status(500).json(messaging.error('internal_error'));

    /* Send response */
    User.count().exec(function (err, count) {
      res.status(200).json({
        count: count,
        perPage: perPage,
        page: page + 1,
        users: users
      });
    });
  });
}
