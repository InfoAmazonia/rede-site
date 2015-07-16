var _ = require('underscore');
var moment = require('moment');
var mongoose = require('mongoose');
var Sensor = mongoose.model('Sensor')

exports.saveBatch = function(req, res) {
  var body = req.body;

  var data = req.body.data;
  if (!data) return res.status(400).json({messages: ['missing data parameter']});

  Sensor.loadByPhoneNumber(body.phoneNumber, function(err, sensor){
    if (err) return res.sendStatus(500);
    sensor.saveMeasurementBatch(body.data, function(err, measurements){
      if (err) return res.sendStatus(500);
      else res.status(200).json({measurements: measurements});
    });
  });
}
