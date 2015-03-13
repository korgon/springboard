// searchspring springboard
// controller of the spring

// strictness!
"use strict";

// include packages
var co = require('co');
var fs = require('fs-extra');
var colors = require('colors');
// gulp tasker and submodules
var gulp = require('gulp');
var gcb = require('gulp-callback');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var gzip = require('gulp-gzip');
var jshint = require('gulp-jshint');
var git = require('gulp-git');
// browsersync
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
	var version = "1.0.7";

	// watchers (used for gulp)
	var all_seeing_eye = ''; // used for tracking js watch for gulp
	var eye_of_sauron = ''; // used for tracking sass watch for gulp
	var eye_of_horus = ''; // used for tracking html watch for gulp

	// default config options
	// git@github.com:korgon/searchspring-sites.git
	// git@bitbucket.org:searchspring/searchspring-sites.git

	var options = {
		version: version,
		user: {
			name: "anon"
		},
		sites_repo: "git@github.com:korgon/searchspring-sites.git",
		current_site: "none"
	}
	var site_dir = "searchspring-sites/";
	var server_port = 1337;
	var sites = {};
	var site = {};

	/*	______________
	//
	//	public methods
	//	______________
	*/

	self.options = options;

	self.init = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			var title = '           spr1ngb0ard           ';
			var ver = 'version [' + version +']';
			logit(title.trap, ver, 'red');

			// check for config file and read it
			if (fs.existsSync(config_file)) {
				//console.log('config file exists!');
				try {
					options = JSON.parse(fs.readFileSync(config_file));
					// check for valid options and version
					// TBD
				} catch(err) {
					console.error(err);
				}
			}
			else {
				logit('initialization', 'created new config file');
				writeConfig();
			}

			repoInit().then(function(reposites) {
				startBrowserSync();
			}).then(function() {
				if (Object.keys(reposites).length > 0) {
					// start watching a site
					self.watchSite().then(function() {
						return resolve(true);
					}).catch(function(err) {
						throw('cant watch site!');
					});
				} else {
					// there are no sites
					return resolve(true);
				}
			}).catch(function(err) {
				logit('initialization', 'failed', 'fail');
				console.error(err);
				return reject(err);
			});
		});
	}

	self.getSites = function() {
		try {
			return sites;
		}
		catch(err) {
			return {'error': err};
		}
	}

	self.getSite = function(asite) {
		if (asite === undefined) {
			if (options.current_site) {
				return sites[options.current_site];
			} else if (sites[0]){
				return sites[0];
			} else {
				return { error: 'there are no sites...' };
			}
		}
		if (sites[asite]) {
			return sites[asite];
		} else {
			return {'error': 'site ' + asite + ' not found.'};
		}
	}

	self.newSite = function(details) {
		// promisified
		return new Promise(function(resolve, reject) {
			// purify all things
			details.name = details.name.toLowerCase();
			details.siteid = details.siteid.toLowerCase();
			details.template = details.template.toLowerCase();

			if (details === undefined || details.name === undefined) {
				return reject(Error('cannot create site: need more detials.'));
			}
			else {
				// check if site already exists
				if (fs.existsSync(site_dir + 'sites/' + details.name)) {
					return reject(Error('cannot create site: site exists.'));
				}
				// create branch from CORE
				git.exec({args: 'checkout CORE', log: true, cwd: site_dir}, function (err) {
					if (err) {
						return reject(err);
					}
					// create new branch and switch to it
					git.checkout('site/' + details.name, {cwd: site_dir, args: '-b'}, function (err) {
						if (err) {
							return reject(err);
						}
						// create new folder
						var site_folder = site_dir + 'sites/' + details.name;
						fs.mkdirSync(site_folder);
						// copy over templates
						fs.copy(site_dir + 'templates/scss/' + details.template, site_folder + '/scss', function(err) {
							if (err)
								return reject('failed to copy scss templates: ' + err);

							fs.copy(site_dir + 'templates/js/', site_folder + '/js', function(err) {
								if (err)
									return reject('failed to copy js templates: ' + err);

								// TBD
								// edit initoptions.js file tha was just copied and replace {{variable}}

								// create html file with init script tags inside
								try {
									var scripts = '<script type="text/javascript" src="//cdn.searchspring.net/ajax_search/js/searchspring-catalog.min.js"></script>';
									scripts += '<script type="text/javascript" src="js/' + details.name +'.js">';
									scripts += '</script>\n<script>\n\tSearchSpring.Catalog.init(Searchspring.initOptions);\n</script>';
									fs.writeFileSync(site_folder + '/' + details.name + '.html', scripts);
								}
								catch(err) {
									console.log('failed to create html document');
									return reject(err);
								}

								// create new site object
								try {
									details.directory = site_folder;
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
								var commitmsg = options.user.name + '@springboard >>> CREATED >>> ' + site.name;
								site.commit(commitmsg).then(function() {
									site.mergeit();
								}).catch(function(err) {
									console.error(err);
									return reject('Failed to commit the new site!');
								}).then(function() {
									self.watchSite(site.name);
								}).catch(function() {
									console.error(err);
									return reject('Failed to merge the new site!', err);
								}).catch(function(err) {
									return reject('Failed to switch to the new site!', err);
								}).then(function() {
									logit('new site', 'new branch created for ' + site.name, 'pass');
									console.log(site.directory.green + '\n');
									return resolve(site);
								});
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
		var dir_sites = site_dir + 'sites/';
		logit('loading sites', '', 'blue');
		try {
			var folders = fs.readdirSync(dir_sites);
		}
		catch(err) {
			console.error(err);
		}
		// first empty sites object (to start fresh)
		for (var del in sites) delete sites[del];

		for (var folder of folders) {
			// ignore non directories... or hidden folders (^.*)
			if (!fs.lstatSync(dir_sites + folder).isDirectory() || folder.match(/^\./))
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
					process.stdout.write('   .'.bold.blue);
					total++;
				}
			}
			catch(err) {
				var errormsg = 'failed to load sites';
				logit('loading sites', errormsg, 'fail');
				console.error(err);
			}
		}
		if (folders)
			console.log('\n');
		logit('load complete', total + ' sites loaded', 'blue');
		return;
	}

	self.watchSite = function(usethis) {
		// promisified function that returns a site object

		// first it saves site selection to config
		// then it pulls the site from repo
		// then it checks out the site branch
		// then it starts watching for edits to that site
		return new Promise(function(resolve, reject) {
			//use only valid site in sites
			if (usethis === undefined) {
				if (options.current_site) {
					usethis = options.current_site;
					if (options.current_site == 'none') usethis = Object.keys(sites)[0];
				} else {
					usethis = sites[0];
				}
			}
			if (sites[usethis]) {
				site = sites[usethis];
				options.current_site = site.name;
				writeConfig();
				stopWatch();

				logit('loaded ' + site.name, site.directory, 'warn');
				// console.log(site);
				site.checkout()
				.then(function() {
					// start gulping
					watchSass();
					watchHtml();
					watchJs();

					return resolve(site);
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

	self.updateSites = function() {
		return new Promise(function(resolve, reject) {
			stopWatch();
			repoInit().then(function() {
				self.watchSite().then(function() {
					return resolve(sites);
				}, function(err) {
					return reject(err);
				});
			}, function(err) {
				return reject(err);
			});
		});
	}

	self.pushSite = function(name) {
		// promisified
		return new Promise(function(resolve, reject) {
			var thesite = sites[name];
			if (thesite) {
				var commitmsg = options.user.name + '@springboard >>> PUSHING >>> ' + thesite.name;
				thesite.commit(commitmsg).then(function() {
					thesite.pushit();
				}).then(function() {
					logit('push', name + ' has been pushed to gitland', 'pass');
					return resolve( { site: thesite.name, status: 'success' } )
				}).catch(function(err) {
					return reject(err);
				});
			} else {
				return reject(new Error('site: ' + name + ' not found!'));
			}
		});
	}

	self.commitSite = function(name) {
		// promisified
		return new Promise(function(resolve, reject) {
			var thesite = sites[name];
			if (thesite) {
				var commitmsg = options.user.name + '@springboard >>> COMMITED >>> ' + thesite.name;
				thesite.commit(commitmsg).then(function() {
					logit('commit', name + ' changes have been commited', 'pass');
					return resolve( { site: thesite.name, status: 'success' } )
				}, function(err) {
					return reject(err);
				});
			} else {
				return reject(new Error('site: ' + name + ' not found!'));
			}
		});
	}

	self.publishSite = function(usethis) {
		// promisified
		return new Promise(function(resolve, reject) {
			if (usethis === undefined) {
				if (options.current_site) {
					usethis = options.current_site;
				} else {
					return reject(Error('specify a site, no history to use'));
				}
			}
			// check if valid site
			if (sites[usethis]) {
				if (usethis == site.name) {
					// don't need to switch repos or stopwatch
					var switched = false;
					var thesite = site;
				} else {
					var switched = true;
					var thesite = sites[usethis];
					stopWatch();
					logit('publishing ' + thesite.name, thesite.directory, 'warn');
				}
				thesite.checkout()
				.then(function() {
					var publishmsg = options.user.name + '@springboard >>> PUBLISHED >>> ' + thesite.name;
					thesite.publish(publishmsg)
					.then(function() {
						logit('publish', publishmsg, 'pass');
						if (switched) {
							self.watchSite(options.current_site);
						}
						return resolve(thesite);
					}, function(err) {
						logit('publish', 'failed to publish ' + thesite.name, 'fail');
						console.log(err)
						return reject(new Error('image capture fail!'));
					});
				}, function(err) {
					logit('publish', 'failed to checkout ' + thesite.name, 'fail');
					console.log(err)
					return reject(new Error('failed to checkout branch'));
				});
			} else {
				return reject(new Error('site: ' + thesite.name + ' not found!'));
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
			logit('config file', 'failed to write springboard config', 'fail');
			console.error(err);
		}
		return;
	}

	function repoInit() {
		// promisified
		return new Promise(function(resolve, reject) {
			try {
				if (!(fs.existsSync(site_dir))) {
					logit('initialization', 'cloning repository');
					git.clone(options.sites_repo, function (err) {
						if (err) throw err;
						// checkout master
						git.checkout('master', {cwd: site_dir}, function (err) {
							if (err) {
								return reject(err);
							}
							self.loadSites();
							return resolve(sites);
						});
					});
				} else {
					logit('syncing repository', 'updating local copy of repository');
					git.checkout('master', {cwd: site_dir}, function (err) {
						if (err) {
							return reject(err);
						}
						git.pull('origin', 'master', {cwd: site_dir}, function (err) {
							if (err) {
								return reject(err);
							}
							self.loadSites();
							return resolve(sites);
						});
					});
				}
			}
			catch(err) {
				return reject(err);
			}
		});
	}

	function stopWatch() {
		if (eye_of_sauron)
			eye_of_sauron.end();
		if (eye_of_horus)
			eye_of_horus.end();
		if (all_seeing_eye)
			all_seeing_eye.end();
		return;
	}

	function watchSass() {
		// sass task compile and sync with browser
		gulp.task('sass', function() {
			gulp.src(site.directory + '/scss/*.scss')
			.pipe(sass()).on('error', function(err) {
				console.log(err);
				logit('sass', err.message, 'fail');
				this.emit('end');
				return;
			})
			.pipe(rename({basename: site.name}))
			.pipe(gulp.dest(site.directory + '/css/'))
			.pipe(reload({stream: true})).on('error', gutil.log);
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
		// sass task compile and sync with browser
		gulp.task('html', function() {
			gulp.src(site.directory + '/*.html')
			.pipe(gcb(function() {
				reload();
			}));
		});

		if (eye_of_horus) {
			// stop the watch
			eye_of_horus.end();
			// start the watch again
			eye_of_horus = gulp.watch([site.directory + '/*.html'], ['html']);
		} else {
			eye_of_horus = gulp.watch([site.directory + '/*.html'], ['html']);
		}
	}

	function watchJs() {
		var watchlist = [site.directory + '/src/*.js'];

		// js task compile and reload browser
		gulp.task('buildjs', function() {
			return gulp.src(watchlist)
			// do some browserify stuff here...
			.pipe(jshint()).on('error', gutil.log)
			.pipe(jshint.reporter('jshint-stylish'))
			.pipe(jshint.reporter('fail')).on('error', function(err) {
				var errormsg = site.name + ' failed js linting';
				logit('buildjs', errormsg, 'fail');
				this.emit('end');
			})
			.pipe(gcb(function() {
				var msg = site.name + ' passed js linting';
				logit('buildjs', msg, 'pass');
			}))
			.pipe(uglify()).on('error', gutil.log)
			.pipe(rename({extname: '.min.js'}))
			.pipe(gulp.dest(site.directory + '/js'))
			.pipe(gzip())
			.pipe(rename({extname: '.gz'}))
			.pipe(gulp.dest(site.directory + '/js'))
			.pipe(gcb(function() {
				var msg = site.name + ' exported js files';
				logit('buildjs', msg, 'pass');
				reload();
			}));
		});

		if (all_seeing_eye) {
			// stop the watch
			all_seeing_eye.end();
			// start the watch again
			all_seeing_eye = gulp.watch(watchlist, ['buildjs']);
		} else {
			all_seeing_eye = gulp.watch(watchlist, ['buildjs']);
		}
	}

	function startBrowserSync() {
		// promisified
		logit('initialization', 'beginning browersersyncification');
		return new Promise(function(resolve, reject) {
			try {
				browserSync({
					ui: false,							// start with ui?
					notify: false,						// show browser notifications?
					port: server_port,			// port number
					online: false,						// online features?
					open: false,						// open browser on start?
					logLevel: "silent",					// silencio!
					proxy: "localhost:" + (server_port + 1)
				}, function() {
					// callback function after browsersync loads
					var msg = 'http://localhost:' + server_port + '/';
					logit('server started', msg, 'green');
					return resolve(true);
				});
			}
			catch(err) {
				var msg = 'failed to start browsersync';
				logit('server fail', msg, 'fail');
				return reject(err);
			}
		});
	}

	function logit(alert, message, type) {
		alert = ' ' + alert + ' ';
		var boxtopper = '╭' + '─'.repeat(alert.length) + '╮';
		var boxbottom = '╰' + '─'.repeat(alert.length) + '╯';
		switch (type) {
			case 'blue':
				console.log(boxtopper.blue);
				console.log('│'.blue + alert.bold.blue + '│'.blue + ' ' + message.blue);
				console.log(boxbottom.blue);
				break;
			case 'pass':
			case 'green':
				console.log(boxtopper.green);
				console.log('│'.green + alert.bold.green + '│'.green + ' ' + message.green);
				console.log(boxbottom.green);
				break;
			case 'fail':
			case 'red':
				console.log(boxtopper.red);
				console.log('│'.red + alert.bold.red + '│'.red + ' ' + message.red);
				console.log(boxbottom.red);
				break;
			case 'warn':
			case 'yellow':
				console.log(boxtopper.yellow);
				console.log('│'.yellow + alert.bold.yellow + '│'.yellow + ' ' + message.yellow);
				console.log(boxbottom.yellow);
				break;
			case 'white':
			default:
				console.log(boxtopper.white);
				console.log('│'.white + alert.bold.white + '│'.white + ' ' + message.white);
				console.log(boxbottom.white);
		}
		console.log();
	}
}
