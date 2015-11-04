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
	.attr('emailConfirmed', true)

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

 var sensorsCoordinates = [
   [
     -55.05523681640625,
     -2.7811947651144058
   ],[
     -55.030517578125,
     -2.654994159422252
   ],[
     -54.97833251953125,
     -2.5425001266054212
   ],[
     -54.93438720703125,
     -2.4272521703917294
   ],[
     -54.84100341796874,
     -2.410787363563224
   ],[
     -54.69818115234375,
     -2.408043209688525
   ],[
     -54.766845703125,
     -2.410787363563224
   ],[
     -54.60754394531249,
     -2.468413307057984
   ],[
     -54.99481201171875,
     -2.591888984149953
   ],[
     -54.88769531249999,
     -2.419019791962254
   ],[
     -54.52239990234375,
     -2.4793893957642683
   ],[
     -54.45098876953125,
     -2.506829218322983
   ],[
     -55.01678466796874,
     -2.7126091154394105
   ],[
     -55.052490234375,
     -2.8580059533946107
   ],[
     -54.9481201171875,
     -2.4629252286881287
   ],[
     -54.7998046875,
     -2.41353151190461
   ],[
     -54.656982421875,
     -2.435484498681974
   ],[
     -54.569091796875,
     -2.4821334037305633
   ],[
     -54.3988037109375,
     -2.515061053188806
   ],[
     -55.0250244140625,
     -2.7565043855432503
   ]
 ];

rosie.define('Sensor')
	.sequence('identifier', function(i) { return '+55119999999'+ i })
	.sequence('name', function(i) { return 'Sensor '+ i })
	.sequence('description', function(i) { return 'some description for Sensor ' + i })
	.attr('image', function(i) { return 'http://imguol.com/blogs/122/files/2015/07/Prototipo-foto-Miguel-PeixeDSCF1515.jpg' })
	.sequence('geometry', function(i){
		var coordinates = sensorsCoordinates[i];

		if (!coordinates) {
			var lon = -54.398803 + Math.random() * (-55.055236-(-54.398803));
			var lat = -2.4080432 + Math.random() * (-2.8580059-(-2.4080432));
			coordinates = [lon, lat];
		}
		return {
			type: 'Point',
			coordinates: coordinates
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


exports.createSensorsWithMeasurements = function(options, doneCreateSensorsWithMeasurements){
	var self = this;

  self.createSensors(options.numberOfSensors, function(err, allSensors){
    if (err) doneCreateSensorsWithMeasurements(err);
    async.eachSeries(allSensors, function(sensor, doneEachSensor){
			options.sensor = sensor;
      self.createMeasurements(options, doneEachSensor);
    }, function(errors){
			doneCreateSensorsWithMeasurements(errors, allSensors);
		});
  });
}

/**
 * Measurement factories
 **/

exports.createMeasurement = function(sensor, parameter, hoursAgo, doneCreateMeasurement){

	var measurement = new Measurement({
    sensor: sensor,
    parameter: parameter,
    collectedAt: moment().subtract(hoursAgo, 'hour').format('YYYY-MM-DDTHH:mm:ss')
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
		case 'illuminance':
				measurement.value = Math.random() * 1000;
			break;
	}

	measurement.save(function(err){
		doneCreateMeasurement(err, sensor);
	})
}

exports.createMeasurementOnDate = function(sensor, parameter, date, doneCreateMeasurement){

	var measurement = new Measurement({
    sensor: sensor,
    parameter: parameter,
    collectedAt: date
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
		case 'illuminance':
				measurement.value = Math.random() * 1000;
			break;
	}

	measurement.save(function(err){
		doneCreateMeasurement(err, sensor);
	})
}


exports.createMeasurements = function(options, doneCreateMeasurements){
	var self = this;
	var date;


	var measurementsCount = options.days * 24 / options.interval;
	// each measurement
	async.timesSeries(measurementsCount, function(n, doneEachMeasurement){
		var hoursAgo = n * options.interval;
		date = moment().subtract(hoursAgo, 'hour').format('YYYY-MM-DDTHH:mm:ss');
		// each parameter
		async.eachSeries(parameters, function(parameter, doneEachParameter){
      self.createMeasurementOnDate(options.sensor, parameter, date, doneEachParameter);
    }, doneEachMeasurement);
  }, function(err, result){
		if (err) return doneCreateMeasurements(err);
		mongoose.model('Sensor').update({_id: options.sensor._id}, {lastMeasurement: date},doneCreateMeasurements);
	});
}
