/*
 * Module dependencies
 */
var express = require('express');

/*
 * Require controllers
 */
var auth = require('../app/controllers/auth');
var users = require('../app/controllers/users');
var sensors = require('../app/controllers/sensors');
var measurements = require('../app/controllers/measurements');
var parameters = require('../app/controllers/parameters');

/*
 * Setup routes
 */
module.exports = function (app, config) {

  /*
   * API routes
   */
  var apiRoutes = require('express').Router();

  // authorization routes
  apiRoutes.post('/login', auth.login);
  apiRoutes.get('/logout', auth.logout);

  // user routes
  // apiRoutes.param('user_id', users.load);
  apiRoutes.post('/users', users.new);
  // apiRoutes.put('/users/:id', [auth.isLogged, auth.canUpdateUser, users.update]);
  // apiRoutes.get('/users/:id', users.get);
  // apiRoutes.get('/users', users.list);

  // parameter routes
  apiRoutes.get('/parameters', parameters.list);

  // sensor routes
  apiRoutes.param('sensor_id', sensors.load)
  apiRoutes.get('/sensors', sensors.list);
  apiRoutes.get('/sensors/:sensor_id', sensors.show);
  apiRoutes.post('/sensors', [auth.isLogged, sensors.create]);
  apiRoutes.put('/sensors/:sensor_id', [auth.isLogged, sensors.update]);
  apiRoutes.delete('/sensors/:sensor_id', [auth.isLogged, sensors.remove]);
  apiRoutes.get('/sensors/:sensor_id/score', sensors.score);
  apiRoutes.post('/sensors/:sensor_id/subscribe', [auth.isLogged, sensors.subscribe]);
  apiRoutes.post('/sensors/:sensor_id/unsubscribe', [auth.isLogged, sensors.unsubscribe]);

  // measurement route
  apiRoutes.param('measurement_id', measurements.load)
  apiRoutes.post('/measurements/batch', measurements.saveBatch);
  apiRoutes.get('/measurements', [sensors.loadByQueryString, parameters.loadByQueryStringIfDefined, measurements.list]);
  // apiRoutes.put('/mueasurements', mueasurements.update);
  apiRoutes.delete('/measurements/:measurement_id', [auth.isLogged, auth.isAdmin, measurements.remove]);

  // set api routes
  app.use(config.apiPrefix, apiRoutes);

  /*
   * Client app routes
   */
  app.use('/', express.static(config.rootPath + '/public'));
  app.get('/*', function(req, res) {
    res.sendFile(config.rootPath + '/public/views/index.html');
  });
}
