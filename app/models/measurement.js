/* Module dependencies */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MeasurementSchema = new Schema({
  sensor: { type: Schema.ObjectId, ref: 'Sensor', required: 'missing_sensor'},
  parameter: {type: String, required: 'missing_parameter'},
  unit: {type: String},
  value: Number,
  collectedAt: {type: Date, required: true}
},{
  toJSON: {
    virtuals: true
  }
});

/*
 * Static
 */
MeasurementSchema.static({

  list: function (options, cb) {
    this.find(options.criteria)
      .sort('-collectedAt')
      .select(options.select)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },
  getWqiRating: function(score) {
    if (score >= 90) return 'Excelent';
    else if (score >= 70) return 'Good';
    else if (score >= 50) return 'Average';
    else if (score >= 25) return 'Bad';
    else if (score >= 0) return 'Very Bad';
    else return 'Unavailable';
  }

});

/*
 * Virtuals
 */
MeasurementSchema.virtual('wqi').get(function() {
  var self = this;

  switch (self.parameter) {
    case 'ph':
      return self.phToWqi(self.value);
      break;
    case 'electrical_conductivity':
      return self.ecToWqi(self.value);
      break;
    case 'oxi-reduction_potential':
      return self.orpToWqi(self.value);
      break;
    default:
      return {
        score: null,
        rating: 'Unavailable'
      }
  }
});

/*
 * Methods
 */
MeasurementSchema.methods = {

  list: function (options, cb) {
    this.find(options.criteria)
      .sort('-collectedAt')
      .select(options.select)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },
  phToWqi: function(ph) {
    var self = this;

    var result = {
      score: null,
      rating: 'Unavailable'
    }

    if (ph < 0 || ph > 14)
      result.rating = 'Invalid range'
    else if (ph < 2 || ph > 12)
      result.score = 0;
    else {

      // defines a aproximated curve
      var xInterval = [2.0,3.0,3.5,4.0,4.1,4.5,4.8,5.1,6.2,6.8,7.0,7.1,7.2,7.4,7.6,7.8,8.0,8.9,9.7,10.0,10.3,10.7,10.8,11.0,11.5,12.0];
      var yInterval = [2.0,4.0,6.0,9.0,10.0,15.0,20.0,30.0,60.0,83.0,88.0,90.0,92.0,93.0,92.0,90.0,84.0,52.0,26.0,20.0,15.0,11.0,10.0, 8.0, 5.0, 3.0];

      for (var i = 0; i < xInterval.length; i++) {
        var x0 = xInterval[i];
        var x1 = xInterval[i+1];
        var y0 = yInterval[i];
        var y1 = yInterval[i+1];
        if (x0 <= ph && ph < x1) {
          result.score = (ph == x0) ? y0 : (ph - x0) / (x1 - x0) * (y1 - y0) + y0;
          break;
        }
      }
    }

    if (result.score >= 0)
      result.rating = mongoose.model('Measurement').getWqiRating(result.score);

    return result;
  },
  ecToWqi: function(ec) {
    var self = this;

    var result = {
      score: null,
      rating: 'Unavailable'
    }

    if (ec < 0)
      result.rating = 'Invalid range'
    else if (ec <= 1500)
      result.score = (1500 - ec) / 1500 * 10 + 90;
    else if (ec <= 2000)
      result.score = (2000 - ec) / 500 * 20 + 70;
    else if (ec <= 5000)
      result.score = (5000 - ec) / 3000 * 20 + 50;
    else if (ec <= 7000)
      result.score = (7000 - ec) / 2000 * 25 + 25;
    else
      result.score = 0;

    if (result.score)
      result.rating = mongoose.model('Measurement').getWqiRating(result.score);

    return result;
  },
  orpToWqi: function(orp) {
    var self = this;

    var result = {
      score: null,
      rating: 'Unavailable'
    }

    if (orp < 0)
      result.rating = 'Invalid range'
    else if (orp >= 500)
      result.score = 90;
    else if (orp >= 300)
      result.score = 90 - (500 - orp) / 200 * 20;
    else if (orp >= 150)
      result.score = 70 - (300 - orp) / 150 * 20;
    else if (orp >= 50)
      result.score = 50 - (150 - orp) / 100 * 25;
    else
      result.score = 0;

    if (result.score)
      result.rating = mongoose.model('Measurement').getWqiRating(result.score);

    return result;
  }
};


/* Register */
mongoose.model('Measurement', MeasurementSchema);
