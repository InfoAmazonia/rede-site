
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

/**
 * User schema
 */

var TokenSchema = new Schema({
	_id: { type: String },
	expired: {type: Boolean, default: false},
	createdAt: {type: Date, default: Date.now},
	expiresAt: {type: Date, required: true, default: moment().add(15, 'day').toDate() },
	user: { type: Schema.ObjectId, ref: 'User' },
	type: {type: String, enum: ['access', 'email_confirmation'], required: true},
	data: {}
});

/**
 * Virtuals
 **/

TokenSchema.virtual('isValid').get(function() {
	return (this.expired) || (this.expiresAt > Date.now);
});

/**
 * Statics
 */

TokenSchema.statics = {

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('user')
			.exec(cb)
	},

}

/**
 * Register
 */

mongoose.model('Token', TokenSchema);
