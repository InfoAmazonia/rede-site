/*
 * Module dependencies
 */
var fs = require('fs');
var mongoose = require('mongoose');
var express = require('express');
var passport = require('passport')
var app = express();

/*
 * Load config
 */
var dotenv = require('dotenv').load();
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
 * Setup passport
 */
 require(rootPath + '/config/passport')(passport, config)

/*
 * Setup express
 */
require(rootPath + '/config/express')(app, config, passport)

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
