/**
 * Module dependencies.
 **/
var async = require('async');
var moment = require('moment');
var rosie = require('rosie').Factory;
var mongoose = require('mongoose');
var Sensor = mongoose.model('Sensor');
var Measurement = mongoose.model('Measurement');
var User = mongoose.model('User');

/*
 * Load config
 */
var env = process.env.NODE_ENV || 'development'
var config = require('../../config')[env]
var parameters = config.parameters;

/**
 * USERS
 **/

rosie.define('User')
	.sequence('name', function(i) { return 'user' + i })
	.sequence('email', function(i) { return 'email' + i + '@example.com' })
	.attr('password', '123456')

exports.createUser = function(done){
	var user = new User(rosie.build('User'));
	user.save(function(err){
		done(err, user);
	})
}

exports.createAdmin = function(done){
	var user = new User(rosie.build('User'));
	user.role = 'admin';
	user.save(function(err){
		done(err, user);
	})
}

exports.createUsers = function(n, doneCreateUsers){
	var self = this;
	async.timesSeries(n, function(n,doneEach){
		self.createUser(doneEach)
	}, doneCreateUsers);
}

/**
 * Sensor factory
 **/
rosie.define('Sensor')
	.sequence('identifier', function(i) { return '+55119999999'+ i })
	.sequence('name', function(i) { return 'Sensor '+ i })
	.sequence('description', function(i) { return 'some description for Sensor ' + i })
	.attr('image', function(i) { return 'http://imguol.com/blogs/122/files/2015/07/Prototipo-foto-Miguel-PeixeDSCF1515.jpg' })
	.attr('geometry', function(){
		var lat = -90 + Math.random() * 180;
		var lon = -180 + Math.random() * 360;
		return {
			type: 'Point',
			coordinates: [lon,lat]
		}
	});

exports.createSensor = function(doneCreateSensor){
	var sensor = new Sensor(rosie.build('Sensor'));
	sensor.save(function(err){
		doneCreateSensor(err, sensor);
	})
}

exports.createSensors = function(n, doneCreateSensors){
	var self = this;
	async.timesSeries(n, function(i, doneEach){
    self.createSensor(doneEach);
  }, doneCreateSensors);
}


exports.createSensorsWithMeasurements = function(n, days, doneCreateSensorsWithMeasurements){
	var self = this;

  self.createSensors(n, function(err, allSensors){
    if (err) doneCreateSensorsWithMeasurements(err);
    async.eachSeries(allSensors, function(sensor, doneEachSensor){
      self.createMeasurements(sensor, days, doneEachSensor);
    }, function(errors){
			doneCreateSensorsWithMeasurements(errors, allSensors);
		});
  });
}

/**
 * Measurement factory
 **/
exports.createMeasurement = function(sensor, parameter, hoursAgo, doneCreateMeasurement){
	var measurement = new Measurement({
    sensor: sensor,
    parameter: parameter,
    collectedAt: moment().subtract(hoursAgo, 'hour')
  });

	switch (parameter._id) {
		case 'atmospheric_pressure':
			measurement.value = Math.random() * 105000;
			break;
		case 'electrical_conductivity':
				measurement.value = Math.random() * 20000;
			break;
		case 'ph':
				measurement.value = Math.random() * 14;
			break;
		case 'oxi-reduction_potential':
				measurement.value = Math.random() * 800;
			break;
		case 'water_temperature':
				measurement.value = 10 + Math.random() * 20;
			break;
		case 'ambient_temperature':
				measurement.value = 10 + Math.random() * 35;
			break;
		case 'relative_humidity':
				measurement.value = Math.random() * 100;
			break;
	}

	measurement.save(function(err){
		doneCreateMeasurement(err, sensor);
	})
}


exports.createMeasurements = function(sensor, days, doneCreateMeasurements){
	var self = this;

  // for each parameter
  async.eachSeries(parameters, function(parameter, doneEachParameter){
    // generate hourly measurements from now
  	async.timesSeries(days * 24, function(hoursAgo, doneEachHour){
      self.createMeasurement(sensor, parameter, hoursAgo - 1, doneEachHour);
    }, doneEachParameter);
  }, doneCreateMeasurements);
}
