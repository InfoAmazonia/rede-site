/*
 * Module dependencies
 */

var csv = require('csv');
var request = require('supertest');
var async = require('async');
var should = require('should');
var moment = require('moment');
var mongoose = require('mongoose');

/*
 * The app
 */

var app = require('../../app');

/*
 * Models
 */

var Sensor = mongoose.model('Sensor');
var Measurement = mongoose.model('Measurement');

/*
 * Helpers
 */
var mongodb = require('../../lib/helpers/mongodb');
var factory = require('../../lib/helpers/factory');
var express = require('../../lib/helpers/express');
var messaging = require('../../lib/helpers/messaging');

/*
 * Config
 */
var config = require('../../config')['test'];

var numberOfSensors = 5;
var numberOfSensorsWithData = 3;
var daysOfMeasurements = 3;
var measurementsInterval = 1;

/*
 * Test data
 */
var sensor1;

/*
 * The tests
 */
describe('Model: Sensors', function(){
  before(function (doneBefore) {

    // set a higher timeout for creating sensors and measurements
    this.timeout(10000);

    /*
     * Init database
     */
    mongodb.whenReady(function(){
      mongodb.clearDb(function(err){
        if (err) doneBefore(err);

        factory.createSensorsWithMeasurements({
          numberOfSensors: numberOfSensorsWithData,
          days: daysOfMeasurements,
          interval: measurementsInterval
        }, function(err, sensors){
          if (err) return doneBefore(err);
          sensor1 = sensors[0];
          doneBefore();
        });
      });
    });
  });

  /*
   * getPhWqi(callback)
   */
  describe('get Water Quality Index for a measurement', function(){
    it('calculates for pH measurement', function(doneIt){

      var measurement = new Measurement({
        sensor: sensor1,
        parameter: 'ph',
        value: 7.5,
        collectedAt: Date.now()
      });

      var wqi = measurement.wqi;
      wqi.should.have.property('score', 92.5);
      wqi.should.have.property('range', 'Excelent');
      doneIt();
    });

    it('calculates for electrical conductivity', function(doneIt){
      var measurement = new Measurement({
        sensor: sensor1,
        parameter: 'electrical_conductivity',
        value: 1500,
        collectedAt: Date.now()
      });
      var wqi = measurement.wqi;
      wqi.should.have.property('score', 90.0);
      wqi.should.have.property('range', 'Excelent');

      var measurement = new Measurement({
        sensor: sensor1,
        parameter: 'electrical_conductivity',
        value: 3500,
        collectedAt: Date.now()
      });
      var wqi = measurement.wqi;
      wqi.should.have.property('score', 60.0);
      wqi.should.have.property('range', 'Average');

      doneIt();
    });
  });

  it('calculates for ORP', function(doneIt){
      var measurement = new Measurement({
        sensor: sensor1,
        parameter: 'oxi-reduction_potential',
        value: 500,
        collectedAt: Date.now()
      });
      var wqi = measurement.wqi;
      wqi.should.have.property('score', 90.0);
      wqi.should.have.property('range', 'Excelent');

      var measurement = new Measurement({
        sensor: sensor1,
        parameter: 'oxi-reduction_potential',
        value: 50,
        collectedAt: Date.now()
      });
      var wqi = measurement.wqi;
      wqi.should.have.property('score', 25.0);
      wqi.should.have.property('range', 'Bad');

      doneIt();
  });

});
