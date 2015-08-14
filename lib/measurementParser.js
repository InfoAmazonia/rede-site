/*
 * Module dependencies
 */
var _ = require('underscore');
var validator = require('validator');

/*
 * Load config
 */
var env = process.env.NODE_ENV || 'development'
var config = require('../config')[env]
var parameters = config.parameters;
var moment = require('moment');
var validator = require('validator');


function abbreviationToParameterId(abbrev){
  return _.find(parameters, function(p){
    return _.contains(p.abbreviations, abbrev);
  })
}

exports.parseBatch = function(text){
  var measurements = [];

  if (text.length == 0) throw "measurements.data_string.empty";

  var data = text.split(';');
  var collectedAt = data.shift();

  if (!validator.isISO8601(collectedAt)) throw "measurements.data_string.invalid_timestamp";
  if ((data.length < 1) || (data[0] == '')) throw "measurements.data_string.missing_measurements";

  _.each(data, function(str){
    str = str.split('=');
    if (str.length != 2) throw "measurements.data_string.malformed_measurement";
    var parameter = str[0].split(':');

    var value = str[1];
    if (!value) throw "measurements.data_string.malformed_measurement";
    value = parseFloat(value);

    var unit = (parameter.length > 1) ? parameter[1] : null;
    parameter = parameter[0];

    if (!value) throw "measurements.data_string.malformed_measurement";

    measurements.push({
      collectedAt: collectedAt,
      parameter: abbreviationToParameterId(parameter),
      unit: unit,
      value: value
    })
  });

  return measurements;
}
