/*
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ParameterSchema = new Schema({
  _id: {type: String, required: true},
  abbreviations: [String],
  defaultUnit: String,
  wikipedia: String
});

/* Register */
mongoose.model('Parameter', ParameterSchema);
