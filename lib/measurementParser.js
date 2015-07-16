var _ = require('underscore');

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
      parameter: parameter,
      unit: unit,
      value: value
    })
  });

  return measurements;
}
