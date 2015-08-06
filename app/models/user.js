
/*!
 * Module dependencies
 */

var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var moment = require('moment');
var validator = require('validator');

/**
 * User schema
 */

var UserSchema = new Schema({
	role: { type: String, enum: ['admin', 'subscriber'], default: 'subscriber'},
	name: { type: String},
	email: { type: String, required: 'missing_email', validate: [validator.isEmail, 'invalid_email'] },
	emailConfirmed: {type: Boolean, default: false},
	phoneNumber: String,
	token: { type: String },
	hashed_password: {type: String, required: 'missing_password'},
	salt: { type: String, default: '' },
	updatedAt: Date,
	registeredAt: {type: Date, default: Date.now},
	subscribedToSensors: [{type: Schema.ObjectId, ref: 'Sensor'}]
});

/**
 * Virtuals
 */

UserSchema
	.virtual('password')
	.set(function(password) {
		this._password = password
		this.salt = this.makeSalt()
		this.hashed_password = this.encryptPassword(password)
	})
	.get(function() { return this._password });


/**
 * Validations
 */

UserSchema.path('email').validate(function (email, done) {
	var User = mongoose.model('User')

	// Check only when it is a new user or when email field is modified
	if (this.isNew || this.isModified('email')) {
		User.find({ email: email }).exec(function (err, users) {
			done(!err && users.length === 0)
		})
	} else done(true);
}, 'email_already_registered');

UserSchema.path('hashed_password').validate(function(v) {
	var self = this;
  if (self._password && (self._password.length < 6)) {
    self.invalidate('password', 'short_password');
  }

  if (self.isNew && !self._password) {
    self.invalidate('password', 'missing_password');
  }
}, null);

/** Pre/Post middleware */

UserSchema.pre('save', function(next){
	var self = this;
	if (self.isNew) {
		mongoose.model('User').count(function(err, count){
			if (err) return next(err);
			if (count == 0) {
				self.role = 'admin';
				self.emailConfirmed = true;
			}
			next();
		});
	} else next();
});

/**
 * Methods
 */

UserSchema.methods = {

	/**
	 * Authenticate - check if the passwords are the same
	 *
	 * @param {String} plainText
	 * @return {Boolean}
	 * @api public
	 */

	authenticate: function (plainText) {
		return this.encryptPassword(plainText) === this.hashed_password
	},

	/**
	 * Make salt
	 *
	 * @return {String}
	 * @api public
	 */

	makeSalt: function () {
		return Math.round((new Date().valueOf() * Math.random())) + ''
	},

	/**
	 * Encrypt password
	 *
	 * @param {String} password
	 * @return {String}
	 * @api public
	 */

	encryptPassword: function (password) {
		if (!password) return ''
		var encrypred
		try {
			encrypred = crypto.createHmac('sha1', this.salt).update(password).digest('hex')
			return encrypred
		} catch (err) {
			return ''
		}
	},

	privateInfo: function() {
		var info = {
			_id: this._id,
			name: this.name,
			email: this.email,
			phoneNumber: this.phoneNumber,
			emailConfirmed: this.emailConfirmed,
			subscribedToSensors: this.subscribedToSensors,
			role: this.role,
			registeredAt: this.registeredAt
		};

		return info;
	}
}


/**
 * Statics
 */

UserSchema.static({

	list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .sort('name') // sort by date
			.select('_id name email phoneNumber role registeredAt')
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

})

/**
 * Register
 */

mongoose.model('User', UserSchema)
