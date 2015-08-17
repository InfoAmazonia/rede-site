/*
 * Module dependencies
 */
var _ = require('underscore');
var csv = require('csv');
var moment = require('moment');
var validator = require('validator');
var messaging = require('../../lib/helpers/messaging');
var mongoose = require('mongoose');
var Sensor = mongoose.model('Sensor');
var Measurement = mongoose.model('Measurement');

/*
 * Load middleware
 */
exports.load = function (req, res, next, id){
  Sensor.findById(id, function (err, sensor) {
    if (err) return res.sendStatus(500);
    else if (!sensor)
      return res.status(404).json(messaging.error('sensors.not_found'));
    else {
      req.sensor = sensor;
      next();
    }
  });
};

/*
 * Load by query string
 */
exports.loadByQueryString = function(req, res, next){
  exports.load(req, res, next, req.query['sensor_id']);
}

/*
 * Create new sensor
 */
exports.create = function(req, res, next) {
  var sensor = new Sensor(req.body);

  sensor.save(function(err) {
    if (err) res.status(400).json(messaging.mongooseErrors(err, 'sensors'));
    else res.status(201).json(sensor);
  });
}

/*
 * Update sensor
 */
exports.update = function(req, res, next) {
  var sensor = _.extend(req.sensor, req.body);

  sensor.save(function(err) {
    if (err) return res.status(400).json(messaging.mongooseErrors(err, 'sensors'));
    else res.status(200).json(sensor);
  });
}

/*
 * Remove
 */
exports.remove = function(req, res) {
  var sensor = req.sensor;

  sensor.remove(function(err) {
    if (err) return res.sendStatus(500);
    else res.sendStatus(200);
  });
}

exports.show = function(req, res) {
  return res.status(200).json(req.sensor);
}

exports.score = function(req, res) {
  req.sensor.getScore(function(err, score){
    if (err) res.sendStatus(500);
    res.status(200).json(score);
  });
}

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

  Sensor.list(options, function (err, sensors) {
    if (err)
      return res.status(500).json(messaging.error('internal_error'));

    /* Send response */
    Sensor.count().exec(function (err, count) {
      res.status(200).json({
        count: count,
        perPage: perPage,
        page: page + 1,
        sensors: sensors
      });
    });
  });
}

/*
 * Subscribe to sensor
 */
exports.subscribe = function(req, res, next) {
  var sensor = req.sensor;
  var user = req.account;

  user.subscribedToSensors.addToSet(sensor);

  user.save(function(err) {
    if (err) return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else res.status(200).json({sensor: sensor, user: user});
  });
}

/*
 * Unsubscribe to sensor
 */
exports.unsubscribe = function(req, res, next) {
  var sensor = req.sensor;
  var user = req.account;

  user.subscribedToSensors.pull(sensor);

  user.save(function(err) {
    if (err) return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else res.status(200).json({sensor: sensor, user: user});
  });
}

/*
 * Download sensor's measurements as csv
 */
exports.csv = function(req, res) {
  var sensor = req.sensor;
  var parameter = req.parameter;

  Measurement
    .find({sensor: sensor, parameter: parameter})
    .sort('collectedAt')
    .exec(function(err, measurements){
      if (err) return res.status(500).json(messaging.mongooseErrors(err, 'measurements'));

      var csvFile = 'timestamp,sensor_id,measurement_id,parameter_id,value\n';

      _.each(measurements, function(m){
        var timestamp = moment.utc(m.collectedAt).toISOString();
        csvFile += [timestamp, m.sensor.toHexString(), m._id.toHexString(), m.parameter, m.value].join(',') + '\n';
      });

      res.set('Content-Type', 'text/csv').send(csvFile);
  });

}
