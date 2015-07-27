/*
 * Module dependencies
 */
var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var parser = require('../../lib/measurementParser')

/*
 * Config
 */
var env = process.env.NODE_ENV || 'development'
var config = require('../../config')[env];
var allParameters = config.parameters;

/*
 * Schema
 */

var SensorSchema = new Schema({
  identifier: {type: String, required: 'missing_identifier'}, // phone or mac address
  name: {type: String, required: 'missing_name'},
  description: {type: String},
  image: {type: String},
	geometry: { type: {type: String}, coordinates: []},
  createdAt: {type: Date, default: Date.now}
});

/**
 * Post middleware
 */
SensorSchema.pre('remove', function(next){
  var self = this;
  mongoose.model('Measurement').remove({sensor: self}, next);
});

/*
 * Statics
 */
SensorSchema.static({

  loadByPhoneNumber: function(phoneNumber, done){
    var self = this;

    self.findOne({phoneNumber: phoneNumber}, function(err, sensor){
      if (err) return done(err);

      if (sensor) return done(null, sensor);
      else {
        sensor = new self({phoneNumber: phoneNumber})
        sensor.save(function(err){
          done(err, sensor);
        });
      }
    })
  },

  list: function (options, cb) {
      var criteria = options.criteria || {}

      this.find(criteria)
        .sort('_id')
        .limit(options.perPage)
        .skip(options.perPage * options.page)
        .exec(cb);
    }
});

/*
 * Methods
 */
SensorSchema.methods = {
  saveMeasurementBatch: function(batchString, doneSaveMeasurementBatch){
    var self = this;
    var Measurement = mongoose.model('Measurement');

    var measurements = parser.parseBatch(batchString);

    async.map(measurements, function(measurement, doneEach){
      measurement = new Measurement(measurement);
      measurement.sensor = self;
      measurement.save(function(err){
        doneEach(err, measurement);
      });
    }, doneSaveMeasurementBatch);
  },
  getScore: function(doneGetScore){
    var self = this;

    async.map(allParameters, function(p, doneEach){
      mongoose.model('Measurement')
        .findOne({
          sensor: self,
          parameter: p._id
        })
        .sort('-collectedAt')
        .exec(function(err, m){
          doneEach(err,m._id);
        })
    }, function(err, parameters){
      if (err) return doneGetScore(err);

      var result = {
        sensor: self,
        score: Math.random() * 10,
        parameters: []
      };

      // fix async strange result
      _.each(Object.keys(parameters), function (k){
        result.parameters.push(parameters[k]);
      })

      doneGetScore(null, result);
    })
  }
}

/*
 * Register model
 */
mongoose.model('Sensor', SensorSchema);
