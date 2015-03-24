// searchspring springboard
// controller of the spring
// manages sites, modules, templates
// manages github and s3 for sites
// manages the edit and build of 1 site at a time
// * includes css injection / browser reload / js linting and concat

// strictness!
"use strict";

// include packages
var co = require('co');
var fs = require('fs-extra');
var colors = require('colors');
// gulp tasker and submodules
var gulp = require('gulp');
var gulpif = require('gulp-if');
var gcb = require('gulp-callback');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var minify = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var gzip = require('gulp-gzip');
var jshint = require('gulp-jshint');
// awshit s3
var AWS = require('aws-sdk');
// browsersync
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// local modules
var website = require('./website.js');
var mod = require('./mod.js');
var git = require('./git.js')();
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
	var version = "1.0.8";

	// watchers (used for gulp)
	var all_seeing_eye = ''; // used for tracking js watch for gulp
	var eye_of_providence = ''; // used for tracking css watch for gulp
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
		current_site: "none",
		s3_key_id: "",
		s3_key_secret: ""
	}
	var sites = {};
	var site = {};
	var modules = {};

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

			repoInit().then(function() {
				return self.loadSites();
			}).then(function() {
				return startBrowserSync();
			}).then(function() {
				return resolve(true);
			}).catch(function(err) {
				logit('initialization', 'failed', 'fail');
				console.error(err);
				return reject(err);
			});
		});
	}

	self.getModules = function() {
		try {
			return modules;
		}
		catch(err) {
			return {'error': err};
		}
	}

	self.getSites = function() {
		try {
			// TBD return ordering of sites
			var orderedsites = sites;
			return orderedsites;
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

	self.loadSites = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			stopWatch();
			self.checkoutSite().then(function() {
				return self.commitSite();
			}).then(function() {
				git.checkout('master', function(err) {
					if (err) return reject(err);
				}).pull('origin', 'master', function (err) {
					if (err) return reject(err);
				}).then(function() {
					// copy thumbs into cache
					fs.copySync(global.site_dir + 'sites/.thumbs', '.cache/sites/thumbs', {recursive: true}, function(err) {
						if (err) return reject(err);
					});
					// load the sites
					var total = 0;
					var dir_sites = global.site_dir + 'sites/';
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
							console.error(err.red);
						}
					}
					if (folders) console.log('\n');
					logit('load complete', total + ' sites loaded', 'blue');
					if (options.current_site != 'none') self.watchSite(options.current_site);
					else {
						git.checkout('CORE', function(err) {
							console.log();
							return reject(true);
						}).fetch();
					}
					return resolve(sites);
				});
			}).catch(function(err) {
				logit('loading sites', 'failed to commit site first', 'fail');
				return reject(err);
			});
		});
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
				if (fs.existsSync(global.site_dir + 'sites/' + details.name)) {
					return reject(Error('cannot create site: site exists.'));
				}
				// commit any current changes to site left uncommited
				self.commitSite().then(function() {
					var site_folder;
					// create branch from CORE
					git.checkout('CORE', function(err) {
						if (err) return reject(err);
					}).fetch(function(err) {
						if (err) return reject(err);
					}).checkoutLocalBranch('site/' + details.name, function (err) {
						if (err) return reject(err);
					}).then(function() {
						console.log('after new branch');
						// create new folder
						site_folder = global.site_dir + 'sites/' + details.name;
						fs.mkdirSync(site_folder);
						// copy over templates
						if (details.template != 'none') {
							try  {
								fs.copySync(global.site_dir + 'templates/scss/' + details.template, site_folder + '/scss', {recursive: true}, function(err) {
									if (err) return reject('failed to copy scss templates: ' + err);
								});
								fs.mkdirSync(site_folder + '/css');
								fs.renameSync(site_folder + '/scss/master.scss', site_folder + '/scss/' + details.name + '.scss');
								fs.unlinkSync(site_folder + '/scss/' + details.template + '.json');
							} catch(err) {
								reject('failed to copy scss templates: ' + err);
							}
						} else {
							fs.mkdirSync(site_folder + '/scss');
							fs.mkdirSync(site_folder + '/css');
							var defaultscss = '// scss file for ' + details.name;
							fs.writeFileSync(site_folder + '/scss/' + details.name + '.scss', defaultscss);
						}
						// copy js templates
						fs.copySync(global.site_dir + 'templates/js', site_folder + '/js', {recursive: true}, function(err) {
							if (err) return reject('failed to copy js templates: ' + err);
						});
						// edit initoptions.js file that was just copied and replace {{variables}}
						try {
							var newinit = fs.readFileSync(site_folder + '/js/_initoptions.js', 'utf8');
							newinit.replace(/\{\{siteid\}\}/g, details.siteid);
							fs.writeFileSync(site_folder + '/js/_initoptions.js', newinit, 'utf8');
						}
						catch(err) {
							return reject(err);
						}

						// create html file with init script tags inside
						var scripts = '<script type="text/javascript" src="//cdn.searchspring.net/ajax_search/js/searchspring-catalog.min.js"></script>';
						scripts += '\n<script type="text/javascript" src="js/' + details.name +'.js">';
						scripts += '</script>\n<script>\n\tSearchSpring.Catalog.init(Searchspring.initOptions);\n</script>';
						try {
							fs.writeFileSync(site_folder + '/' + details.name + '.html', scripts);
						}
						catch(err) {
							return reject(err);
						}
					}).then(function() {
						// create new site object
						try {
							details.directory = site_folder;
							details.status = 'mockup';
							sites[details.name] = new website(details);
							site = sites[details.name];
							if (!sites[details.name].valid) {
								delete sites[details.name];
								throw(details.name);
							} else {
								options.current_site = site.name;
								writeConfig();
							}
						}
						catch(err) {
							console.error(err);
							var errormsg = 'failed to create: ' + err;
							return reject(errormsg);
						}
					}).then(function() {
						var commitmsg = options.user.name + '@springboard >>> CREATED >>> ' + site.name;
						self.commitSite(commitmsg).then(function() {
							return self.pushSite('new');
						}).then(function() {
							return self.mergeSite(commitmsg);
						}).then(function() {
							logit('new site', 'new branch created for ' + site.name, 'pass');
							console.log(site.directory.green + '\n');
							return self.watchSite(site.name);
						}).then(function(){
							return resolve(site);
						}).catch(function(err) {
							console.error(err);
							return reject(err);
						});
					});
				}).catch(function(err) {
					console.error(err);
					return reject(err);
				});
			}
		});
	}

	self.watchSite = function(thesite) {
		// promisified function that returns a site object
		return new Promise(function(resolve, reject) {
			//use only valid site in sites
			if (thesite === undefined) {
				if (site.name) {
					thesite = site.name
				} else if (options.current_site != 'none') {
					thesite = options.current_site;
					if (options.current_site == 'none') thesite = Object.keys(sites)[0].name;
				} else {
					thesite = sites[0].name;
				}
			}
			if (sites[thesite]) {
				site = sites[thesite];
				options.current_site = site.name;
				writeConfig();
				stopWatch();

				logit('loaded ' + site.name, site.directory, 'blue');
				// console.log(site);
				git.checkout('site/' + site.name, function(err) {
					if (err) return reject(err);
				}).clean().then(function() {
					// start gulping
					watchCss();
					watchScss();
					watchHtml();
					watchJs();
					return resolve(site);
				});
			}
			else {
				return reject(Error(thesite + ' is not a valid site!'));
			}
		});
	}

	self.checkoutSite = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			if (options.current_site == 'none') return resolve(true);
			if (site.name === undefined) site.name = options.current_site;
			git.checkout('site/' + site.name, function(err) {
				if (err) return reject(err);
				return resolve(true);
			})
		});
	}

	self.commitSite = function(message) {
		// promisified
		return new Promise(function(resolve, reject) {
			if (options.current_site == 'none') return resolve(true);
			if (site.name === undefined) site.name = options.current_site;
			if (message === undefined) {
				message = options.user.name + '@springboard >>> COMMITED >>> ' + site.name;
			}
			git.add(['sites/' + site.name, 'sites/.thumbs'], function(err, data) {
				if (err) return reject(err);
			}).commit(message, function(err) {
				if (err) {
					// apparently its an error when there is nothing to commit
					// best way to handle this for now...
					logit('commit', site.name.bold + ' no changes to commit');
					return resolve( { site: site.name, action: 'commit', status: 'nothing to commit' } );
				}
				logit('commit', message, 'pass');
				return resolve( { site: site.name, action: 'commit', status: 'success' } );
			});
		});
	}

	self.pullSite = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			git.pull('origin', 'site/' + site.name, function(err) {
				if (err) return reject(err);
				logit('pulled', site.name + ' has been pulled from gitland', 'pass');
				return resolve( { site: site.name, action: 'pull', status: 'success' } )
			});
		});
	}

	self.pushSite = function(newflag) {
		// promisified
		return new Promise(function(resolve, reject) {
			if (newflag) {
				git.pushUp('origin', 'site/' + site.name, function(err) {
					if (err) return reject(err);
					logit('pushed', site.name + ' has been pushed to gitland', 'pass');
					return resolve( { site: site.name, action: 'push', status: 'success' } )
				});
			} else {
				git.push('origin', 'site/' + site.name, function(err) {
					if (err) return reject(err);
					logit('pushed', site.name + ' has been pushed to gitland', 'pass');
					return resolve( { site: site.name, action: 'push', status: 'success' } )
				});
			}
		});
	}

	self.mergeSite = function(message) {
		// promisified
		return new Promise(function(resolve, reject) {
			if (message === undefined) {
				message = options.user.name + '@springboard >>> MERGED >>> ' + site.name;
			}
			stopWatch();
			git.checkout('master', function(err) {
				if (err) return reject(err);
			}).merge(message, 'site/' + site.name, function(err) {
				if (err) return reject(err);
			}).push('origin', 'master', function(err) {
				if (err) return reject(err);
			}).then(function() {
				self.watchSite().then(function() {
					logit('merged', site.name + ' >>> ' + 'master', 'warn');
					return resolve( { site: site.name, action: 'merge', status: 'success' } )
				});
			});
		});
	}

	self.pullRequestSite = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			logit('pull request', 'pull request made for ' + site.name, 'warn');
			return resolve( { site: site.name, action: 'publish', status: 'success' } )
		});
	}

	self.publishSite = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			// TBD
			// move production files (js, html, css) into 'live' folder
			site.capture().then(function() {
				var commitmsg = options.user.name + '@springboard >>> PUBLISHED >>> ' + site.name;
				return self.commitSite(commitmsg);
			}).then(function() {
				return self.pushSite();
			}).then(function() {
				// TBD some s3 stuff...
				logit('publish', site.name + ' published to the cdn', 'pass');
				return resolve( { site: site.name, action: 'publish', status: 'success' } );
			}).catch(function(err) {
				logit('publish', 'failed to publish' + site.name, 'fail');
				console.error(err.red);
				return reject(err);
			});
		});
	}

	// self.loadModules = function() {
	// 	// to be called during load init...
	// 	// promisified
	// 	return new Promise(function(resolve, reject) {
	// 		var total = 0;
	// 		var dir_modules = global.site_dir + 'modules/';
	//
	// 		try {
	// 			var folders = fs.readdirSync(dir_sites);
	// 		}
	// 		catch(err) {
	// 			console.error(err);
	// 			return reject(err);
	// 		}
	// 		// first empty modules object (to start fresh)
	// 		for (var del in modules) delete modules[del];
	//
	// 		// load up the modules (and each version within)
	// 		for (var folder of folders) {
	// 			// ignore non directories... or hidden folders (^.*)
	// 			if (!fs.lstatSync(dir_sites + folder).isDirectory() || folder.match(/^\./)) continue;
	// 			// read version directories
	// 			try {
	// 				var versions = fs.readdirSync(dir_sites + folder);
	// 			}
	// 			catch(err) {
	// 				console.error(err);
	// 				return reject(err);
	// 			}
	// 			for (var version of versions) {
	// 				if (!fs.lstatSync(dir_sites + folder).isDirectory() || folder.match(/^\./)) continue;
	// 				try {
	// 					// fill sites with sites...
	// 					modules[folder][version] = new mod({ name: folder, directory: dir_sites + folder });
	// 					if (!sites[folder].valid) {
	// 						delete sites[folder];
	// 						throw(folder);
	// 					}
	// 					else {
	// 						total++;
	// 					}
	// 				}
	// 				catch(err) {
	// 					console.error(err);
	// 					return reject(err);
	// 				}
	// 			}
	// 			return resolve(total);
	// 		}
	// 	});
	// }

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
				git.outputHandler(function (command, stdout, stderr) {
					stdout.pipe(process.stdout);
					stderr.pipe(process.stderr);
				});
				if (!(fs.existsSync(global.site_dir))) {
					logit('initialization', 'cloning repository');
					git.clone(options.sites_repo, global.site_dir, function (err) {
						if (err) return reject(err);
					}).then(function() {
						git._baseDir = global.site_dir;
						return resolve(true);
					});
				} else {
					logit('syncing repository', 'updating local copy of repository');
					git._baseDir = global.site_dir;
					return resolve(true);
				}
			}
			catch(err) {
				return reject(err);
			}
		});
	}

	function stopWatch() {
		// blinding the eyes
		if (eye_of_providence)
			eye_of_providence.end();
		if (eye_of_sauron)
			eye_of_sauron.end();
		if (eye_of_horus)
			eye_of_horus.end();
		if (all_seeing_eye)
			all_seeing_eye.end();
		return;
	}

	function watchCss() {
		// scss task compile and sync with browser
		gulp.task('css', function() {
			gulp.src([site.directory + '/css/*.css', '!' + site.directory + '/css/*.min.css'])
			.pipe(reload({stream: true})).on('error', gutil.log)
			.pipe(rename({extname: '.min.css'}))
			.pipe(minify())
			.pipe(gulp.dest(site.directory + '/css/'));
		});

		if (eye_of_providence) {
			// stop the watch
			eye_of_providence.end();
			// start the watch again
			eye_of_providence = gulp.watch([site.directory + '/css/*.css'], ['css']);
		} else {
			eye_of_providence = gulp.watch([site.directory + '/css/*.css'], ['css']);
		}
	}

	function watchScss() {
		// scss task compile and sync with browser
		gulp.task('scss', function() {
			gulp.src(site.directory + '/scss/*.scss')
			.pipe(sourcemaps.init())
			.pipe(sass({
	        sourceComments: 'map',
	        sourceMap: 'scss'
        })).on('error', function(err) {
				console.log(err);
				logit('scss', 'failed to compile', 'fail');
				console.log(err.message.red);
				this.emit('end');
				return;
			})
			.pipe(sourcemaps.write('./'))
			.pipe(gulp.dest(site.directory + '/css/'))
			.pipe(gcb(function() {
				logit('scss', 'compiled scss files');
			}))
		});

		if (eye_of_sauron) {
			// stop the watch
			eye_of_sauron.end();
			// start the watch again
			eye_of_sauron = gulp.watch([site.directory + '/scss/*.scss'], ['scss']);
		} else {
			eye_of_sauron = gulp.watch([site.directory + '/scss/*.scss'], ['scss']);
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
				logit('buildjs', msg);
			}))
			.pipe(uglify()).on('error', gutil.log)
			.pipe(rename({extname: '.min.js'}))
			.pipe(gulp.dest(site.directory + '/js'))
			.pipe(gzip())
			.pipe(rename({extname: '.gz'}))
			.pipe(gulp.dest(site.directory + '/js'))
			.pipe(gcb(function() {
				var msg = site.name + ' exported js files';
				logit('buildjs', msg);
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
					port: global.port,			// port number
					online: false,						// online features?
					open: false,						// open browser on start?
					logLevel: "silent",					// silencio!
					proxy: "localhost:" + (global.port + 1)
				}, function() {
					// callback function after browsersync loads
					var msg = 'http://localhost:' + global.port + '/';
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
