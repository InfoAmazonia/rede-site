/*
 * Module dependencies
 */
var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var parser = require('../../lib/measurementParser')

/*
 * Schema
 */

var SensorSchema = new Schema({
  identifier: {type: String, required: 'missing_identifier'}, // phone or mac address
  name: {type: String, required: 'missing_name'},
  description: {type: String},
	geometry: { type: {type: String}, coordinates: []},
  createdAt: {type: Date, default: Date.now}
});

/*
 * Methods
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
  }
}

/*
 * Register model
 */
mongoose.model('Sensor', SensorSchema);
