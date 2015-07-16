/*
 * Module dependencies
 */

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

var Measurement = mongoose.model('Measurement');
var Sensor = mongoose.model('Sensor');

/*
 * Helpers
 */

var expressHelper = require('../helpers/express');
var clearDb = require('../helpers/clearDb');
// var factory = require('../helpers/factory');
// var messaging = require('../../lib/messaging')

/* Config */

var config = require('../../config')['test'];
var apiPrefix = config.apiPrefix;

/* The tests */

describe('API: Measurements', function(){

  before(function (doneBefore) {

    /*
     * Init database
     */

    expressHelper.whenReady(function(){
      clearDb.all(function(err){
        should.not.exist(err);
        doneBefore();
      });
    });
  });

  /*
    POST /api/v1/areas
  */

  describe('POST /api/v1/measurements', function(){
    it('should return 200 for valid data', function(doneIt){
      var payload = {
        phoneNumber: '+551199999999',
        data: '2015-07-14T10:08:15-03:00;Tw=20.3;Ta:F=78.29;pH=6.9'
      }

      request(app)
        .post(apiPrefix + '/measurements')
        .send(payload)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          should.not.exist(err);
          var body = res.body;

          Sensor.findOne({phoneNumber: payload.phoneNumber}, function(err, sensor){
            should.not.exist(err);
            should.exist(sensor);

            Measurement
              .find({sensor: sensor._id})
              .sort('parameter')
              .exec(function(err, measurements){
                should.not.exist(err);
                measurements.should.have.length(3);

                var measurement1 = measurements[0];
                measurement1.should.have.property('parameter', 'Ta');
                measurement1.should.have.property('unit', 'F');
                measurement1.should.have.property('value', 78.29);

                var measurement2 = measurements[1];
                measurement2.should.have.property('parameter', 'Tw');
                measurement2.should.have.property('unit', null);
                measurement2.should.have.property('value', 20.3);

                var measurement3 = measurements[2];
                measurement3.should.have.property('parameter', 'pH');
                measurement3.should.have.property('unit', null);
                measurement3.should.have.property('value', 6.9);

                doneIt();
              });
        });
      });
    });
  });

  /*
   * After tests, clear database
   */

  after(function (done) {
    clearDb.all(function(err){
      should.not.exist(err);
      done(err);
    });
  });
})
