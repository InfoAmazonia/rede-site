/**
 * Module dependencies.
 **/
var async = require('async');
var moment = require('moment');
var rosie = require('rosie').Factory;
var mongoose = require('mongoose');
var Sensor = mongoose.model('Sensor');
var Measurement = mongoose.model('Measurement');
var parameters = ['Atmospheric pressure', 'Electrical conductivity', 'pH', 'Oxi-reduction potential', 'Water temperature','Ambient temperature', 'Relative humidity'];

/**
 * Sensor factory
 **/
rosie.define('Sensor')
	.sequence('identifier', function(i) { return 'telephone ' + i })
	.sequence('description', function(i) { return 'some description for sensor ' + i })
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


exports.createSensorsAndMeasurements = function(n, days, doneCreateSensorsAndMeasurements){
	var self = this;

  self.createSensors(n, function(err, allSensors){
    if (err) doneCreateSensorsAndMeasurements(err);
    async.eachSeries(allSensors, function(sensor, doneEachSensor){
      self.createMeasurements(sensor, days, doneEachSensor);
    }, doneCreateSensorsAndMeasurements);
  });
}

/**
 * Measurement factory
 **/
exports.createMeasurement = function(sensor, parameter, hoursAgo, doneCreateMeasurement){
	var measurement = new Measurement({
    sensor: sensor,
    parameter: parameter,
    collectedAt: moment().subtract(hoursAgo, 'hour'),
    value: Math.random() * 100
  });
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
