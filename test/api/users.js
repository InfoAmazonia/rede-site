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
   * GET users
   */
  describe('GET users', function(){

    var userCount;
    var regularUser;

    // create some users
    before(function(doneBefore){
      factory.createUsers(35, function(err, users){
        if (err) return doneBefore(err);

        async.series([
          function(doneEach){
            // change user1 role back to 'subscriber'
            mongoose.model('User').update({_id: user1._id}, {$set: {role: 'subscriber'}}, function(err){
              doneEach(err);
            });
          },function(doneEach){
            mongoose.model('User').count(function(err, count){
              if (err) return doneBefore(err);
              userCount = count;
              doneEach();
            });
          }
        ], doneBefore);

      });
    });

    it('status 401 when not logged in', function(doneIt){
      request(app)
        .get(apiPrefix + '/users')
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

    it('status 401 for non-admin users', function(doneIt){
      request(app)
        .get(apiPrefix + '/users')
        .set('Authorization', user1AccessToken)
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


    it('status 200 for valid data', function(doneIt){

      /* The request */
      request(app)
        .get(apiPrefix + '/users')
        .set('Authorization', admin1AccessToken)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(onResponse);

      /* Verify response */
      function onResponse(err, res) {
        if (err) return doneIt(err);

        /* Check pagination */
        var body = res.body;
        body.should.have.property('count', userCount);
        body.should.have.property('perPage', defaultPerPage);
        body.should.have.property('page', 1);
        body.should.have.property('users');

        /* Check data */
        var data = body.users;
        data.should.have.lengthOf(defaultPerPage);
        mongoose.model('User')
          .find({})
          .sort('name')
          .limit(defaultPerPage)
          .lean()
          .exec(function(err, users){
            if (err) return doneIt(err);
            for (var i = 0; i < defaultPerPage; i++) {

              var user = users[i];

              /* User basic info */
              data[i].should.have.property('_id', user._id.toHexString());
              data[i].should.have.property('name', user.name);
              data[i].should.have.property('email', user.email);
              data[i].should.have.property('role', user.role);
              data[i].should.have.property('registeredAt');
              data[i].should.not.have.property('password');
              data[i].should.not.have.property('salt');
            }
            doneIt();
        });
      }
    });

    it('return 200 and proper page when parameters are passed', function(doneIt){

      var payload = {
        page: 2,
        perPage: 10
      }

      /* The request */
      request(app)
        .get(apiPrefix + '/users')
        .query(payload)
        .set('Authorization', admin1AccessToken)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(onResponse);

      /* Verify response */
      function onResponse(err, res) {
        if (err) return doneIt(err);

        /* Check pagination */
        var body = res.body;
        body.should.have.property('count', userCount);
        body.should.have.property('perPage', payload.perPage);
        body.should.have.property('page', payload.page);
        body.should.have.property('users');

        /* Check data */
        var data = body.users;
        data.should.have.lengthOf(payload.perPage);
        mongoose.model('User')
          .find({})
          .sort('name')
          .limit(payload.perPage)
          .skip(payload.perPage*(payload.page-1))
          .lean()
          .exec(function(err, users){
            if (err) return doneIt(err);
            for (var i = 0; i < payload.perPage; i++) {

              var user = users[i];

              /* User basic info */
              data[i].should.have.property('_id', user._id.toHexString());
              data[i].should.have.property('name', user.name);
              data[i].should.have.property('email', user.email);
              data[i].should.have.property('role', user.role);
              data[i].should.have.property('registeredAt');
              data[i].should.not.have.property('password');
              data[i].should.not.have.property('salt');
            }
            doneIt();
          });
      }
    });
  });


  /*
   * After tests, clear database
   */

  after(mongodb.clearDb);
});
