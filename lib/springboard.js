// searchspring springboard
// controller of the spring
// manages sites and watches 1 site file structure (git branch) for autobuilding
// manages github and s3 connection for site

// queue for site publishing?

// * includes css injection / browser reload

/*

avg ram usage 112MB

// ideas

New watcher to watch .json files for changes to re-render nj files to js
* watch json
* build nunjucks on json change
* only build what has changed (plugin / module / theme)

Modules with extensions (plugins)
* modules for ajax_catalog, autocomplete, finders and pr_widgets
* extendibility for future modules (angular_catalog)

High Level TODO
================================================================================
1.	finish modularizing
		|-	allow for multiple modules per site (and multiple same modules [named])
		|-	allow for modules of modules [plugins] (ex: slideout)
		|-	make themes per/module
  	a.	put site functions in site module (class)
		b.	put module funtions in mod module (class)


2.	tie together s3 releases with tagging

3.	update UI
		a.	main menu dropdown
		b.	editor menu dropdown
				|-	publish buttons (commit, publish mockup, publish live)
				|-	tabbed settings (modules, config etc...)
		c.	gallery (view sites)

x.	playable theme/module sandbox
x.	nunjucks only. be rid of jade
x.	angular module
x.	rewrite sbc in angular


API TODO
================================================================================
springboard API <--> SBC
this will determine how sbc API (springboardclient) looks and other module functions
created by thinking about how client interaction will be (buttons, etc...)

[general]
login(details)	// TODO
editUser(user_data)	// TODO

[from gallery]
getSites()
getSite(site_name)
newSite(details)


[from editor]
updateSite(site_name)	// edit site options (theme, variables, etc...) site object
buildSite(site_name)
buildSiteModule(site_name, module_data)	// builds the module, starting with plugins (by priority / dependency)
installModule(site_name, module_data)
installModulePlugin(site_name, module_data)
installModuleTheme(site_name, module_data)

[git / publish]
commitSite(site_name)
pushSite(site_name)
pullRequestSite(site_name)
mergeSite(site_name)
publishSite(site_name)






*/


// strictness!
"use strict";

// include packages
var path = require('path');
var fs = require('fs-extra');
var colors = require('colors');
// gulp tasker and submodules
var gulp = require('gulp');
var gulpif = require('gulp-if');
var gcb = require('gulp-callback');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var minify = require('gulp-minify-css');
var tap = require('gulp-tap');
var uglify = require('gulp-uglify');
var gzip = require('gulp-gzip');
var jshint = require('gulp-jshint');

// trying things without gulp ('cause gulp watch is dissapointing)
var chokidar = require('chokidar');
var sass = require('node-sass');
var ccss = require('clean-css');

// awshit s3
var AWS = require('aws-sdk');
// templating
var nja = require('nunjucks');
// browsersync
var browserSync = require('browser-sync');

// local modules
var website = require('./website.js');
var mod = require('./mod.js');
var logit = require('./logit.js')();
var git = require('./git.js')();
var s3w = require('./s3w.js');

module.exports = function() {
	return new springboard();
}();

