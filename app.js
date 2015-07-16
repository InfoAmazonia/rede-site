/*
 * Module dependencies
 */
var fs = require('fs');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var express = require('express');
var app = express();

/*
 * Load config
 */
var env = process.env.NODE_ENV || 'development'
var config = require('./config')[env]
var rootPath = config.rootPath

/*
 * Connect to MongoDB
 */
mongoose.connect(config.db);

/*
 * Load models
 */
fs.readdirSync(rootPath + '/app/models').forEach(function (file) {
  if (~file.indexOf('.js')) require(rootPath + '/app/models/' + file)
})

/*
 * Setup express
 */
require(rootPath + '/config/express')(app, config)

/*
 * Setup routes
 */
require(rootPath+ '/config/routes')(app, config)

/*
 * Start app
 */
var port = process.env.PORT || 3000
app.listen(port)
console.log('Express app started on port ' + port)

/*
 * Expose app
 */
module.exports = app;
