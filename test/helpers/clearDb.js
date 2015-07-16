
/**
 * Module dependencies.
 */
var fs = require('fs');
var mongoose = require('mongoose');
var async = require('async');
var Sensor = mongoose.model('Sensor');
var Measurement = mongoose.model('Measurement');

exports.all = function(done) {
  async.parallel([
    function(cb){
      Sensor.collection.remove(cb)
    },
    function(cb){
      Measurement.collection.remove(cb)
    }
  ], done)
}
