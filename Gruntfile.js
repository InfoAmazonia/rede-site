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
					'public/css/app.css': 'src/css/main.less',
					'public/css/report.css': 'src/css/report.less'
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
			},
			intlTelInput: {
				files: [
					{
						cwd: 'node_modules/intl-tel-input/build',
						src: ['**'],
						dest: 'public/lib/intl-tel-input',
						expand: true
					},
					{
						cwd: 'node_modules/intl-tel-input/lib/libphonenumber/build',
						src: 'utils.js',
						dest: 'public/lib/intl-tel-input',
						expand: true
					}
				]
			},
			pickadate: {
				files: [
					{
						cwd: 'node_modules/angular-pickadate/src',
						src: ['**'],
						dest: 'public/lib/angular-pickadate',
						expand: true
					}
				]
			},
			markercluster: {
				files: [
					{
						cwd: 'node_modules/leaflet.markercluster/dist',
						src: ['*.css'],
						dest: 'public/lib/leaflet.markercluster',
						expand: true
					}
				]
			},
			ngDialog: {
				files: [
					{
						cwd: 'node_modules/ng-dialog/css',
						src: ['**'],
						dest: 'public/lib/ng-dialog',
						expand: true
					}
				]
			}
		},
		nggettext_extract: {
			pot: {
				files: {
					'po/template.pot': ['public/views/**/*.html', 'src/js/**/*.js', '!src/js/translations.js']
				}
			}
		},
		nggettext_compile: {
			all: {
				options: {
					module: 'rede'
				},
				files: {
					'src/js/translations.js': ['po/*.po']
				}
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
				tasks: ['jade', 'nggettext_extract']
			},
			scripts: {
				files: ['src/js/**/*.js', '!src/js/translations.js'],
				tasks: ['browserify', 'nggettext_extract']
			},
			copy: {
				files: ['src/**', '!src/**/*.less', '!src/**/*.jade', '!src/**/*.js'],
				tasks: ['copy']
			},
			translations: {
				files: 'po/**/*.po',
				tasks: ['nggettext_compile', 'browserify']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-jade');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-angular-gettext');
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
		var daysOfObservation = 90;
		var measurementsInterval = 1;

		if (env == 'production') {
			console.log('Populate task on production environments is not allowed.');
			done();
		} else {
			console.log('Populating database with '+daysOfObservation+' days of data for '+sensorCount+' sensors, please wait...');
			mongodb.clearDb(function(err){
				if (err) return done(err);
				else factory.createSensorsWithMeasurements({
					numberOfSensors: sensorCount,
					days: daysOfObservation,
					interval: measurementsInterval
				}, done);
			});
		}

	});

	grunt.registerTask(
		'javascript',
		'Compile scripts.',
		['browserify', 'uglify']
	);

	grunt.registerTask(
		'views',
		'Compile views.',
		['jade', 'less', 'copy', 'nggettext_extract']
	);

	grunt.registerTask(
		'files',
		'Copy files.',
		['copy']
	);

	grunt.registerTask(
		'build',
		'Compiles everything.',
		['nggettext_compile', 'javascript', 'views']
	);

	grunt.registerTask(
		'default',
		'Build, start server and watch.',
		['build', 'watch']
	);

}
