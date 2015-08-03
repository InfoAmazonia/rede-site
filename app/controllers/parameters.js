var _ = require('underscore');
var moment = require('moment');
var messaging = require('../../lib/helpers/messaging');
var mongoose = require('mongoose');
var Sensor = mongoose.model('Sensor');

/*
 * Load data
 */
var env = process.env.NODE_ENV || 'development';
var config = require('../../config')[env];
var parameters = config.parameters;
var parameters_ids = Object.keys(parameters);

/*
 * Load
 */
exports.load = function load(req, res, next, id){
  if (!_.contains(parameters_ids, id))
    res.status(404).json(messaging.error('parameter_not_found'));
  else {
    req.parameter = parameters[id];
    next();
  }
}

/*
 * Load by query string, if defined
 */
exports.loadByQueryStringIfDefined = function(req, res, next){
  if (req.query['parameter_id']) exports.load(req, res, next, req.query['parameter_id']);
  else next();
}


exports.list = function (req, res, next){
  res.json(parameters);
}
