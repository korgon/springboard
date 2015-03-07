// searchspring springboard
// controller of the spring

module.exports = function() {
	return new springboard();
}();

// strictness!
"use strict";

// include packages
var co = require('co');
var fs = require('mz/fs');
var colors = require('colors');
var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var webshot = require('gulp-webshot');
var git = require('gulp-git');
var s3 = require('gulp-s3-upload');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// local modules
var website = require("./website.js");
//var modules = require("./modules.js"); TBD

function springboard() {
	var self = this;

	/*	_________________
	//
	//	private variables
	//	_________________
	*/

	var config_file = "options.json";
	var version = "1.0.4";

	// watchers (used for gulp)
	var all_seeing_eye = ''; // used for tracking js watch for gulp
	var eye_of_sauron = ''; // used for tracking sass watch for gulp
	var eye_of_horus = ''; // used for tracking html watch for gulp

	// default config options
	var options = {
		version: version,
		user: "",
		mockup_repo: "git@github.com:korgon/searchspring-mockups.git",
		mockup_dir: "searchspring-mockups/",
		current_site: "springdoge",
		port: 1337
	}

	var user = {};
	var sites = {};
	var site = {};

	/*	______________
	//
	//	public methods
	//	______________
	*/

	self.getSites = function() {
		try {
			self.loadSites();
			return sites;
		}
		catch(err) {
			return {'error': err};
		}
	}

	self.getSite = function(asite) {
		if (sites[asite]) {
			return sites[asite];
		} else {
			return {'error': 'site ' + asite + ' not found.'};
		}
	}

	self.options = options;

	self.init = function(conf) {
		// promisified
		return new Promise(function(resolve, reject) {
			console.log();
			console.log('     spr1ngb0ard'.trap.bold.yellow);
			console.log('-----------------------'.bold.grey);
			console.log('    version'.red + ' ['.red + version.red + ']'.red);
			console.log('-----------------------'.bold.grey);
			console.log();

			// check for config file and read it
			if (fs.existsSync(config_file)) {
				//console.log('config file exists!');
				try {
					options = JSON.parse(fs.readFileSync(config_file));
					console.log('...found the configs...'.bold.blue);
					console.log();
					// check for valid options and version
					// TBD
				} catch(err) {
					console.error(err);
				}
			}
			else {
				console.log('...creatings configs...'.bold.blue);
				console.log();
				writeConfig();
			}

			repoInit().then(function() {
				self.loadSites();
				// start browsersync
				startBrowserSync().then(function() {
					return resolve(true);
				}, function(err) {
					console.error('failed to load browsersync: ', err);
					return reject(Error('init fail at browsersync'));
				});
			}, function(err) {
				console.error('failed to load sites: ', err);
				return reject(Error('init fail at loadsites'));
			});
		});
	}

	self.newSite = function(details) {
		// ['name', 'siteid', 'status', 'cart', 'modules']
		// promisified
		console.log('newSite()');
		return new Promise(function(resolve, reject) {
			if (details === undefined) {

				return reject(Error('need more detials.'));
			}
			else {
				// create new branch
				// create new folder
				// create new site object
				// save config
				// git add/commit/push?
				console.log('created '.bold.red + details.name.bold.red);
				return resolve(true);
			}
		});
	}

	self.loadSites = function() {
		// synchronous
		var total = 0;
		var dir_sites = options.mockup_dir + 'sites/';
		process.stdout.write('loading mockups '.bold.red);
		try {
			var folders = fs.readdirSync(dir_sites);
		}
		catch(err) {
			console.error(err);
		}
		// first empty sites variable (to start fresh)
		for (var del in sites) delete sites[del];

		for (var folder of folders) {
			// build out the sites object...
			// with website objects...
			try {
				// fill sites with sites...
				sites[folder] = new website({ folder: dir_sites + folder + '/' });
				if (!sites[folder].valid) {
					delete sites[folder];
					throw(folder);
				}
				else {
					process.stdout.write('.'.bold.red);
					total++;
				}
			}
			catch(err) {
				var errormsg = 'failed to load: ' + err;
				console.log();
				console.error(errormsg.red);
			}
		}
		if (folders)
			console.log(' mockups loaded'.bold.red);
			console.log();
		return;
	}

	self.useSite = function(usethis) {
		// promisified
		return new Promise(function(resolve, reject) {
			//use only valid site in sites
			if (usethis == "**previous_site**") {
				usethis = options.current_site;
			}
			if (sites[usethis]) {
				site = sites[usethis];
				options.current_site = site.name;
				writeConfig();
				console.log('using '.yellow + site.name.yellow);
				/*
				//checkout git branch
				yield new Promise(function(resolve, reject) {
					try {
						git.checkout('site/' + site.name, {cwd: options.mockup_dir}, function (err) {
							if (err) throw err;
							return resolve(true);
						});
					}
					catch(err) {
						return reject(err);
					}
				});
				*/
				// start gulping
				watchSass();
				watchHtml();
				watchJs();
				return resolve(site);
			}
			else {
				return reject(Error(usethis + ' is not a valid site!'));
			}
		});
	}

	/*	_______________
	//
	//	private methods
	//	_______________
	*/

	function writeConfig() {
		try {
			var json_options = JSON.stringify(options, null, 4);
			fs.writeFileSync(config_file, json_options);
		}
		catch(err) {
			console.error('failed to write springboard config: ', err);
		}
		return;
	}

	function repoInit() {
		// promisified
		return new Promise(function(resolve, reject) {
			try {
				if (!(fs.existsSync(options.mockup_dir))) {
					console.log('...gettings the gits...'.bold.blue);
					console.log();
					git.clone(options.mockup_repo, function (err) {
						if (err) throw err;
						return resolve(true);
					});
				} else {
					console.log('...using mockup gits...'.bold.blue);
					console.log('...pull site changes...'.bold.blue);
					console.log();
					return resolve(true);
				}
			}
			catch(err) {
				return reject(err);
			}
		});
	}

	function pullBranch(branch) {
		// pulls down branch
	}

	function publishSite() {
		// promisified
		console.log('...publishing a site...'.bold.blue);

		return new Promise(function(resolve, reject) {
			console.log('published ' + site.name);
			console.log();

			// TBD
			return resolve(true);
		});
	}

	function watchSass() {
		// sass task compile and sync with browser
		gulp.task('sass', function() {
			gulp.src(site.folder + 'scss/*.scss')
			.pipe(sass()).on('error', gutil.log)
			.pipe(rename({basename: site.name}))
			.pipe(gulp.dest(site.folder + 'css/'))
			.pipe(reload({stream: true})).on('error', gutil.log);
		});

		if (eye_of_sauron) {
			// stop the watch
			eye_of_sauron.end();
			// start the watch again
			eye_of_sauron = gulp.watch([site.folder + 'scss/*.scss'], ['sass']);
		} else {
			eye_of_sauron = gulp.watch([site.folder + 'scss/*.scss'], ['sass']);
		}
	}

	function watchHtml() {
		// html reload browser on change
		if (eye_of_horus) {
			// stop the watch
			eye_of_horus.end();
			// start the watch again
			eye_of_horus = gulp.watch(site.folder + '*.html').on('change', reload);
		} else {
			eye_of_horus = gulp.watch(site.folder + '*.html').on('change', reload);
		}
	}

	function watchJs() {
		// js task compile and reload browser
		gulp.task('js', function() {
			gulp.src(site.folder + 'js/*.js')
			// do some browserify or concat stuff here...
			.pipe(jshint()).on('error', gutil.log)
			.pipe(jshint.reporter('default'))
			.pipe(gulp.dest(site.folder + 'js/' + 'dist'))
			.pipe(uglify()).on('error', gutil.log)
			.pipe(rename({extname: '.min.js'}))
			.pipe(gulp.dest(site.folder + 'js/' + 'dist'))
			.pipe(gzip())
			.pipe(rename({extname: '.min.js.gzip'}))
			.pipe(gulp.dest(site.folder + 'js/' + 'dist'));
		});

		if (all_seeing_eye) {
			// stop the watch
			all_seeing_eye.end();
			// start the watch again
			all_seeing_eye = gulp.watch([site.folder + 'js/*.js'], ['js', reload]);
		} else {
			all_seeing_eye = gulp.watch([site.folder + 'js/*.js'], ['js', reload]);
		}
	}

	function startBrowserSync() {
		// promisified
		console.log('...browsersyncifying...'.bold.blue);
		console.log();
		return new Promise(function(resolve, reject) {
			try {
				browserSync({
					ui: false,							// start with ui?
					notify: false,						// show browser notifications?
					port: self.options.port,			// port number
					online: false,						// online features?
					open: false,						// open browser on start?
					logLevel: "silent",					// silencio!
					proxy: "localhost:" + (self.options.port + 1)
				}, function() {
					// callback function after browsersync loads
					return resolve(true);
				});
			}
			catch(err) {
				return reject(err);
			}
		});
	}
}
