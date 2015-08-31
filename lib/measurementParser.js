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


function abbreviationToParameter(abbrev){
  var parameter = _.find(parameters, function(p){
    return _.contains(p.abbreviations, abbrev);
  });

  return parameter || {
    _id: abbrev,
    name: { en: abbrev, pt: abbrev, es: abbrev },
    abbreviations: [ abbrev ],
    defaultUnit: null
  };
}

exports.parseBatch = function(text){
  var measurements = [];

  if (text.length == 0) throw "Batch string is empty.";

  var data = text.split(';');
  var collectedAt = data.shift();

  if (!validator.isISO8601(collectedAt)) throw "Invalid timestamp.";

  // ignore timezone
  collectedAt = moment(collectedAt, moment.ISO_8601).format('YYYY-MM-DDTHH:mm:ss') + 'Z';
  collectedAt = moment(collectedAt, moment.ISO_8601).toDate();

  if ((data.length < 1) || (data[0] == '')) throw "Missing measurements.";

  _.each(data, function(str){
    str = str.split('=');
    if (str.length != 2) throw "Invalid measurement.";
    var parameter = str[0].split(':');


    var value = str[1];
    if (validator.isNull(value)) throw "Missing value.";
    value = parseFloat(value);

    var unit = (parameter.length > 1) ? parameter[1] : null;
    parameter = abbreviationToParameter(parameter[0]);

    if (validator.isNull(parameter)) throw "Missing parameter.";

    measurements.push({
      collectedAt: collectedAt,
      parameter: parameter,
      unit: unit || parameter.defaultUnit,
      value: value
    })
  });

  return measurements;
}
