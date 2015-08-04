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
var user1Password = '+8characthers';
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
          phoneNumber: '+551102930293',
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
          body.should.have.property('phoneNumber', payload.phoneNumber);
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
      it('returns 201 for valid parameters', function(doneIt){
        /* User info */
        var payload = {
          name: 'Regular user',
          email: 'regularuser@email.com',
          phoneNumber: '+5511111111111',
          password: user1Password
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
          body.should.have.property('phoneNumber', payload.phoneNumber);
          body.should.have.property('role', 'subscriber');
          body.should.have.property('registeredAt');
          body.should.not.have.property('password');
          user1 = body;

          /* Overrride e-mail confirmation */
          mongoose.model('User').update({_id: user1._id}, {$set: {emailConfirmed: true}}, function(err){
            if (err) return doneIt(err);

            /* Get access token */
            express.login(payload.email, payload.password, function(err, token){
              if (err) return doneIt(err);
              user1AccessToken = token;
              doneIt(err);
            });
          })
        }
      });

      it('returns 400 for invalid parameters', function(doneIt){
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
  });

  /*
   * PUT account
   */
  describe('PUT account', function(){
    context('is not logged', function(){
      it('returns 401', function(doneIt){
        var payload = {
          name: 'changed name',
          telephone: '+51023901293019'
        }

        request(app)
          .put(apiPrefix + '/account')
          .send(payload)
          .expect(401)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            if (err) doneIt(err);
            res.body.messages.should.have.lengthOf(1);
            messaging.hasValidMessages(res.body).should.be.true;
            res.body.messages[0].should.have.property('text', 'access_token.unauthorized');
            doneIt();
          });
      });
    });

    context('is logged', function(){
      it('should be able to change all account fields, but not role and email', function(doneIt){
        var payload = {
          role: 'admin',
          name: 'changed name for user 1',
          phoneNumber: '+51023901293019',
          email: 'anotheremail@mailbox.com'
        }

        request(app)
          .put(apiPrefix + '/account')
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            if (err) return doneIt(err);

            var body = res.body;

            /* User basic info */
            body.should.have.property('_id');
            body.should.have.property('role', 'subscriber');
            body.should.have.property('email', user1.email);
            body.should.have.property('name', payload.name);
            body.should.have.property('phoneNumber', payload.phoneNumber);
            body.should.have.property('registeredAt');
            body.should.not.have.property('password');
            user1 = body;

            doneIt();
        });
      });

      it('should require old password to change password', function(doneIt){
        var payload = {
          password: 'newpassword',
        }
        request(app)
          .put(apiPrefix + '/account')
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            if (err) doneIt(err);
            res.body.messages.should.have.lengthOf(1);
            messaging.hasValidMessages(res.body).should.be.true;
            res.body.messages[0].should.have.property('text', 'account.old_password_missing');
            doneIt();
          });
      });

      it('old password should be correct to change password', function(doneIt){
        var payload = {
          oldPassword: 'incorrect password',
          password: 'new password'
        }
        request(app)
          .put(apiPrefix + '/account')
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            if (err) doneIt(err);
            res.body.messages.should.have.lengthOf(1);
            messaging.hasValidMessages(res.body).should.be.true;
            res.body.messages[0].should.have.property('text', 'account.old_password_wrong');
            doneIt();
          });
      });

      it('should change password when parameters are correct', function(doneIt){
        var payload = {
          oldPassword: user1Password,
          password: 'new password'
        }

        request(app)
          .put(apiPrefix + '/account')
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            if (err) return doneIt(err);

            var body = res.body;

            /* User basic info */
            body.should.have.property('_id');
            body.should.have.property('role', 'subscriber');
            body.should.have.property('email', user1.email);
            body.should.have.property('name', user1.name);
            body.should.have.property('phoneNumber', user1.phoneNumber);
            body.should.have.property('registeredAt');
            body.should.not.have.property('password');
            user1 = body;

            mongoose.model('User').findOne({_id: user1._id}, function(err, u){
              if (err) return doneIt(err);

              u.authenticate(payload.password).should.be.true;

              doneIt();
            });

          });
      });
    });
  });

  /*
   * PUT users/:user_id
   */
  describe('PUT users/:user_id', function(){
    context('is not logged', function(){
      it('returns 401', function(doneIt){
        var payload = {
          name: 'changed name',
          telephone: '+51023901293019'
        }

        request(app)
          .put(apiPrefix + '/users/' + user1._id)
          .send(payload)
          .expect(401)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            if (err) doneIt(err);
            res.body.messages.should.have.lengthOf(1);
            messaging.hasValidMessages(res.body).should.be.true;
            res.body.messages[0].should.have.property('text', 'access_token.unauthorized');
            doneIt();
          });
      });
    });

    context('is regular user', function(){
      it('returns 401', function(doneIt){
        var payload = {
          name: 'changed name',
          telephone: '+51023901293019'
        }

        request(app)
          .put(apiPrefix + '/users/' + user1._id)
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect(401)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            if (err) doneIt(err);
            res.body.messages.should.have.lengthOf(1);
            messaging.hasValidMessages(res.body).should.be.true;
            res.body.messages[0].should.have.property('text', 'access_token.unauthorized');
            doneIt();
          });
      });
    });

    context('is admin', function(){
      it('should be able to update role, name, phone number, email', function(doneIt){
        var payload = {
          role: 'admin',
          name: 'changed name',
          password: 'another password',
          phoneNumber: '+51023901293019',
          email: 'anotheremail@mailbox.com'
        }

        request(app)
          .put(apiPrefix + '/users/' + user1._id)
          .set('Authorization', admin1AccessToken)
          .send(payload)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            if (err) return doneIt(err);

            var body = res.body;

            /* User basic info */
            body.should.have.property('_id');
            body.should.have.property('role', payload.role);
            body.should.have.property('name', payload.name);
            body.should.have.property('email', payload.email);
            body.should.have.property('phoneNumber', payload.phoneNumber);
            body.should.have.property('email', payload.email);
            body.should.have.property('registeredAt');
            body.should.not.have.property('password');
            user1 = body;

            /* Test if new password works */
            express.login(payload.email, payload.password, function(err, token){
              if (err) return doneIt(err);
              user1AccessToken = token;
              doneIt(err);
            });
          });
      });
    });
  });

  /*
   * After tests, clear database
   */

  after(mongodb.clearDb);
});
