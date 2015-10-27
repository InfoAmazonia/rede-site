/*
 * Module dependencies
 */
var express = require('express');
var cors = require('cors');
/*
 * Require controllers
 */
var auth = require('../app/controllers/auth');
var users = require('../app/controllers/users');
var account = require('../app/controllers/account');
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
  apiRoutes.param('user_id', users.load);
  apiRoutes.get('/users', [auth.isLogged, auth.isAdmin, users.list]);
  apiRoutes.post('/users', users.new);
  apiRoutes.get('/users/:user_id', [auth.isLogged, auth.isAdmin, users.show]);
  apiRoutes.put('/users/:user_id', [auth.isLogged, auth.isAdmin, users.update]);
  apiRoutes.delete('/users/:user_id', [auth.isLogged, auth.isAdmin, users.remove]);

  // account routes
  apiRoutes.get('/account', [auth.isLogged, account.show]);
  apiRoutes.put('/account', [auth.isLogged, account.update]);

  // parameter routes
  apiRoutes.param('parameter_id', parameters.load);
  apiRoutes.get('/parameters', parameters.list);

  // sensor routes
  apiRoutes.param('sensor_id', sensors.load)
  apiRoutes.get('/sensors', sensors.list);
  apiRoutes.get('/sensors/:sensor_id', sensors.show);
  apiRoutes.post('/sensors', [auth.isLogged, sensors.create]);
  apiRoutes.put('/sensors/:sensor_id', [auth.isLogged, sensors.update]);
  apiRoutes.delete('/sensors/:sensor_id', [auth.isLogged, sensors.remove]);
  apiRoutes.post('/sensors/:sensor_id/subscribe', [auth.isLogged, sensors.subscribe]);
  apiRoutes.post('/sensors/:sensor_id/unsubscribe', [auth.isLogged, sensors.unsubscribe]);
  apiRoutes.get('/sensors/:sensor_id/measurements/:parameter_id.csv', cors(), sensors.csv);

  // measurement route
  apiRoutes.param('measurement_id', measurements.load)
  apiRoutes.post('/measurements/new', measurements.new);
  apiRoutes.get('/measurements', [sensors.loadByQueryString, parameters.loadByQueryStringIfDefined, measurements.list]);
  apiRoutes.get('/measurements/group', [sensors.loadByQueryString, measurements.group]);
  apiRoutes.get('/measurements/aggregate', [sensors.loadByQueryString, parameters.loadByQueryStringIfDefined, measurements.aggregate]);
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
