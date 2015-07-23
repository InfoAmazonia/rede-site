/**
 * Module dependencies.
 **/
var async = require('async');
var moment = require('moment');
var rosie = require('rosie').Factory;
var mongoose = require('mongoose');
var Sensor = mongoose.model('Sensor');
var Measurement = mongoose.model('Measurement');

/*
 * Load config
 */
var env = process.env.NODE_ENV || 'development'
var config = require('../../config')[env]
var parameters = config.parameters;

/**
 * Sensor factory
 **/
rosie.define('Sensor')
	.sequence('_id', function(i) { return i })
	.sequence('name', function(i) { return 'Sensor '+ i })
	.sequence('description', function(i) { return 'some description for Sensor ' + i })
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



//
// /**
//  * Initiatives
//  **/
//
// rosie.define('Initiative')
// 	.sequence('name', function(i) { return 'name ' + i })
// 	.sequence('description', function(i) { return 'some description for initiative ' + i })
// 	.sequence('website', function(i) { return 'www ' + i })
// 	.sequence('facebook', function(i) { return 'facebook ' + i });
//
//
// exports.createInitiative = function(creator_id, area_id, done){
// 	var initiative = new Initiative(rosie.build('Initiative'));
// 	initiative.creator = creator_id;
// 	initiative.areas.push(area_id);
// 	initiative.save(function(err){
// 		done(err, initiative);
// 	})
// }
//
// exports.createInitiatives = function(n, creator_id, area_id, doneCreateInitiatives){
// 	var self = this;
//
// 	async.timesSeries(n, function(n,doneEach){
// 		self.createInitiative(creator_id, area_id, doneEach)
// 	}, doneCreateInitiatives);
// }
//
// /**
//  * Initiatives
//  **/
//
// rosie.define('Resource')
// 	.sequence('description', function(i) {
// 			return 'some description for item ' + i
// 		})
// 	.sequence('name', function(i) { return 'name for item ' + i })
// 	.option('bbox', [[-180,-90],[180,90]])
// 	.attr('geometry', ['bbox'], function(bbox){
// 		var min_lon = bbox[0][0];
// 		var min_lat = bbox[0][1];
// 		var max_lon = bbox[1][0];
// 		var max_lat = bbox[1][1];
// 		var lat = min_lat + Math.random() * (max_lat-min_lat);
// 		var lon = min_lon + Math.random() * (max_lon-min_lon);
//
// 		return {
// 			type: 'Point',
// 			coordinates: [lon,lat]
// 		}
// 	})
//
//
// exports.createResource = function(creatorId, bbox, done){
// 	var resource = new Resource(rosie.build('Resource', {},{bbox: bbox}));
// 	resource.creator = creatorId;
// 	resource.category = 'Supply';
// 	resource.type = 'Seeds';
// 	resource.save(function(err){
// 		done(err, resource);
// 	})
// }
//
// exports.createResources = function(n, creatorId, bbox, doneCreateResources){
// 	var self = this;
// 	async.timesSeries(n, function(i,doneEach){
// 		self.createResource(creatorId, bbox, doneEach)
// 	}, doneCreateResources);
// }
