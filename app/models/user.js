
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
	role: { type: String, enum: ['admin', 'subscriptor'], default: 'subscriptor'},
	name: { type: String},
	email: { type: String, required: 'missing_email', validate: [validator.isEmail, 'invalid_email'] },
	emailConfirmed: {type: Boolean, default: false},
	token: { type: String },
	hashed_password: {type: String, required: 'missing_password'},
	salt: { type: String, default: '' },
	updatedAt: Date,
	registeredAt: {type: Date, default: Date.now}
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

	/**
	 * Send reset password token if not using OAuth
	 */

	sendResetToken: function() {
		var
			Token = mongoose.model('Token'),
			self = this,
			token;


		if (self.doesNotRequireValidation){
			var seed = crypto.randomBytes(20);
			var id = crypto.createHash('sha1').update(seed).digest('hex');

			token = new Token({
				_id: id,
				user: self,
				expiresAt: moment().add('hour', 1).toDate()
			}).save();
		}
	},

	sendEmailConfirmation: function(newEmail) {
		// TODO: Expire all prior e-mail confirmations

		var self = this;
		var Token = mongoose.model('Token');
		var seed = crypto.randomBytes(20);
		var token = new Token({user: self._id, type: 'email_confirmation'});
		token._id = crypto.createHash('sha1').update(seed).digest('hex');

		// keep new e-mail address for e-mail changes
		if (newEmail) token.data = {newEmail: newEmail};

		token.save(function(err) {
			if (err)
				return res.json(401, messaging.mongooseErrors('access_token.error'));

			client.sendEmail({
				"From": 'cidadescomestiveis@muda.org.br',
				"ReplyTo": 'naoresponda@muda.org.br',
				"To": self.email,
				"Subject": 'Confirme seu e-mail',
				"TextBody": 'Para acessar o Cidades Comestíveis, confirmar seu e-mail no visitando o link:\n\n'
											+ process.env.APP_URL + '/token/' + token._id
			}, function(err, success){
				if (err) console.log('error while sending e-mail confirmation');
			})
		})
	},
}


/**
 * Statics
 */

UserSchema.static({

	list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .sort('name') // sort by date
			.select('_id name')
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

})

/**
 * Register
 */

mongoose.model('User', UserSchema)
