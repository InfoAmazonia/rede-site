/*
 * Module dependencies
 */
var _ = require('underscore');

/*
 * Load config
 */
var env = process.env.NODE_ENV || 'development'
var config = require('../config')[env]
var parameters = config.parameters;

function abbreviationToParameterId(abbrev){
  return _.find(parameters, function(p){
    return _.contains(p.abbreviations, abbrev);
  })
}

exports.parseBatch = function(text){
  var measurements = [];
  var data = text.split(';');
  var collectedAt = data.shift();

  _.each(data, function(str){
    str = str.split('=');
    var parameter = str[0].split(':');
    var value = str[1];
    var unit = (parameter.length > 1) ? parameter[1] : null;
    parameter = parameter[0];

    measurements.push({
      collectedAt: collectedAt,
      parameter: abbreviationToParameterId(parameter),
      unit: unit,
      value: value
    })
  });

  return measurements;
}
