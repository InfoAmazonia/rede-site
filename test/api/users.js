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
// var factory = require('../../lib/helpers/factory');
var express = require('../../lib/helpers/express');

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


/*
 * The tests
 */
describe('API: Users', function(){

  /*
   * Init application
   */
  before(function (doneBefore) {
    mongodb.whenReady(function(){
      mongodb.clearDb(doneBefore);
    });
  });

  /*
   * POST /api/v1/users
   */
  describe('POST /api/v1/users', function(){
    context('when parameters are valid', function(){
      it('return 201 (Created successfully) and the user info', function(doneIt){
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
          body.should.have.property('role');
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
  });
});
