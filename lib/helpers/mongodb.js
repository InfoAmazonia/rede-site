/**
 * Module dependencies
 **/
var async = require('async');
var mongoose = require('mongoose');
var Sensor = mongoose.model('Sensor');
var Measurement = mongoose.model('Measurement');
var User = mongoose.model('User');

/**
 * Wait mongoose to be ready
 **/
exports.whenReady = function(done){
	if (mongoose.connection.readyState != 1)
		mongoose.connection.on('open', done);
	else
		done();
}


exports.clearDb = function(done) {
  async.parallel([
    function(cb){
      User.collection.remove(cb)
    },
    function(cb){
      Sensor.collection.remove(cb)
    },
    function(cb){
      Measurement.collection.remove(cb)
    }
  ], done)
}