function springboard() {
	var self = this;

	/*	_________________	*\
	//										\\
	//	private variables	\\
	//	_________________	\\
	\*										*/

	var springboard_dir = global.dirname;
	var sites_repo_dir = global.site_repository_dirname;
	var sites_dir = global.site_repository_dirname;
	var modules_dir = global.dirname + '/springboard-modules';
	var config_file = "options.json";
	var version = "1.0.12";

	// watchers (used for gulp)
	var all_seeing_eye = ''; // used for tracking js watch for gulp
	var eye_of_sauron = ''; // used for tracking sass watch for gulp
	var eye_of_saturn = ''; // used for tracking json watch for gulp to render nunjucks templates
	var eye_of_horus = ''; // used for tracking html watch for gulp

	// default config options
	// git@github.com:korgon/searchspring-sites.git
	// git@bitbucket.org:searchspring/searchspring-sites.git

	var options = {
		version: version,
		user: {
			name: "anon",
			s3_key_id: "",
			s3_key_secret: ""
		},
		sites_repo: "git@github.com:korgon/searchspring-sites.git",
		log_http: true,
		recent_sites: [],
	}
	var s3;								// used for putting files to s3
	var sites = {};				// object containing all site objects
	var site = {};				// points to the current site being edited (watched)
	var modules = {};			// object containing all modules (and associated themes and plugins)

	/*	_________________	*\
	//										\\
	//	 public methods 	\\
	//	_________________	\\
	\*										*/

	self.options = options;

	self.init = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			var title = '           spr1ngb0ard           ';
			var ver = 'version [' + version +']';
			logit.log(title.trap, ver, 'red');

			// check for config file and read it
			if (fs.existsSync(config_file)) {
				//console.log('config file exists!');
				try {
					options = JSON.parse(fs.readFileSync(config_file));
					// check for valid options and version
					// TODO
					// create s3 object
					var keys = { s3_key_id: options.user.s3_key_id, s3_key_secret: options.user.s3_key_secret };
					s3 = new s3w(keys);
				} catch(err) {
					console.error(err);
				}
			}
			else {
				logit.log('initialization', 'created new config file');
				writeConfig();
			}

			loadModules().then(function() {
				return repoInit();
			}).then(function() {
				// commit work done on site (just in case)
				// this prevents git error on loadSites due to master checkout
				return commitWork();
			}).then(function() {
				return self.loadSites();
			}).then(function() {
				return startBrowserSync();
			}).then(function() {
				return resolve(true);
			}).catch(function(err) {
				logit.log('initialization', 'failed', 'fail');
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
			return { error: true, message: err };
		}
	}

	self.getModule = function(amodule) {
		if (amodule === undefined) {
			return { error: true, message: 'please choose a module...' };
		}
		if (modules[amodule]) {
			return modules[amodule];
		} else {
			return { error: true, message: 'module ' + amodule + ' not found.' };
		}
	}

	self.getSites = function() {
		try {
			return sites;
		}
		catch(err) {
			return { error: true, message: err };
		}
	}

	self.getSite = function(asite) {
		if (asite === undefined) {
			return { error: true, message: 'please choose a site...' };
		}
		if (sites[asite]) {
			return sites[asite];
		} else {
			return { error: true, message: 'site ' + asite + ' not found.' };
		}
	}

	self.loadSites = function() {
		// promisified
		return new Promise(function(resolve, reject) {

			// TODO
			// check if site was being worked on to check for uncommited work
			// commit site if so.

			// TODO LATER
			// better error handling for git repos

			stopWatch();
			logit.log('syncing repository', 'updating local copy of repository');
			git.checkout('master', function(err) {
				if (err) return reject({ error: true, message: err.message });
			}).pull('origin', 'master', function (err) {
				if (err) {
					logit.log('git error', 'Cannot continue.', 'fail');
				}
			}).then(function() {

				// TODO
				// copy thumbs into cache
				// fs.copySync(sites_dir + '/.thumbs', springboard_dir + '/.cache/sites/thumbs', {recursive: true}, function(err) {
				// 	if (err) return reject(err);
				// });


				// load the sites
				var total = 0;
				logit.log('loading sites', '', 'blue');
				try {
					var folders = fs.readdirSync(sites_dir);
				}
				catch(err) {
					console.error(err);
				}
				// first empty sites object (to start fresh)
				for (var del in sites) delete sites[del];

				for (var folder of folders) {
					// ignore non directories... or hidden folders (^.*)
					if (!fs.lstatSync(sites_dir + '/' + folder).isDirectory() || folder.match(/^\./))
						continue;
					// build out the sites object...
					// with website objects...
					try {
						// fill sites with sites...
						sites[folder] = new website({ name: folder, directory: sites_dir + '/' + folder }, options.user, git, s3);
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
						logit.log('loading sites', errormsg, 'fail');
						console.error(err.red);
					}
				}
				if (folders) console.log('\n');
				logit.log('load complete', total + ' sites loaded', 'blue');
				if(sites[options.current_site]) {
					self.watchSite(options.current_site);
				}
				return resolve(sites);
			});
		});
	}

	// create new site
	// assuming that current site has been commited
	self.newSite = function(details) {
		// promisified
		return new Promise(function(resolve, reject) {
			// purify all things
			details.name = details.name.toLowerCase();
			details.siteid = details.siteid.toLowerCase();
			details.backend = details.backend.toLowerCase();
			details.cart = details.cart.toLowerCase();

			if (details === undefined || details.name === undefined || details.siteid === undefined) {
				return reject(Error('cannot create site: need more detials.'));
			}
			else {
				git.checkout('master', function(err) {
					if (err) return reject(err);
				}).clean().fetch(function(err) {
					if (err) return reject(err);
					// check if site already exists
					if (fs.existsSync(sites_dir + '/' + details.name)) {
						console.log('site exists!');
						return reject(Error('cannot create site: site exists.'));
					}
				}).checkout('site/_template', function(err) {
					if (err) return reject(err);
				}).fetch(function(err) {
					if (err) return reject(err);
				}).checkoutLocalBranch('site/' + details.name, function (err) {
					if (err) return reject(err);
				}).then(function() {
					// create new folder
					var site_folder = sites_dir + '/' + details.name;
					fs.mkdirSync(site_folder);
					// create html file (for now)
					// modules will create their own html with script tags and skeleton frameworks
					var htmls = '<html>\n\t<head></head>\n\t<body>';
					htmls += '\n\t\t<h1>' + details.name + '</h1>';
					htmls += '\n\t</body>\n</html>';
					try {
						fs.writeFileSync(site_folder + '/' + details.name + '.html', htmls);
					}
					catch(err) {
						return reject(err);
					}
				}).then(function() {
					// create new site object
					try {
						details.directory = sites_dir + '/' + details.name;
						details.gitstatus = 'mockup';
						details.status = 'new';
						sites[details.name] = new website(details, options.user, git, s3);
						site = sites[details.name];
						if (!sites[details.name].valid) {
							delete sites[details.name];
							site = {};
							throw(details.name);
						} else {
							options.current_site = site.name;
							writeConfig();
						}
					}
					catch(err) {
						var errormsg = 'failed to create: ' + err;
						throw(errormsg);
					}
				}).then(function() {
					// do something with modules
				}).then(function() {
					var commitmsg = options.user.name + '@springboard >>> CREATED >>> ' + site.name;
					mergeSite(commitmsg).then(function() {
						logit.log('new site', 'new branch created for ' + site.name, 'pass');
						console.log(site.directory.green + '\n');
						return resolve(site);
					}).catch(function(err) {
						console.error(err);
						return reject(err);
					});
				});
			}
		});
	}

	self.watchSite = function(thesite) {
		// promisified function that returns a site object
		return new Promise(function(resolve, reject) {
			if (sites[thesite]) {
				site = sites[thesite];

				// recent sites
				var recents = options.recent_sites.indexOf(site.name);
				if (recents != -1) {
					options.recent_sites.splice(recents, 1);
				}
				var max_number_of_recents = 12;
				if (options.recent_sites.push(site.name) > max_number_of_recents) {
					options.recent_sites.shift();
				}
				stopWatch();
				git.checkout(site.branch, function(err) {
					if (err) return reject({ error: true, site: self.name, action: 'checkout', status: 'failed', message: err });
				}).clean().then(function() {
					self.pullSite().then(function() {
						site.reload();
						site.compile();
						console.log('gulping!');
						console.log(site);
						// start gulping
						watchIt();
						watchScss();
						watchHtml();
						watchJSON();
						watchJs();
						logit.log('watching site', 'now watching for changes on ' + site.name, 'warn');
						options.current_site = site.name;
						writeConfig();
						return resolve(site);
					}).catch(function(err) {
						console.error(err);
						return reject(err);
					});
				});
			}
			else {
				return reject(Error(thesite + ' is not a valid site!'));
			}
		});
	}

	self.watching = function() {
		if (site.name) {
			return site;
		} else {
			return { error: true, message: 'not watching any site' };
		}
	}

	// install module or plugin or theme
	self.install = function(info) {
		// promisified
		return new Promise(function(resolve, reject) {
			try {
				if (site.directory) {
					if (info.install == 'module') {
						// check if module exists
						if (modules[info.type]) {
							// check if the name is in use by other modules
							if (!site.modules[info.name]) {
								// install module
								site.installModule({ name: info.name, type: info.type, directory: modules[info.type].directory }).then(function(status) {
									// success!!!
									return resolve(status);
								}).catch(function(err) {
									// fail!!!
									return resolve(err);
								});
							} else {
								throw('module ' + info.name + ' exists');
							}
						} else {
							throw('invalid module type');
						}
					} else if (info.install == 'theme' || info.install == 'plugin') {
						// check if module installed in site
						if (site.modules[info.module]) {
							return resolve({ error: false, message: info.install + ' installed' });
						} else {
							throw('parent module not installed');
						}
					} else {
						throw('invalid install type');
					}
				} else {
					throw('not editing a site');
				}
			} catch (err) {
				return resolve({ error: true, message: 'could not install ' + info.install + ': ' + err });
			}
		});
	}

	// * * * * * * * * * * * */

	// GIT REPOSITORY functions

	// * * * * * * * * * * * */

	self.commitSite = function(message, status) {
		// promisified
		return new Promise(function(resolve, reject) {
			if (message === undefined) message = options.user.name + '@springboard >>> COMMITED >>> ' + site.name;
			if (status === undefined) status == 'commited';

			site.setStatus({ gitstatus: status });

			git.add([sites_dir + '/' + site.name], function(err, data) {
				if (err) return reject(err);
			}).commit(message, function(err) {
				if (err) {
					// TODO fix this!
					// apparently its an error when there is nothing to commit
					// best way to handle this for now...
					// need to create a function inside git.js that checks for changes
					logit.log('commit', site.name.bold + ' no changes to commit');
					return resolve( { error: false, site: site.name, action: 'commit', message: 'nothing to commit' } );
				}
				logit.log('commit', message, 'pass');
				return resolve( { error: false, site: site.name, action: 'commit', message: 'success' } );
			});
		});
	}

	self.pullSite = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			git.pull('origin', 'site/' + site.name, function(err) {
				if (err) return reject(err);
				// reload site config to match actual repo
				site.getConfig();
				logit.log('pulled', site.name + ' has been pulled from gitland', 'pass');
				return resolve( { site: site.name, action: 'pull', status: 'success' } )
			});
		});
	}

	self.pushSite = function(message) {
		// promisified
		return new Promise(function(resolve, reject) {
			self.commitSite(message, 'pushed').then(function() {
				if (site.status == 'new') {
					git.pushUp('origin', 'site/' + site.name, function(err) {
						if (err) return reject(err);
						site.setStatus({ gitstatus: 'pushed' });
						logit.log('pushed', site.name + ' has been pushed to gitland', 'pass');
						return resolve( { site: site.name, action: 'push', status: 'success' } )
					});
				} else {
					git.push('origin', 'site/' + site.name, function(err) {
						if (err) return reject(err);
						logit.log('pushed', site.name + ' has been pushed to gitland', 'pass');
						return resolve( { site: site.name, action: 'push', status: 'success' } )
					});
				}
			});
		});
	}

	self.pullRequestSite = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			logit.log('pull request', 'pull request made for ' + site.name, 'warn');
			return resolve( { site: site.name, action: 'publish', status: 'success' } )
		});
	}

	self.publishSiteMockup = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			// TODO
			// move production files (js, html, css) into 'live' folder
			site.capture().then(function() {
				var commitmsg = options.user.name + '@springboard >>> PUBLISHED MOCKUP >>> ' + site.name;
				return self.pushSite(commitmsg);
			}).then(function() {
				// TODO some s3 stuff...
				// copy mockup data into s3 mockup folder
				site.setStatus({ status: 'mockup' });
				logit.log('publish', site.name + ' has been published to S3 MOCKUP', 'pass');
				return resolve( { site: site.name, action: 'publish', status: 'success' } );
			}).catch(function(err) {
				logit.log('publish', 'failed to publish' + site.name, 'fail');
				console.error(err.red);
				return reject(err);
			});
		});
	}

	self.publishSiteLive = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			// TODO
			// move production files (js, html, css) into 'live' folder
			site.capture().then(function() {
				var commitmsg = options.user.name + '@springboard >>> PUBLISHED LIVE >>> ' + site.name;
				return self.pushSite(commitmsg);
			}).then(function() {
				// TODO some s3 stuff...
				// copy site data into s3 site folder
				site.setStatus({ status: 'live' });
				logit.log('publish', site.name + ' has been published to S3 LIVE', 'pass');
				return resolve( { site: site.name, action: 'publish', status: 'success' } );
			}).catch(function(err) {
				logit.log('publish', 'failed to publish' + site.name, 'fail');
				console.error(err.red);
				return reject(err);
			});
		});
	}

	/*	_________________	*\
	//										\\
	//	 private methods 	\\
	//	_________________	\\
	\*										*/

	function writeConfig() {
		try {
			var json_options = JSON.stringify(options, null, 4);
			fs.writeFileSync(config_file, json_options);
		}
		catch(err) {
			logit.log('config file', 'failed to write springboard config', 'fail');
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
				if (!(fs.existsSync(sites_dir))) {
					logit.log('initialization', 'cloning repository');
					git.clone(options.sites_repo, sites_repo_dir, function (err) {
						if (err) return reject(err);
					}).then(function() {
						git._baseDir = sites_dir;
						return resolve(true);
					});
				} else {
					git._baseDir = sites_dir;
					return resolve(true);
				}
			}
			catch(err) {
				return reject(err);
			}
		});
	}

	// used to commit work uncommited by error or mistake
	// this runs only on load
	function commitWork() {
		// promisified
		return new Promise(function(resolve, reject) {
			if (!options.current_site) return resolve(true);

			sites[options.current_site] = new website({ name: options.current_site, directory: sites_dir + '/' + options.current_site }, options.user);
			site = sites[options.current_site];
			var message = options.user.name + '@springboard >>> AUTOCOMMITED >>> ' + site.name;
			self.commitSite(message, 'commited').then(function() {
				return resolve(true);
			});
		});
	}

	// to be used on site creation ONLY for now...
	function mergeSite(message) {
		// promisified
		return new Promise(function(resolve, reject) {
			if (message === undefined) {
				message = options.user.name + '@springboard >>> MERGED >>> ' + site.name;
			}
			stopWatch();
			site.push(message).then(function(){
				git.checkout('master', function(err) {
					if (err) return reject(err);
				}).merge(message, 'site/' + site.name, function(err) {
					if (err) return reject(err);
				}).push('origin', 'master', function(err) {
					if (err) return reject(err);
				}).then(function() {
					logit.log('merged', site.name + ' >>> ' + 'master', 'warn');
					return resolve(true);
				});
			});
		});
	}

	function loadModules() {
		// promisified
		return new Promise(function(resolve, reject) {
			try {
				var folders = fs.readdirSync(modules_dir);
			}
			catch(err) {
				console.error(err);
				return reject(err);
			}
			// first empty modules object (to start fresh)
			for (var del in modules) delete modules[del];

			logit.log('loading modules', '', 'blue');
			// load up the modules
			for (var folder of folders) {
				// ignore non directories... or hidden folders (^.*)
				var module_dir = modules_dir + '/' + folder;

				if (!fs.lstatSync(module_dir).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop

				// create module object
				try {
					modules[folder] = new mod({ name: folder, directory: module_dir });
					if (!modules[folder].valid) delete modules[folder];
				}
				catch(err) {
					console.log('failed at creating module object'.red);
					console.error(err);
					return reject(err);
				}
			}

			// loop through modules to print them and remove invalid
			// if valid print module details (plugins / themes)
			var line = ""
			var mod_cnt = 1;
			var mod_total = Object.keys(modules).length;
			for (var a_mod in modules) {
				// style last line differently
				if (mod_cnt != mod_total) {
					 line = ' ├ ';
				} else {
					line = ' └ ';
				}
				line += modules[a_mod].type + ' v' + modules[a_mod].version;
				console.log(line.blue);

				// loop through plugins
				var plgn_cnt = 1;
				var plgn_total = Object.keys(modules[a_mod].plugins).length;
				if (plgn_total > 0) {
					if (mod_cnt != mod_total) line = ' │   plugins';
					else line = '     plugins';
					console.log(line.blue);
				}
				for (var a_plgn in modules[a_mod].plugins) {
					// style last line differently
					if (plgn_cnt != plgn_total) {
						if (mod_cnt != mod_total) line = ' │    ├ ';
						else line = '      ├ ';
					} else {
						if (mod_cnt != mod_total) line = ' │    └ ';
						else line = '      └ ';
					}
					line += modules[a_mod].plugins[a_plgn].name + ' v' + modules[a_mod].plugins[a_plgn].version;
					console.log(line.blue);
					plgn_cnt++;
				}

				// loop through themes
				var thm_cnt = 1;
				var thm_total = Object.keys(modules[a_mod].themes).length;
				if (thm_total > 0) {
					if (mod_cnt != mod_total) line = ' │   themes';
					else line = '     themes';
					console.log(line.blue);
				}
				for (var a_thm in modules[a_mod].themes) {
					// style last line differently
					if (thm_cnt != thm_total) {
						if (mod_cnt != mod_total) line = ' │    ├ ';
						else line = '      ├ ';
					} else {
						if (mod_cnt != mod_total) line = ' │    └ ';
						else line = '      └ ';
					}
					line += modules[a_mod].themes[a_thm].name + ' v' + modules[a_mod].themes[a_thm].version;
					console.log(line.blue);
					thm_cnt++;
				}

				mod_cnt++;
			}
			console.log();
			return resolve(true);
		});
	}

	function stopWatch() {
		// blinding the eyes
		if (eye_of_sauron) eye_of_sauron.close();
		if (eye_of_horus)	eye_of_horus.close();
		if (eye_of_saturn)	eye_of_saturn.end();
		if (all_seeing_eye)	all_seeing_eye.end();
		return;
	}

	function watchIt() {
		console.log('watching it...');
	}

	function watchScss() {
		// close the watch if it exists
		if (eye_of_sauron) eye_of_sauron.close();

		// new watching method to rid ourselves of gulp
		var watch_list = [site.directory + '/scss/**/*.scss', site.directory + '/scss/**/*.sass'];
		eye_of_sauron = chokidar.watch(watch_list, { ignoreInitial: true });
		eye_of_sauron.on('change', function(path) {
			scssBuilder(path);
		})
		.on('add', function(path) {
			scssBuilder(path);
		});
		// ran by the watcher to compile and minify scss
		function scssBuilder(path) {
			var source_file = path.replace(/^(.*\/)(.*)\.(.*)$/, '$2.$3');

			// check if file is an include file
			if (source_file.match(/^\_.*/)) {
				// TODO find parent source
				console.log('need to compile the parent files... but not doing it now!');
				return;
			}
			var dest_folder = site.directory + '/css/';
			var dest_css = dest_folder + path.replace(/^(.*\/)(.*)\.(.*)$/, '$2.css');
			var dest_min = dest_folder + path.replace(/^(.*\/)(.*)\.(.*)$/, '$2.min.css');
			var dest_map = dest_folder + path.replace(/^(.*\/)(.*)\.(.*)$/, '$2.css.map');

			var sass_options = {
				file: path,
				outputStyle: 'expanded',
				outFile: path.replace(/^(.*\/)(.*)\.(.*)$/, '$2.css'),
				sourceMap: true
			};

			sass.render(sass_options, function(err, result) {
				if (err) {
					logit.log('scss', 'sass failed to compile', 'fail');
					console.log(err);
				} else {
					if (!fs.existsSync(dest_folder)) {
						logit.log('scss', 'created css directory for files...');
						fs.mkdirSync(dest_folder);
					}

					var ccss_options = {
						// see https://www.npmjs.com/package/clean-css
					};

					var minified = new ccss(ccss_options).minify(result.css).styles;
					fs.writeFileSync(dest_min, minified);
					fs.writeFileSync(dest_css, result.css);
					//fs.writeFileSync(destination, result.css);
					browserSync.reload([dest_css, dest_min]);
					fs.writeFileSync(dest_map, result.map);
					logit.log('scss', 'compiled and minified ' + source_file, 'pass');
					site.setStatus({ gitstatus: 'uncommited' });
				}
			});
		}
	}

	function watchHtml() {
		// html task to reload browser on change
		if (eye_of_horus)	eye_of_horus.close();

		// new watching method to rid ourselves of gulp
		var watch_list = [site.directory + '/*.html'];
		eye_of_horus = chokidar.watch(watch_list, { ignoreInitial: true });

		eye_of_horus.on('change', function(path) {
			handleHtml(path);
		})
		.on('add', function(path) {
			handleHtml(path);
		})

		function handleHtml(path) {
			site.setStatus({ gitstatus: 'uncommited' });
			browserSync.reload();
		}
	}

	function watchJSON() {
		// watch json template building files for changes
		var watchlist = [site.directory + '/build/**/.*.json', site.directory + '/build/**/**/.*.json'];
		var jsonfile, njfile;

		// render nunjucks template files
		gulp.task('rendernj', function() {
			return gulp.src(watchlist)
			.pipe(tap(function(file,t) {
				jsonfile = path.dirname(file.path) + '/' + path.basename(file.path);
				njfile = jsonfile.replace(/json$/, 'nj.js');
				console.log(jsonfile + ' -> ' + njfile);
			}))
			.pipe(gcb(function(){
				console.log('rendering nj...');
				site.setStatus({ gitstatus: 'uncommited' });
			}));
		});

		// watch for JSON file changes (represents a change in the config of modules)
		if (eye_of_saturn) {
			// stop the watch in the rare case that it should ever exist
			eye_of_saturn.end();
		}
		// start the watch again
		eye_of_saturn = gulp.watch(watchlist, ['rendernj']);
	}

	function watchJs() {
		// watch js files for change
		var ignorelist = ['!' + site.directory + '/build/**/*.nj.js', '!' + site.directory + '/build/**/.*.nj.js'];
		var watchlist = [site.directory + '/build/**/*.js', site.directory + '/build/**/.*.js'];
		var buildlist = [site.directory + '/build/modules/**/.*.js', site.directory + '/build/.init.js', site.directory + '/build/init_options.js'];
		watchlist = watchlist.concat(ignorelist);
		buildlist = buildlist.concat(ignorelist);
		// js task compile and reload browser
		gulp.task('buildjs', function() {
			return gulp.src(buildlist)
			.pipe(concat(site.name + '.js'))
			.pipe(gulp.dest(site.directory + '/js'))
			.pipe(gcb(function(){
				console.log('js watch!');
				site.setStatus({ gitstatus: 'uncommited' });
			}));
		});

		gulp.task('lintjs', ['buildjs'], function() {
			return gulp.src([site.directory + '/js/*.js', '!' + site.directory + '/js/*.min.js'])
			.pipe(jshint()).on('error', gutil.log)
			.pipe(jshint.reporter('jshint-stylish'))
			.pipe(jshint.reporter('fail')).on('error', function(err) {
				var errormsg = site.name + ' failed js linting';
				logit.log('buildjs', errormsg, 'fail');
				this.emit('end');
			})
			.pipe(uglify()).on('error', gutil.log)
			.pipe(rename({extname: '.min.js'}))
			.pipe(gulp.dest(site.directory + '/js'))
			.pipe(gzip())
			.pipe(rename({extname: '.gz'}))
			.pipe(gulp.dest(site.directory + '/js'))
			.pipe(gcb(function() {
				var msg = 'exported js files';
				logit.log('buildjs', msg);
				browserSync.reload();
			}));
		});

		if (all_seeing_eye) {
			// stop the watch
			all_seeing_eye.end();
		}
		// start the watch again
		all_seeing_eye = gulp.watch(watchlist, ['lintjs']);
	}

	function startBrowserSync() {
		// promisified
		logit.log('initialization', 'beginning browersersyncification');
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
					logit.log('server started', msg, 'green');
					return resolve(true);
				});
			}
			catch(err) {
				var msg = 'failed to start browsersync';
				logit.log('server fail', msg, 'fail');
				return reject(err);
			}
		});
	}
}
