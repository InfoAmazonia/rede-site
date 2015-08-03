var request = require('supertest');
var should = require('should');
var mongoose = require('mongoose');
var app = require('../../app.js');


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
