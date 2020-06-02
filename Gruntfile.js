module.exports = function(grunt){
	'use strict';

	grunt.initConfig({

		//basic setting and info about plugins
		pkg: grunt.file.readJSON('package.json'),

		// Setting folder templates.
		dirs: {
			js: 'assets/js/',    //<%= dirs.js %>
			css: 'assets/css',   //<%= dirs.css %>
			sass: 'assets/scss',  //<%= dirs.sass %>
		},

		//sass
		sass:{

			frontend:{
				option:{
					style:'expanded',
					noCache: false,
				},
				files:{
					'<%= dirs.css %>/style.css': ['<%= dirs.sass %>/main.scss'],
				}
			},

		},
		//auto prefix
		postcss: {
			options: {
				map: true, // inline sourcemaps
				safe: true,

				processors: [
					require('autoprefixer')({ overrideBrowserslist: 'last 3 versions' }), // add vendor prefixes
				]
			},
			dist: {
				src: '<%= dirs.css %>/style.css'
			}
		},
		//css minify
		cssmin: {
			mainStyles: {
				files:{
					'<%= dirs.css %>/style.min.css': ' <%= dirs.css %>/style.css',
				}
			},
		},
		// Uglify JS.
		uglify: {
			forntend_js:{
				options: {
					sourceMap: true,
					mangle: true
				},
				files:{
					'<%= dirs.js %>/acmeticker.min.js': '<%= dirs.js %>/acmeticker.js',
					'<%= dirs.js %>/jquery.min.js': '<%= dirs.js %>/jquery.js',
				}

			},
		},

		//grunt watch
		watch: {

			css: {
				files: ['<%= dirs.sass %>/**/*.scss'],
				tasks: [
					'sass',
					'cssmin',
					'postcss',
					'notify_hooks'
				]
			},
			options: {
				reload: true
			}


		},

		// This is optional!
		notify_hooks: {
			options: {
				enabled: true,
				max_jshint_notifications: 2, // maximum number of notifications from jshint output
				title: "Compile Complete", // defaults to the name in package.json, or will use project directory's name
				success: true, // whether successful grunt executions should be notified automatically
				duration: 1 // the duration of notification in seconds, for `notify-send only
			}
		},


	});

	//load plugins

	// Load NPM tasks to be used here
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-autoprefixer');
	grunt.loadNpmTasks('grunt-postcss');
	grunt.loadNpmTasks('grunt-contrib-uglify-es');
	grunt.loadNpmTasks( 'grunt-contrib-cssmin' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-contrib-sass' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks('grunt-notify');
	grunt.registerTask('clean',
	'Deletes the working folder and its contents', function () {
		//grunt.config.requires('copyFiles.options.workingDirectory');

		grunt.file.delete(grunt.config.get('clean.build.src'));
	});
	// Register tasks
	grunt.registerTask('default', ['sass', 'cssmin', 'uglify','postcss'] );
	grunt.registerTask('css', ['sass', 'cssmin', 'postcss'] );
	grunt.registerTask('js', ['uglify'] );
	grunt.task.run('notify_hooks');

};