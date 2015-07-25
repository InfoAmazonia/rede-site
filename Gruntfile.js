/*
 * Module dependencies
 */
var async = require('async');

/*
 * Load config
 */
var dotenv = require('dotenv').load();
var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
/*
 * Export module
 */
module.exports = function(grunt) {

	grunt.initConfig({
		browserify: {
			all: {
				options: {
					transform: ['browserify-shim']
				},
				files: {
					'public/app.js': 'src/js/index.js'
				}
			}
		},
		uglify: {
			all: {
				options: {
					mangle: true,
					compress: true
				},
				files: {
					'public/app.js': 'public/app.js',
				}
			}
		},
		less: {
			all: {
				options: {
					compress: true
				},
				files: {
					'public/css/app.css': 'src/css/main.less'
				}
			}
		},
		jade: {
			all: {
				options: {
					doctype: 'html'
				},
				files: [{
					expand: true,
					cwd: 'src',
					src: ['**/*.jade', '!views/includes/**/*'],
					dest: 'public',
					ext: '.html'
				}]
			}
		},
		copy: {
			all: {
				files: [
					{
						cwd: 'src',
						src: ['**', '!js/**', '!**/*.less', '!**/*.jade', '!**/*.js'],
						dest: 'public',
						expand: true
					}
				]
			},
			mapbox: {
				files: [
					{
						cwd: 'node_modules/mapbox.js/theme',
						src: ['**'],
						dest: 'public/lib/mapbox',
						expand: true
					}
				]
			}
		},
		watch: {
			options: {
				livereload: true
			},
			css: {
				files: 'src/css/**/*.less',
				tasks: ['less']
			},
			jade: {
				files: 'src/views/**/*.jade',
				tasks: ['jade']
			},
			scripts: {
				files: 'src/js/**/*.js',
				tasks: ['browserify']
			},
			copy: {
				files: ['src/**', '!src/**/*.less', '!src/**/*.jade', '!src/**/*.js'],
				tasks: ['copy']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-jade');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('populate','Populate application with mock data',function(){
		var done = this.async();

		var mongoose = require('mongoose');
		mongoose.connect(config.db);

		require('./app/models/sensor');
		require('./app/models/measurement');
		require('./app/models/user');

		var factory = require('./lib/helpers/factory');
		var mongodb = require('./lib/helpers/mongodb');

		var sensorCount = 10;
		var daysOfObservation = 20;

		console.log('Populating database with '+daysOfObservation+' days of data for '+sensorCount+' sensors, please wait...');
		mongodb.clearDb(function(err){
			if (err) return done(err);
			else factory.createSensorsWithMeasurements(sensorCount, daysOfObservation, done);
		});
	});

	grunt.registerTask(
		'javascript',
		'Compile scripts.',
		['browserify', 'uglify']
	);

	grunt.registerTask(
		'views',
		'Compile views.',
		['jade', 'less', 'copy']
	);

	grunt.registerTask(
		'files',
		'Copy files.',
		['copy']
	);

	grunt.registerTask(
		'build',
		'Compiles everything.',
		['javascript', 'views']
	);

	grunt.registerTask(
		'default',
		'Build, start server and watch.',
		['build', 'watch']
	);

}
