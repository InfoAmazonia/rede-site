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
  isPrivate: {type: Boolean, default: true},
  image: {type: String},
	geometry: { type: {type: String}, coordinates: []},
  createdAt: {type: Date, default: Date.now},
  lastMeasurement: {type: Date}
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
        .sort('-lastMeasurement')
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

    try {
      var measurements = parser.parseBatch(batchString);

      async.map(measurements, function(measurement, doneEach){
        measurement = new Measurement(measurement);
        measurement.sensor = self;
        measurement.save(function(err){
          doneEach(err, measurement);
        });
      }, doneSaveMeasurementBatch);
    } catch (err) {
      doneSaveMeasurementBatch({messages: [err]});
    }
  },
  getScore: function(criteria, doneGetScore){
    var self = this;

    criteria['sensor'] = self;

    var result = {
      sensor: self,
      score: null,
      rating: 'Not defined',
      parameters: []
    };

    var totalWeight = 0;

    async.each(allParameters, function(p, doneEach){
      mongoose.model('Measurement')
        .findOne(_.extend(criteria,{ parameter: p._id }))
        .sort('-collectedAt')
        .exec(function(err, m){
          if (err) doneEach(err);

          if (m.wqi.score && p.qualityWeight) {
            if (!result.score) result.score = 0;
            result.score += m.wqi.score * p.qualityWeight;
            result.parameters.push(m.toJSON());

            // adds weight of this parameter
            totalWeight += p.qualityWeight;
          }
          doneEach();
        });
    }, function(err){

      if (result.score) {
        result.score = result.score / totalWeight;
        result.rating = mongoose.model('Measurement').getWqiRating(result.score);
      }
      return doneGetScore(err, result);
    });
  }
}

/*
 * Register model
 */
mongoose.model('Sensor', SensorSchema);
