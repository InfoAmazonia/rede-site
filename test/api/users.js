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

// var Sensor = mongoose.model('Sensor');

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

/*
 * Test data
 */
var admin1;
var admin1AccessToken;
var user1;
var user1AccessToken;
var sensor1;
var sensor2;
var sensor3;

/*
 * The tests
 */
describe('API: Users', function(){

  /*
   * Init application
   */
  before(function (doneBefore) {
    mongodb.whenReady(function(){
      mongodb.clearDb(function(done){
        factory.createSensors(3, function(err, sensors){
          if (err) return doneBefore(err);
          sensor1 = sensors[0];
          sensor2 = sensors[1];
          sensor3 = sensors[2];
          doneBefore();
        });
      });
    });
  });

  /*
   * POST /api/v1/users
   */
  describe('POST /api/v1/users', function(){

    context('first user', function(){
      it('return 201 and user should have \'admin\' role', function(doneIt){
        /* User info */
        var payload = {
          name: 'First user',
          email: 'theveryfirstuser@email.com',
          password: '+8characthers'
        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(payload)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) doneIt(err);
          var body = res.body;

          /* User basic info */
          body.should.have.property('_id');
          body.should.have.property('name', payload.name);
          body.should.have.property('email', payload.email);
          body.should.have.property('role', 'admin');
          body.should.have.property('registeredAt');
          body.should.not.have.property('password');

          admin1 = body;

          express.login(payload.email, payload.password, function(err, token){
            if (err) doneIt(err);
            admin1AccessToken = token;
            doneIt(err);
          });
        }
      });
    });

    context('regular users', function(){
      it('should return 201 for valid parameters', function(){
        /* User info */
        var payload = {
          name: 'Regular user',
          email: 'regularuser@email.com',
          password: '+8characthers'
        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(payload)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) doneIt(err);
          var body = res.body;

          /* User basic info */
          body.should.have.property('_id');
          body.should.have.property('name', payload.name);
          body.should.have.property('email', payload.email);
          body.should.have.property('role', 'subscriptor');
          body.should.have.property('registeredAt');
          body.should.not.have.property('password');
          user1 = body;

          express.login(payload.email, payload.password, function(err, token){
            if (err) doneIt(err);
            user11AccessToken = token;
            doneIt(err);
          });
        }
      });

      it('should return 400 for invalid parameters', function(doneIt){
        /* User info */
        var payload = {
          email: 'user2@email.com'
        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(payload)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'users.missing_password');
          doneIt();
        }
      });
    });

    context('sensor subscriptions', function(){
      it('should return 200 and data for valid user');
      it('should return 404 for invalid user');
    })
  });
});

/*
 * PUT /api/v1/users
 */
describe('PUT /api/v1/users', function(){
  context('admin', function(){
    it('should be able to change roles');
    it('should be able to inactivate users');
    it('should be able to remove users');
  });

  context('regular user', function(){
    it('should be able to subscribe a sensor');
    it('should be able to change telefone address');
  });
});
