var apiPrefix = '/api/v1';
var path = require('path');
var rootPath = path.resolve(__dirname + '../..');
var parameters = {
  "atmospheric_pressure": {
    "_id": "atmospheric_pressure",
    "name": {
        "en": "Atmospheric pressure",
        "pt": "Pressão atmosférica",
    },
    "abbreviations": ["AP"],
    "defaultUnit": "Pa",
    "wikipedia": "https://en.wikipedia.org/wiki/Atmospheric_pressure"
  },
  "electrical_conductivity": {
    "_id": "electrical_conductivity",
    "name": {
      "en": "Electrical conductivity",
      "pt": "Condutividade elétrica",
    },
    "abbreviations": ["EC"],
    "defaultUnit": "S/m",
    "wikipedia": "https://en.wikipedia.org/wiki/Electrical_resistivity_and_conductivity"
  },
  "ph": {
    "_id": "ph",
    "name": {
      "en": "pH",
      "pt": "pH"
    },
    "abbreviations": ["pH"],
    "wikipedia": "https://en.wikipedia.org/wiki/PH"
  },
  "oxi-reduction_potential": {
    "_id": "oxi-reduction_potential",
    "name": {
      "en": "Oxi-reduction potential",
      "pt": "Potencial de oxi-redução"
    },
    "abbreviations": ["ORP"],
    "defaultUnit": "V",
    "wikipedia": "https://en.wikipedia.org/wiki/Reduction_potential"
  },
  "water_temperature": {
    "_id": "water_temperature",
    "name": {
      "en": "Water temperature",
      "pt": "Temperatura da água"
    },
    "abbreviations": ["Tw"],
    "defaultUnit": "C"
  },
  "ambient_temperature": {
    "_id": "ambient_temperature",
    "name": {
      "en": "Ambient temperature",
      "pt": "Temperatura ambiente"
    },
    "abbreviations": ["Ta"],
    "defaultUnit": "C"
  },
  "relative_humidity": {
    "_id": "relative_humidity",
    "name": {
      "en": "Relative humidity",
      "pt": "Humidade relativa"
    },
    "abbreviations": ["Tw"],
    "defaultUnit": "%",
    "wikipedia": "https://en.wikipedia.org/wiki/Relative_humidity"
  }
};

/**
* Expose config
*/

module.exports = {
	development: {
		rootPath: rootPath,
		apiPrefix: apiPrefix,
		parameters: parameters,
		db: 'mongodb://localhost/rede_dev'
	},
	test: {
		rootPath: rootPath,
		apiPrefix: apiPrefix,
		parameters: parameters,
		db: 'mongodb://localhost/rede_test'
	},
	production: {
		rootPath: rootPath,
		apiPrefix: apiPrefix,
		parameters: parameters,
		db: process.env.MONGO_URI || 'mongodb://localhost/rede_production'
	}
}
