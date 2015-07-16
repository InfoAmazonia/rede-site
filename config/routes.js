/*
 * Module dependencies
 */
var express = require('express');

/*
 * Require controllers
 */
var measurements = require('../app/controllers/measurements')

/*
 * Setup routes
 */
module.exports = function (app, config) {

  /*
   * Measurement routes
   */
  app.post('/api/v1/measurements', measurements.saveBatch);

  /*
   * Client app routes
   */
  app.use('/', express.static(__dirname + '/public'));
  app.get('/*', function(req, res) {
  	res.sendfile('public/views/index.html');
  });
}
