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
  identifier: {type: String},
  description: {type: String}
});

/*
 * Methos
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
  }
});

/*
 * Statics
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
