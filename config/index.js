var apiPrefix = '/api/v1';
var path = require('path');
var rootPath = path.resolve(__dirname + '../..');

/**
* Expose config
*/

module.exports = {
	development: {
		rootPath: rootPath,
		apiPrefix: apiPrefix,
		db: 'mongodb://localhost/rede_dev'
	},
	test: {
		rootPath: rootPath,
		apiPrefix: apiPrefix,
		db: 'mongodb://localhost/rede_test'
	},
	production: {
		rootPath: rootPath,
		apiPrefix: apiPrefix,
		db: process.env.MONGO_URI || 'mongodb://localhost/rede_production'
	}
}
