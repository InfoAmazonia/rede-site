var _ = require('underscore');
var moment = require('moment');
var validator = require('validator');
var messaging = require('../../lib/helpers/messaging');
var mongoose = require('mongoose');
var Measurement = mongoose.model('Measurement')
var Sensor = mongoose.model('Sensor')

/*
 * Load middleware
 */
exports.load = function (req, res, next, id){
  Measurement.findById(id, function (err, measurement) {
    if (err) return res.sendStatus(500);
    else if (!measurement)
      return res.status(404).json(messaging.error('measurements.not_found'));
    else {
      req.measurement = measurement;
      next();
    }
  });
};

/*
 * New measurements
 */
exports.new = function(req, res) {
  var body = req.body;

  var data = req.body.data;
  if (!data) return res.status(400).json({messages: ['missing data parameter']});

  var sensorIdentifier = req.body.sensorIdentifier;
  if (!sensorIdentifier) return res.status(400).json({messages: ['missing sensor identifier']});

  Sensor.findOne({identifier: sensorIdentifier}, function(err, sensor){
    if (err) return res.sendStatus(500);
    if (!sensor) return res.status(404).json({messages: ['sensor not found']});
    sensor.saveMeasurementBatch(body.data, function(err, measurements){
      if (err) return res.sendStatus(500);
      else res.status(200).json({measurements: measurements});
    });
  });
}

/*
 * List
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

  /* Filter criteria */
  options.criteria = {
    sensor: req.sensor._id
  }

  /* If filtering by parameter, do not include it in results */
  if (req.parameter) {
    options.criteria.parameter = req.parameter._id;
    options.select = '_id value collectedAt';
  } else
    options.select = '_id value collectedAt parameter';


  Measurement.list(options, function (err, measurements) {
    if (err)
      return res.status(500).json(messaging.error('internal_error'));

    /* Send response */
    Measurement.count(options.criteria).exec(function (err, count) {
      res.status(200).json({
        count: count,
        perPage: perPage,
        page: page + 1,
        sensor: req.sensor,
        parameter: req.parameter,
        measurements: measurements
      });
    });
  });
}

/*
 * Remove
 */
exports.remove = function(req, res) {
  var measurement = req.measurement;

  measurement.remove(function(err) {
    if (err) return res.sendStatus(500);
    else res.sendStatus(200);
  });
}
