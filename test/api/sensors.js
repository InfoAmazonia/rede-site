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
var apiPrefix = config.apiPrefix;
var defaultPerPage = 20;

var numberOfSensors = 50;
var numberOfSensorsWithData = 3;
var daysOfMeasurements = 3;
var measurementsInterval = 1;

/*
 * Test data
 */
var nonExistingObjectHash = '556899153f90be8f422f3d3f';
var user1;
var user1AccessToken;
var sensor1;
var sensorsWithMeasurements;
var sensor2;

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
              sensor2 = sensors[0];
              doneEach(err, sensors);
            })
          }, function(doneEach){
            factory.createSensorsWithMeasurements({numberOfSensors: numberOfSensorsWithData, days: daysOfMeasurements, interval: measurementsInterval}, function(err, sensors){
              if (err) doneBefore(err);
              sensorsWithMeasurements = sensors;
              doneEach(err, sensors);
            });
          }], function(err, sensors){
            if (err) return doneBefore(err);
            doneBefore();
        });
      });
    });
  });

  /*
   * GET sensors - Return a list of sensors
   */
  describe('GET sensors', function(){
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
     * POST sensors
     */

    describe('POST sensors', function(){
      var apiRoute = apiPrefix + '/sensors';

      context('not logged in', function(){
        it('should return 401 (Unauthorized)', function(doneIt){
          request(app)
            .post(apiRoute)
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
            description: 'Some description.',
            image: 'http://imguol.com/blogs/122/files/2015/07/Prototipo-foto-Miguel-PeixeDSCF1515.jpg',
            geometry: {
              type: 'Point',
              coordinates: [-46.63318, -23.55046]
            }
          }

          request(app)
            .post(apiRoute)
            .set('Authorization', user1AccessToken)
            .send(payload)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res){
              if (err) doneIt(err);
              var body = res.body;

              body.should.have.property('identifier', payload.identifier);
              body.should.have.property('name', payload.name);
              body.should.have.property('description', payload.description);
              body.should.have.property('image', payload.image);

              /* Location geojson */
              var geometryGeojson = body.geometry;
              geometryGeojson.should.have.property('type', payload.geometry.type);
              geometryGeojson.should.have.property('coordinates');
              geometryGeojson.coordinates.should.be.an.Array;

              /* Coordinates */
              var coordinates = geometryGeojson.coordinates
              coordinates[0].should.be.equal(payload.geometry.coordinates[0]);
              coordinates[1].should.be.equal(payload.geometry.coordinates[1]);

              sensor1 = res.body;

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
            .post(apiRoute)
            .set('Authorization', user1AccessToken)
            .send(payload)
            .expect(400)
            .expect('Content-Type', /json/)
            .end(function(err, res){
              if (err) doneIt(err);
              var body = res.body;

              res.body.messages.should.have.lengthOf(1);
              messaging.hasValidMessages(res.body).should.be.true;
              res.body.messages[0].should.have.property('text', 'sensors.missing_identifier');

              doneIt();
          });
        });
      });
    });

    /*
     *  PUT sensors/:id
     */
    describe('PUT /api/v1/sensors/:id', function(){
      context('not logged in', function(){
        it('should return 401 (Unauthorized)', function(doneIt){
          Sensor.findOne(function(err, sensor){
            if (err) doneIt(err);
            should.exist(sensor);
            request(app)
              .put(apiPrefix + '/sensors/'+sensor._id.toHexString())
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
      });

      context('when logged as user1', function(){
        it('return 200 (Success) for valid sensor data', function(doneIt){
          var payload = {
            identifier: '+550000000000',
            name: 'changed name',
            description: 'changed description',
            geometry: {
              type: 'Point',
              coordinates: [-46.222222, -23.11111]
            }
          }

          request(app)
            .put(apiPrefix + '/sensors/'+ sensor1._id)
            .set('Authorization', user1AccessToken)
            .send(payload)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res){
              if (err) doneIt(err);
              var body = res.body;

              /* User basic info */
              body.should.have.property('identifier', payload.identifier);
              body.should.have.property('name', payload.name);
              body.should.have.property('description', payload.description);

              /* Location geojson */
              var geometryGeojson = body.geometry;
              geometryGeojson.should.have.property('type', payload.geometry.type);
              geometryGeojson.should.have.property('coordinates');
              geometryGeojson.coordinates.should.be.an.Array;

              /* Coordinates */
              var coordinates = geometryGeojson.coordinates
              coordinates[0].should.be.equal(payload.geometry.coordinates[0]);
              coordinates[1].should.be.equal(payload.geometry.coordinates[1]);

              /* Keep sensor for later usage */
              sensor1 = res.body;

              doneIt();
            });
        });

        it('return 400 (Bad request) for invalid sensor data');
        it('return 404 (Not found) for id not found');
      });
    });

    /*
     *  DEL /api/v1/sensors/:id
     */
    describe('DEL sensors/:id', function(){
      context('not logged in', function(){
        it('should return 401 (Unauthorized)', function(doneIt){
          var sensor = sensorsWithMeasurements[0];

          request(app)
            .del(apiPrefix + '/sensors/'+sensor._id.toHexString())
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

      context('when logged as user1', function(){
        it('delete and return 200 (Success)', function(doneIt){
          var sensorToDelete = sensorsWithMeasurements[0];

          request(app)
            .del(apiPrefix + '/sensors/'+sensorToDelete._id.toHexString())
            .set('Authorization', user1AccessToken)
            .expect(200)
            .end(function(err, res){
              if (err) doneIt(err);
              var body = res.body;

              // sensor should not exist
              Sensor.findById(sensorToDelete._id, function(err, sensor){
                if (err) return doneIt(err);
                should.not.exist(sensor);

                // sensor measurements should not exist
                mongoose.model('Measurement').count({sensor: sensorToDelete._id}, function(err, count){
                  if (err) return doneIt(err);
                  count.should.be.equal(0);
                  doneIt();
                });
            });
          });
        });

        it('return 404 (Not found) for id not found', function(doneIt){
          request(app)
            .get(apiPrefix + '/sensors/'+ nonExistingObjectHash)
            .expect(404)
            .expect('Content-Type', /json/)
            .end(function(err, res){
              if (err) return doneIt(err);
              var body = res.body;

              res.body.messages.should.have.lengthOf(1);
              messaging.hasValidMessages(res.body).should.be.true;
              res.body.messages[0].should.have.property('text', 'sensors.not_found');

              doneIt();
            });
        });
      });
    });


    /*
     * GET /api/v1/sensors/:sensor_id/score - Get water quality score for sensor
     */
    describe('GET sensors/:sensor_id/score', function(){
      it('should return 200 for valid data', function(doneIt){

        var targetSensor = sensorsWithMeasurements[1];

        /* The request */
        request(app)
          .get(apiPrefix + '/sensors/'+targetSensor._id+'/score')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          var body = res.body;

          body['sensor'].should.have.property('_id', targetSensor._id.toHexString());
          body['score'].should.be.an.Number();

          var parameters = body.parameters;
          parameters.should.be.an.Array();
          parameters.should.not.have.lengthOf(0);

          var parameter = parameters[0];
          parameter.should.have.property('_id');
          parameter.should.have.property('value');

          doneIt();
        }
      });
    });

    /*
     * POST sensors/:sensor_id/subscribe
     */
    describe('POST sensors/:sensor_id/subscribe', function(){
      context('logged user', function(){
        it('should be able to subscribe to sensor', function(doneIt){
          /* The request */
          request(app)
            .post(apiPrefix + '/sensors/'+sensor1._id+'/subscribe')
            .set('Authorization', user1AccessToken)
            .expect(200)
            .end(function(err, res){
              if (err) return doneIt(err);

              var body = res.body;
              body.should.have.property('user');

              var user = body.user;
              user.should.have.property('subscribedToSensors');

              var subscribedToSensors = user['subscribedToSensors'];
              subscribedToSensors.should.be.an.Array();
              subscribedToSensors.should.have.length(1);
              subscribedToSensors.should.containEql(sensor1._id);
              doneIt();
            });
        });

        it('does not duplicate subscriptions', function(doneIt){
          /* The request */
          request(app)
            .post(apiPrefix + '/sensors/'+sensor1._id+'/subscribe')
            .set('Authorization', user1AccessToken)
            .expect(200)
            .end(function(err, res){
              if (err) return doneIt(err);

              var body = res.body;
              body.should.have.property('user');

              var user = body.user;
              user.should.have.property('subscribedToSensors');

              var subscribedToSensors = user['subscribedToSensors'];
              subscribedToSensors.should.be.an.Array();
              subscribedToSensors.should.have.length(1);
              subscribedToSensors.should.containEql(sensor1._id);
              doneIt();
            });
        });

        it('adds more than one sensor properly', function(doneIt){
          /* The request */
          request(app)
            .post(apiPrefix + '/sensors/'+sensor2._id+'/subscribe')
            .set('Authorization', user1AccessToken)
            .expect(200)
            .end(function(err, res){
              if (err) return doneIt(err);

              var body = res.body;
              body.should.have.property('user');

              var user = body.user;
              user.should.have.property('subscribedToSensors');

              var subscribedToSensors = user['subscribedToSensors'];
              subscribedToSensors.should.be.an.Array();
              subscribedToSensors.should.have.length(2);
              subscribedToSensors.should.containEql(sensor1._id);
              subscribedToSensors.should.containEql(sensor2._id.toHexString());
              doneIt();
            });
        });

        it('should get error for non-existing sensor', function(doneIt){
          /* The request */
          request(app)
            .post(apiPrefix + '/sensors/'+nonExistingObjectHash+'/subscribe')
            .expect(404)
            .end(doneIt);
        });
      });

      context('non-logged user', function(){
        it('should not be able to subscribe to sensor', function(doneIt){
          /* The request */
          request(app)
            .post(apiPrefix + '/sensors/'+sensor1._id+'/subscribe')
            .expect(401)
            .end(doneIt);
        });
      });
    });

    /*
     * POST sensors/:sensor_id/unsubscribe
     */
    describe('POST sensors/:sensor_id/unsubscribe', function(){
      context('logged user', function(){
        it('should be able to unsubscribe to sensor', function(doneIt){
          /* The request */
          request(app)
            .post(apiPrefix + '/sensors/'+sensor1._id+'/unsubscribe')
            .set('Authorization', user1AccessToken)
            .expect(200)
            .end(function(err, res){
              if (err) return doneIt(err);

              var body = res.body;
              body.should.have.property('user');

              var user = body.user;
              user.should.have.property('subscribedToSensors');

              var subscribedToSensors = user['subscribedToSensors'];
              subscribedToSensors.should.be.an.Array();
              subscribedToSensors.should.have.length(1);
              subscribedToSensors.should.not.containEql(sensor1._id);
              subscribedToSensors.should.containEql(sensor2._id.toHexString());
              doneIt();
            });
        });

        it('should get error for non-existing sensor', function(doneIt){
          /* The request */
          request(app)
            .post(apiPrefix + '/sensors/'+nonExistingObjectHash+'/unsubscribe')
            .expect(404)
            .end(doneIt);
        });
      });

      context('non-logged user', function(){
        it('should not be able to unsubscribe to sensor', function(doneIt){
          /* The request */
          request(app)
            .post(apiPrefix + '/sensors/'+sensor1._id+'/unsubscribe')
            .expect(401)
            .end(doneIt);
        });
      });
    });

    /*
     * GET sensor/:sensor_id/measurements/:parameter_id.csv
    */
    describe('GET measurements as CSV', function(){
      it('return valid csv file', function(doneIt){
        var sensor = sensorsWithMeasurements[2];

        /* The request */
        request(app)
          .get(apiPrefix + '/sensors/'+sensor._id.toHexString()+'/measurements/atmospheric_pressure.csv')
          .expect(200)
          .expect('Content-Type', /csv/)
          .end(onResponse);

          /* Verify response */
          function onResponse(err, res) {
            if (err) return doneIt(err);

            Measurement
              .find({sensor: sensor, parameter: 'atmospheric_pressure'})
              .sort('collectedAt')
              .exec(function(err, measurements){

                csv.parse(res.text, function(err,data){
                  if (err) doneIt(err);

                  var header = data.shift();
                  header.join(',').should.eql('timestamp,sensor_id,measurement_id,parameter_id,value');

                  measurements.should.have.length(data.length);
                  for (var i = 0; i < data.length; i++) {
                    var collectedAt = moment.utc(measurements[i]['collectedAt']).toISOString();
                    collectedAt.should.eql(data[i][0]);

                    measurements[i]['sensor'].toHexString().should.eql(data[i][1]);
                    measurements[i]['_id'].toHexString().should.eql(data[i][2]);
                    measurements[i]['parameter'].should.eql(data[i][3]);
                    measurements[i]['value'].should.eql(parseFloat(data[i][4]));

                  }
                  doneIt();
                })
              });
        }
      });
  });



  /*
   * After tests, clear database
   */

  after(mongodb.clearDb);
});
