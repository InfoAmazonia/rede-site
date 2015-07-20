/* Module dependencies */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MeasurementSchema = new Schema({
  sensor: { type: Schema.ObjectId, ref: 'Sensor', required: 'missing_sensor'},
  parameter: {type: String, ref: 'Parameter', required: 'missing_parameter'},
  unit: {type: String},
  value: Number,
  collectedAt: {type: Date, required: true}
});

/* Register */
mongoose.model('Measurement', MeasurementSchema);
