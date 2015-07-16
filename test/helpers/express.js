var request = require('supertest');
var should = require('should');
var mongoose = require('mongoose');
var app = require('../../app.js');


/**
 * Wait mongoose to be ready to start calling the API
 **/
exports.whenReady = function(done){
	if (mongoose.connection.readyState != 1)
		mongoose.connection.on('open', done);
	else
		done();
}
