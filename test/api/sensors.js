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

var Sensor = mongoose.model('Sensor');

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
var apiPrefix = config.apiPrefix;
var defaultPerPage = 20;

var numberOfSensors = 50;
var numberOfSensorsWithData = 3;
var daysOfMeasurements = 3;

/*
 * Test data
 */
var user1;
var user1AccessToken;
var user1Sensor1;
var allSensors;

/*
 * The tests
 */
describe('API: Sensors', function(){

  before(function (doneBefore) {

    // set a higher timeout for creating sensors and measurements
    this.timeout(10000);

    /*
     * Init database
     */
    mongodb.whenReady(function(){
      mongodb.clearDb(function(err){
        if (err) doneBefore(err);
        async.series([
          function (doneEach){
            factory.createUser(function(err,usr){
              if (err) return doneBefore(err);
              // first user is admin
              user1 = usr;
              express.login(user1.email, user1.password, function(err, token){
                user1AccessToken = token;
                doneEach(err);
              });
            });
          },
          function(doneEach){
            factory.createSensors(numberOfSensors - numberOfSensorsWithData, function(err, sensors){
              if (err) doneBefore(err);
              doneEach(err, sensors);
            })
          }, function(doneEach){
            factory.createSensorsWithMeasurements(numberOfSensorsWithData, daysOfMeasurements, function(err, sensors){
              if (err) doneBefore(err);
              doneEach(err, sensors);
            });
          }], function(err, sensors){
            if (err) return doneBefore(err);
            allSensors = sensors;
            doneBefore();
        });
      });
    });
  });

  /*
   * GET /api/v1/sensors - Return a list of sensors
  */
  describe('GET /api/v1/sensors', function(){
    it('should return 200 for valid data', function(doneIt){

      /* The request */
      request(app)
        .get(apiPrefix + '/sensors')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(onResponse);

      /* Verify response */
      function onResponse(err, res) {
        if (err) return doneIt(err);

        /* Check pagination */
        var body = res.body;
        body.should.have.property('count', numberOfSensors);
        body.should.have.property('perPage', defaultPerPage);
        body.should.have.property('page', 1);
        body.should.have.property('sensors');

        /* Check data */
        var data = body.sensors;
        data.should.have.lengthOf(defaultPerPage);
        mongoose.model('Sensor')
          .find({})
          .sort('_id')
          .limit(defaultPerPage)
          .lean()
          .exec(function(err, sensors){
            if (err) return doneIt(err);
            for (var i = 0; i < defaultPerPage; i++) {

              var sensor = sensors[i];
              data[i].should.have.property('_id', sensor._id.toHexString());
              data[i].should.have.property('description', sensor.description);
              data[i].should.have.property('createdAt');

              var createdAt = moment(data[i].createdAt).format();
              createdAt.should.equal(moment(sensor.createdAt).format());

              var geometry = sensor.geometry;
              data[i].should.have.property('geometry');
              data[i]['geometry'].should.have.property('type', geometry.type);

              var coordinates = geometry.coordinates;
              data[i]['geometry'].should.have.property('coordinates');
              data[i]['geometry']['coordinates'].should.containDeepOrdered(coordinates);
            }
            doneIt();
        });
      }
    });

    it('return 200 and proper page when parameters are passed', function(doneIt){

      var payload = {
        page: 3,
        perPage: 14
      }

      /* The request */
      request(app)
        .get(apiPrefix + '/sensors')
        .query(payload)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(onResponse);

      /* Verify response */
      function onResponse(err, res) {
        if (err) return doneIt(err);

        /* Check pagination */
        var body = res.body;
        body.should.have.property('count', numberOfSensors);
        body.should.have.property('perPage', payload.perPage);
        body.should.have.property('page', payload.page);
        body.should.have.property('sensors');

        /* Check data */
        var data = body.sensors;
        data.should.have.lengthOf(payload.perPage);
        mongoose.model('Sensor')
          .find({})
          .sort('_id')
          .limit(payload.perPage)
          .skip(payload.perPage*(payload.page-1))
          .lean()
          .exec(function(err, sensors){
            if (err) return doneIt(err);
            for (var i = 0; i < payload.perPage; i++) {

              var sensor = sensors[i];
              data[i].should.have.property('_id', sensor._id.toHexString());
              data[i].should.have.property('description', sensor.description);
              data[i].should.have.property('createdAt');

              var createdAt = moment(data[i].createdAt).format();
              createdAt.should.equal(moment(sensor.createdAt).format());

              var geometry = sensor.geometry;
              data[i].should.have.property('geometry');
              data[i]['geometry'].should.have.property('type', geometry.type);

              var coordinates = geometry.coordinates;
              data[i]['geometry'].should.have.property('coordinates');
              data[i]['geometry']['coordinates'].should.containDeepOrdered(coordinates);

            }
             doneIt();
          });
      }
    });
  });


    /*
     * POST /api/v1/sensors
     */

    describe('POST /api/v1/sensors', function(){
      context('not logged in', function(){
        it('should return 401 (Unauthorized)', function(doneIt){
          request(app)
            .post(apiPrefix + '/sensors')
            .expect(401)
            .end(function(err,res){
              if (err) doneIt(err);
              res.body.messages.should.have.lengthOf(1);
              messaging.hasValidMessages(res.body).should.be.true;
              res.body.messages[0].should.have.property('text', 'access_token.unauthorized');
              doneIt();
            });
        });
      });

      context('when logged in', function(){
        it('return 201 (Created) for valid payload', function(doneIt){
          var payload = {
            identifier: '+55119999999',
            name: 'Sensor 1',
            geometry: {
              type: 'Point',
              coordinates: [-46.63318, -23.55046]
            }
          }

          request(app)
            .post(apiPrefix + '/sensors')
            .set('Authorization', user1AccessToken)
            .send(payload)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res){
              if (err) doneIt(err);
              var body = res.body;

              body.should.have.property('identifier', payload.identifier);
              body.should.have.property('name', payload.name);

              /* Location geojson */
              var geometryGeojson = body.geometry;
              geometryGeojson.should.have.property('type', payload.geometry.type);
              geometryGeojson.should.have.property('coordinates');
              geometryGeojson.coordinates.should.be.an.Array;

              /* Coordinates */
              var coordinates = geometryGeojson.coordinates
              coordinates[0].should.be.equal(payload.geometry.coordinates[0]);
              coordinates[1].should.be.equal(payload.geometry.coordinates[1]);

              user1Sensor1 = res.body;

              doneIt();
            })
        });

        it('return 400 (Bad request) for invalid payload', function(doneIt){
          var payload = {
            name: 'Sharing a resource',
            geometry: {
              type: 'Point',
              coordinates: [-46.63318, -23.55046]
            }
          }

          request(app)
            .post(apiPrefix + '/sensors')
            .set('Authorization', user1AccessToken)
            .send(payload)
            .expect(400)
            .expect('Content-Type', /json/)
            .end(function(err, res){
              if (err) doneIt(err);
              var body = res.body;

              res.body.messages.should.have.lengthOf(1);
              messaging.hasValidMessages(res.body).should.be.true;
              res.body.messages[0].should.have.property('text', 'mongoose.errors.sensors.missing_identifier');

              doneIt();
            });
        });
      });
    });

  /*
   * After tests, clear database
   */

  after(mongodb.clearDb);
})
