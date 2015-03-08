// searchspring springboard
// controller of the spring

// strictness!
"use strict";

// include packages
var co = require('co');
var fs = require('fs-extra');
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


module.exports = function() {
	return new springboard();
}();

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
		current_site: "springdoge",
		port: 1337
	}
	var mockup_dir = "searchspring-mockups/";
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
		// promisified
		return new Promise(function(resolve, reject) {
			if (details.name === undefined) {
				return reject(Error('cannot create site: need more detials.'));
			}
			else {
				// check if site already exists
				if (fs.existsSync(up_dir + 'sites/' + details.name)) {
					return reject(Error('cannot create site: site exists.'));
				}
				// create new branch and switch to it
				git.checkout('site/' + details.name, {cwd: mockup_dir, args: '-b'}, function (err) {
					if (err) {
						return reject(err);
					}
					// create new folder
					var site_folder = mockup_dir + 'sites/' + details.name;

					// copy over templates
					fs.copy(mockup_dir + 'templates/scss/' + details.template, site_folder + '/scss', function(err) {
						if (err)
							return reject('failed to copy scss templates: ' + err);

						fs.copy(mockup_dir + 'templates/js/config.js', site_folder + '/js/' + details.name + '.js', function(err) {
							if (err)
								return reject('failed to copy js templates: ' + err);

							// create html file with init script tags inside
							try {
								var scripts = '<script type="text/javascript" src="js/' + details.name +'.js">';
								scripts += '</script>\n<script>\n\tSearchSpring.Catalog.init(Searchspring.initOptions);\n</script>';
								fs.writeFileSync(site_folder + '/' + details.name + '.html', scripts);
							}
							catch(err) {
								console.log('failed to create html document');
								return reject(err);
							}


							// create new site object
							try {
								details.folder = site_folder;
								details.status = 'mockup';
								sites[details.name] = new website(details);
								site = sites[details.name];
								if (!sites[details.name].valid) {
									delete sites[details.name];
									throw(details.name);
								}
							}
							catch(err) {
								var errormsg = 'failed to create: ' + err;
								return reject(errormsg);
							}

							// push new branch
							// some crazy shit with add/commit/push...
							repoAdd()
							.then(function() {
								repoCommit('Springboard: initial commit')
								.then(function() {
									repoPush()
									.then(function() {
										console.log('created '.bold.red + details.name.bold.red);
										self.useSite(site.name).then(function() {
											return resolve(true);
										});
									}, function() {
										return reject('Failed to push files to the repo...');
									});
								}, function() {
									return reject('Failed to commit files to the repo...');
								});
							}, function() {
								return reject('Failed to add files to the repo...');
							});
						});
					});
				});
			}
		});
	}

	self.loadSites = function() {
		// synchronous
		var total = 0;
		var dir_sites = mockup_dir + 'sites/';
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
			// ignore non directories...
			if (!fs.lstatSync(dir_sites + folder).isDirectory())
				continue;
			// build out the sites object...
			// with website objects...
			try {
				// fill sites with sites...
				sites[folder] = new website({ name: folder, directory: dir_sites + folder });
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
		// promisified function that returns a site object

		// first it saves site selection to config
		// then it pulls the site from repo
		// then it checks out the site branch
		// then it starts watching for edits to that site
		return new Promise(function(resolve, reject) {
			//use only valid site in sites
			if (usethis == "**previous_site**") {
				usethis = options.current_site;
			}
			if (sites[usethis]) {
				site = sites[usethis];
				options.current_site = site.name;
				writeConfig();

				site.checkout()
				.then(function() {
					site.pull().then(function() {
						console.log('using '.yellow + site.name.yellow);
						// start gulping
						watchSass();
						watchHtml();
						watchJs();
						return resolve(site);
					}, function(err) {
						console.error('failed to pull repository', err);
						return reject(Error('repoInit failed to pull repository'));
					});
				})
				.catch(function(err) {
					console.error(err);
				})
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
				if (!(fs.existsSync(mockup_dir))) {
					console.log('...gettings the gits...'.bold.blue);
					console.log();
					git.clone(options.mockup_repo, function (err) {
						if (err) throw err;
						// checkout develop
						git.checkout('develop', {cwd: mockup_dir}, function (err) {
							if (err) {
								return reject(err);
							}
							return resolve(true);
						});
					});
				} else {
					console.log('...using mockup gits...'.bold.blue);
					git.checkout('develop', {cwd: mockup_dir}, function (err) {
						if (err) {
							return reject(err);
						}
						git.pull('origin', 'develop', {cwd: mockup_dir}, function (err) {
							if (err) {
								return reject(err);
							}
							self.loadSites();
							return resolve(true);
						});
					});
				}
			}
			catch(err) {
				return reject(err);
			}
		});
	}

	function watchSass() {
		// sass task compile and sync with browser
		gulp.task('sass', function() {
			var stream = gulp.src(site.directory + '/scss/*.scss')
			.pipe(sass()).on('error', gutil.log)
			.pipe(rename({basename: site.name}))
			.pipe(gulp.dest(site.directory + '/css/'))
			.pipe(reload({stream: true})).on('error', gutil.log);

			stream.on('end', function() {
				console.log('finished building sass');
				try{
					site.commit('springboard: ' + site.name + ': sass change');
				}
				catch(err) {
					console.log('Failed to commit sass changes'.red);
					console.error(err);
				}
				done();
			})

		});

		if (eye_of_sauron) {
			// stop the watch
			eye_of_sauron.end();
			// start the watch again
			eye_of_sauron = gulp.watch([site.directory + '/scss/*.scss'], ['sass']);
		} else {
			eye_of_sauron = gulp.watch([site.directory + '/scss/*.scss'], ['sass']);
		}
	}

	function watchHtml() {
		// html reload browser on change
		if (eye_of_horus) {
			// stop the watch
			eye_of_horus.end();
			// start the watch again
			eye_of_horus = gulp.watch(site.directory + '/*.html').on('change', reload);
		} else {
			eye_of_horus = gulp.watch(site.directory + '/*.html').on('change', reload);
		}
	}

	function watchJs() {
		// js task compile and reload browser
		gulp.task('js', function() {
			gulp.src(site.directory + '/js/*.js')
			// do some browserify or concat stuff here...
			.pipe(jshint()).on('error', gutil.log)
			.pipe(jshint.reporter('jshint-stylish'))
			.pipe(gulp.dest(site.directory + '/js/' + 'dist'))
			.pipe(uglify()).on('error', gutil.log)
			.pipe(rename({extname: '.min.js'}))
			.pipe(gulp.dest(site.directory + '/js/' + 'dist'))
			.pipe(gzip())
			.pipe(rename({extname: '.min.js.gzip'}))
			.pipe(gulp.dest(site.directory + '/js/' + 'dist'));
			//.pipe(site.commit('springboard: ' + site.name + ': js change'));
		});

		if (all_seeing_eye) {
			// stop the watch
			all_seeing_eye.end();
			// start the watch again
			all_seeing_eye = gulp.watch([site.directory + '/js/*.js'], ['js', reload]);
		} else {
			all_seeing_eye = gulp.watch([site.directory + '/js/*.js'], ['js', reload]);
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
