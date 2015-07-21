var _ = require('underscore');
var moment = require('moment');
var mongoose = require('mongoose');
var Sensor = mongoose.model('Sensor')

exports.list = function(req, res) {
  var page = req.query['page'];
  var perPage = req.query['perPage'];

  /* Validate query parameters */
  if (page) {
    if (!validator.isInt(page))
      return res.status(400).json(messaging.error('invalid_pagination'));
    else
      page = parseInt(page) - 1;
  } else page = 0;

  if (perPage){
    if (!validator.isInt(perPage))
      return res.status(400).json(messaging.error('invalid_pagination'));
    else
      perPage = parseInt(perPage);
  } else perPage = 20;

  /* Mongoose Options */
  var options = {
    perPage: perPage,
    page: page
  };

  Sensor.list(options, function (err, sensors) {
    if (err)
      return res.status(500).json(messaging.error('internal_error'));

    /* Send response */
    Sensor.count().exec(function (err, count) {
      res.status(200).json({
        count: count,
        perPage: perPage,
        page: page + 1,
        sensors: sensors
      });
    });
  });
}
