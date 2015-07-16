var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var env = process.env.NODE_ENV || 'development';

module.exports = function (app, config) {

  // bodyParser should be above methodOverride
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(methodOverride(function (req, res) {
  	if (req.body && typeof req.body === 'object' && '_method' in req.body) {
  		// look in urlencoded POST bodies and delete it
  		var method = req.body._method;
  		delete req.body._method;
  		return method;
  	}
  }));

}
