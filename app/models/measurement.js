/* Module dependencies */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MeasurementSchema = new Schema({
  sensor: { type: Schema.ObjectId, ref: 'Sensor', required: 'missing_sensor'},
  parameter: {type: String, required: 'missing_parameter'},
  unit: {type: String},
  value: Number,
  collectedAt: {type: Date, required: true}
});

/*
 * Methods
 */
MeasurementSchema.static({

  list: function (options, cb) {
    this.find(options.criteria)
      .sort('_id')
      .select(options.select)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
});

/* Register */
mongoose.model('Measurement', MeasurementSchema);
