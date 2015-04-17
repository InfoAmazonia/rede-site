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