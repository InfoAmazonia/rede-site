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

/**
 * Helper function to log in a user
 **/
exports.login = function(email, password, callback){
	request(app)
		.post('/api/v1/login')
		.send({ email: email, password: password })
		.end(function(err, res){
			if (err) return callback(err);
			should(res).have.property('status', 200);
			should.exist(res.body.accessToken);
			callback(null, 'Bearer '+ res.body.accessToken);
		});
}
