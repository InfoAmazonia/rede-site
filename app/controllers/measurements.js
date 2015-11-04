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
      if (err && err.messages)
        return res.status(400).json({messages: messaging.errorsArray(err.messages)});
      else if (err)
        return res.status(400).json(messaging.mongooseErrors(err, 'measurements'));
      else {
        sensor.lastMeasurement = measurements[0].collectedAt;
        sensor.save(function(err){
          if (err) return res.status(400).json(messaging.mongooseErrors(err, 'measurements'));
          else res.status(200).json({measurements: measurements});
        });
      }
    });
  });
}

/*
 * List
 */
exports.list = function(req, res) {
  var page = req.query['page'];
  var perPage = req.query['perPage'];
  var fromDate = req.query['fromDate'];
  var toDate = req.query['toDate'];

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

  if (fromDate) {
    if (!validator.isISO8601(fromDate))
      return res.status(400).json(messaging.error('invalid_from_date'));
    options.criteria['collectedAt'] = {$gte: fromDate};
  }

  if (toDate) {
    if (!validator.isISO8601(toDate))
      return res.status(400).json(messaging.error('invalid_to_date'));

    if (!options.criteria['collectedAt']) {
      options.criteria['collectedAt'] = {$lte: toDate};
    } else options.criteria['collectedAt']['$lte'] = toDate;
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
 * Group
 */
exports.group = function(req, res) {

  var sensor = req.sensor;
  var page = (req.query['page'] - 1) || 0 ;
  var perPage = req.query['perPage'] || 20;

  // Validate parameter
  if (!sensor) { return res.status(400).json(messaging.error('measurements.aggregate.missing_sensor')); }



  Measurement.aggregate([
     { $match: { sensor: req.sensor._id }},
     { $sort: {collectedAt: 1 } },
     { $group : { _id : "$collectedAt", measurements: { $push: "$$ROOT" } } },
     { $skip: perPage * page},
     { $limit: perPage}
   ], function (err, measurementGroups) {
     if (err) return res.status(500).json(messaging.error('internal_error'));

     var result = {
       sensor: sensor,
       measurementGroups: measurementGroups,
       page: page + 1,
       perPage: perPage
     }

     res.status(200).json(result);

   });
}

/*
 * Aggregate
 */
exports.aggregate = function(req, res) {

  var sensor = req.sensor;
  var parameter = req.parameter;
  var resolution = req.query['resolution'] || 'day';

  // Validate parameter
  if (!sensor) { return res.status(400).json(messaging.error('measurements.aggregate.missing_sensor')); }
  if (!parameter) { return res.status(400).json(messaging.error('measurements.aggregate.missing_parameter')); }

  // Validate start date timestamp
  var fromDate = req.query['fromDate'];
  if (!fromDate)
    fromDate = moment().subtract(10, 'day').format('YYYY-MM-DDTHH:mm:ss');
  else if (!validator.isISO8601(fromDate))
    return res.status(400).json(messaging.error('measurements.aggregate.invalid_timestamp'));

  // Validate end date timestamp
  var toDate = req.query['toDate'];
  if (!toDate)
    toDate = moment().format('YYYY-MM-DDTHH:mm:ss');
  else if (!validator.isISO8601(toDate))
    return res.status(400).json(messaging.error('measurements.aggregate.invalid_timestamp'));

  // Generate date objects
  fromDate = moment.utc(fromDate).toDate();
  toDate = moment.utc(toDate).toDate();

  // Aggregation criteria
  var match = {
    $match: {
      sensor: req.sensor._id,
      parameter: req.parameter._id,
      collectedAt: {
        $gte: fromDate,
        $lte: toDate
      }
    }
  }

  var group = {
    $group: {
      _id : {
        year: { $year: "$collectedAt" }
      },
      max: { $max: "$value" },
      avg: { $avg: "$value" },
      min: { $min: "$value" }
    }
  }

  if (resolution == 'hour') {
    group['$group']['_id']['month'] = { $month: "$collectedAt" }
    group['$group']['_id']['day'] = { $dayOfMonth: "$collectedAt" }
    group['$group']['_id']['hour'] = { $hour: "$collectedAt" }
  } else if (resolution == 'day') {
    group['$group']['_id']['month'] = { $month: "$collectedAt" }
    group['$group']['_id']['day'] = { $dayOfMonth: "$collectedAt" }
  } else if (resolution == 'week') {
    group['$group']['_id']['week'] = { $week: "$collectedAt" }
  } else if (resolution = 'month') {
    group['$group']['_id']['month'] = { $month: "$collectedAt" }
  } else {
    return res.status(400).json(messaging.error('measurements.aggregate.wrong_resolution'));
  }

  Measurement.aggregate([match, group], function (err, aggregates) {
    if (err) return res.status(500).json(messaging.error('internal_error'));

    Measurement.count(match['$match'], function(err, count){
      if (err) return res.status(500).json(messaging.error('internal_error'));

      res.status(200).json({
        sensor_id: sensor._id.toHexString(),
        parameter_id: parameter._id,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        resolution: resolution,
        count: count,
        aggregates: aggregates
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
