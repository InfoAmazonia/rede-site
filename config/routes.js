/*
 * Module dependencies
 */
var express = require('express');

/*
 * Require controllers
 */
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

  // parameter routes
  apiRoutes.get('/parameters', parameters.list);

  // sensor routes
  apiRoutes.param('sensor_id', sensors.load)
  apiRoutes.get('/sensors', sensors.list);
  apiRoutes.get('/sensors/:sensor_id', sensors.show);
  // apiRoutes.put('/sensors', sensors.update);
  // apiRoutes.del('/sensors', sensors.remove);

  // measurement route
  apiRoutes.post('/measurements/batch', measurements.saveBatch);
  apiRoutes.get('/measurements', [sensors.loadByQueryString, parameters.loadByQueryString, measurements.list]);
  // apiRoutes.put('/mueasurements', mueasurements.update);
  // apiRoutes.del('/mueasurements', mueasurements.remove);
  app.use(config.apiPrefix, apiRoutes);

  /*
   * Client app routes
   */
  app.use('/', express.static(config.rootPath + '/public'));
  app.get('/*', function(req, res) {
    res.sendFile(config.rootPath + '/public/views/index.html');
  });
}
