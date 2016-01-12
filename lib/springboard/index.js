// searchspring springboard
// controller of the spring
// manages sites and watches 1 site file structure (git branch) for autobuilding
// manages github and s3 connection for site

// queue for site publishing?

// includes css injection / browser reload

/*

avg ram usage 112MB, 97MB, 114MB, 100MB

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


2.	get s3 uploading working

3.	update UI
		a.	main menu dropdown
		b.	editor menu dropdown
				|-	publish buttons (commit, push, publish, merge)
				|-	tabbed settings (modules, config etc...)
		c.	gallery (view sites)

x.	playable theme/module sandbox


To read:
http://chimera.labs.oreilly.com/books/1234000000262/index.html
http://davidwalsh.name/javascript-objects
https://medium.com/javascript-scene/common-misconceptions-about-inheritance-in-javascript-d5d9bab29b0a

Angular:
http://www.ng-newsletter.com/posts/beginner2expert-services.html
ng-switch:
http://stackoverflow.com/questions/16649617/angularjs-change-partial-in-controller-on-click

NEXT TODO
Refactor and restructure code; fix promises (git library, etc...)
Verify all functionality and fix bugs

Redo watchers with browserify (option for proxy)
  - proxy @ 1336

Redo springboard-modules

Finish out remaining tabs in sbc

Write hooke (proxy with hoxy)
  - proxy @ 1338

Move modules folder to repository
Require user entry of name and s3 info

Refactor code; move all sync -> async

MUCH LATER TODO
Add ace editor.
Allow direct edit/save of key files:
  - init code
  - templates
	- scss

*/


// strictness!
'use strict';

// include packages
var path = require('path');
var fs = require('fs-extra');
var colors = require('colors');

// browsersync
// var browserSync = require('browser-sync');

var logit = require('_/logit');
var gitmo = require('_/gitmo');

// local modules
var core = require('./lib/core/');
var Website = require('./lib/website.js');
var mod = require('./lib/mod.js');
//var s3w = require('./lib/s3w');

module.exports = new springboard();

function springboard() {
	var self = this;

	// default user
	var user = {
		name: 'anon',
		s3_key_id: '',
		s3_key_secret: '',
		recent_sites: [],
		current_site: ''
	};

	var sites = {};				// object containing all site objects
	var site;							// points to the current site being edited (watched)
	var modules = {};			// object containing all modules (and associated themes and plugins)

	var repos = { sites, modules };
	var options;

	/*	_________________	*\
	//										\\
	//	 public methods 	\\
	//	_________________	\\
	\*										*/


	self.init = function(config) {
		options = config;

		// output version
		var title = '           spr1ngb0ard           ';
		var ver = 'version [' + options.version +']';
		logit.log(title.trap, ver, 'red');

		checkConfig();

		return repoInit(options.sites_repo_dir, options.sites_repo).then(repo => {
			repos.sites = repo;
			return repoInit(options.modules_repo_dir, options.modules_repo);
		}).then(repo => {
			repos.modules = repo;
			return loadModules();
		}).then(function() {
			return loadLastState();
		}).catch(function(err) {
			logit.log('initialization', 'failed', 'fail');
			throw err;
		});
	}

	self.getOptions = () => {
		console.log('srsly?');
		return options;
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

	// return sites
	self.getSites = function() {
		try {
			return Object.keys(sites).reduce(function(sites_array, site) {
				sites_array.push(sites[site]);
				return sites_array;
			}, []);
		}
		catch(err) {
			return { error: true, message: err.message };
		}
	}

	// return site under edit (watch)
	self.getSite = function(asite) {
		if (asite === undefined) {
			if (site && site.name) {
				return site;
			} else {
				return { error: true, message: 'not editing a site...' };
			}
		}
		if (sites[asite]) {
			return sites[asite];
		} else {
			return { error: true, message: 'site ' + asite + ' not found.' };
		}
	}

	self.loadSites = function(ignore) {
		// check if site was being worked on to check for uncommited work
		// also check for unpushed commits
		return repos.sites.status().then(stats => {

			console.log(stats);
			if (stats.changes) {
				// there are uncommited changes on current site
				throw { error: true, action: 'commit', message: 'There are uncommited changes!' };
			} else if (stats.ahead && !ignore) {
				// there are unpushed commits on current site
				throw { error: true, action: 'push', message: 'There are unpushed changes!' };
			}

			//watchers.stop();

			return repos.sites.checkout('master');
		}).catch(error => {
			// check for working offline?
			if (!error.error) {
				console.log('offline?');
				error.message = 'Working offline...';
			}
			throw error;
		}).then(() => {
			return repos.sites.pull('origin', 'master');
		}).then(() => {
			logit.log('syncing repository', 'updating local copy of repository');
			// load the sites
			var total = 0;
			logit.log('loading sites', '', 'blue');

			var folders = fs.readdirSync(options.sites_repo_dir);
			// first empty sites object (to start fresh)
			for (var del in sites) delete sites[del];

			for (var folder of folders) {
				// ignore non directories... or hidden folders (^.*)
				if (!fs.lstatSync(options.sites_repo_dir + '/' + folder).isDirectory() || folder.match(/^\./))
					continue;
				// build out the sites object...
				// with website objects...
				// fill sites with sites...
				sites[folder] = new Website({ name: folder, directory: options.sites_repo_dir + '/' + folder }, user);
				if (!sites[folder].valid) {
					delete sites[folder];
					throw(folder);
				}
				else {
					process.stdout.write('   .'.bold.blue);
					total++;
				}
			}
			site = undefined;
			if (folders) console.log('\n');
			logit.log('load complete', total + ' sites loaded', 'blue');

			return self.getSites();
		}).catch(error => {
			console.log(error);
			return error;
		});
	}

	// create new site
	// assuming that current site has been commited
	self.addSite = function(details) {
		// promisified
		return new Promise(function(resolve, reject) {

			// TODO
			// check if site was being worked on to check for uncommited work
			// commit site if so.
			self.gitStatus().then(function(status) {
				if (status.changes) {
					// there are uncommited changes on current site
					return reject({ error: true, message: 'There are uncommited changes!' });
				} else if (status.ahead) {
					// there are unpushed commits on current site
					return reject({ error: true, message: 'There are unpushed changes!' });
				}

				return gitReset();
			}).then(function() {
				git.checkout('master', function(err) {
					if (err) return reject(err);

					// check if site already exists
					if (fs.existsSync(options.sites_repo_dir + '/' + details.name)) {
						return reject(Error(details.name + ' already exists!'));
					}
					else {
						git.checkout('site/_template', function(err) {
							if (err) return reject(err);
						}).checkoutLocalBranch('site/' + details.name, function (err) {
							if (err) return reject(err);
						}).then(function() {
							// create new folder
							var site_folder = options.sites_repo_dir + '/' + details.name;
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
								details.directory = options.sites_repo_dir + '/' + details.name;
								details.status = 'new';
								sites[details.name] = new Website(details, user, git, s3);
								site = sites[details.name];
								if (!sites[details.name].valid) {
									delete sites[details.name];
									site = {};
									throw(details.name);
								} else {
									user.current_site = site.name;
									writeConfig();
								}
							}
							catch(err) {
								var errormsg = 'failed to create: ' + err;
								throw(errormsg);
							}
						}).then(function() {
							var commitmsg = user.name + '@springboard >>> CREATED >>> ' + site.name;
							mergeSite(commitmsg).then(function() {
								logit.log('new site', 'new branch created for ' + site.name, 'pass');
								console.log(site.directory.green + '\n');
								self.editSite(site.name);
								return resolve(site);
							}).catch(function(err) {
								console.error(err);
								return reject(err);
							});
						});
					}
				});
			});
		});
	}

	self.editSite = function(thesite) {
		// function returns a site object
		console.log('editing site...');
		if (sites[thesite]) {

			//watchers.stopWatch();
			site = sites[thesite];

			return repos.sites.status().then(stats => {
				console.log(site);
				console.log('checking status [edit site]...');
				console.log(stats);
				// TODO check for changes to current site
				return repos.sites.checkout(site.branch);
			}).then(() => {
				return repos.sites.pull('origin', site.branch);
			}).then(() => {
				// reload site config to match actual repo if not offline
				site.getConfig();
				logit.log('pulled', site.name + ' has been pulled from gitland', 'pass');

				// recent sites
				var recents = user.recent_sites.indexOf(site.name);
				if (recents != -1) {
					user.recent_sites.splice(recents, 1);
				}
				var max_number_of_recents = 12;
				if (user.recent_sites.push(site.name) > max_number_of_recents) {
					user.recent_sites.shift();
				}
				user.current_site = site.name;
				writeConfig();

				// start watchers

				logit.log('editing site', 'now watching for changes on ' + site.name.bold, 'warn');

				return site;
			}).catch(err => {
				console.log('got an error... [edit site]');
				console.log(err);
				throw(err);
			});
		}
		else {
			// not a valid site...
			throw(new Error(thesite + ' is not a valid site!'));
		}
	}

	// install module or plugin or theme
	self.install = function(info) {
		// promisified
		return new Promise(function(resolve, reject) {
			try {
				// ensure a site is currently being edited
				if (site.directory) {
					if (info.install == 'module') {

						// ensure module type is valid
						if (!modules[info.type]) throw('Invalid module type!');

						// check if the name is in use by other modules
						if (site.modules[info.name]) throw('Module ' + info.name + ' already exists!');

						// install module
						site.installModule({ name: info.name, type: info.type, template_dir: modules[info.type].directory })
						.then(function(status) {
							// success!!!
							return resolve(site);
						}).catch(function(err) {
							// fail!!!
							return resolve({ error: true, message: err.message });
						});
					} else if (info.install == 'theme' || info.install == 'plugin') {

						if (info.install == 'theme') {
							var type = (site.modules[info.module]) ? site.modules[info.module].type : false;
							if ( !type || !modules[type]) throw('Invalid module!');
							else if (!modules[type].themes[info.theme]) throw('Theme does not exist!');
							else {
								info.template_dir = modules[type].directory;
								site.installTheme(info).then(function() {
									// success!!!
									return resolve(site);
								}).catch(function(err) {
									return resolve({ error: true, message: err.message });
								});
							}
						}

						// TODO plugin
						// should autocompile plugin and themes on install (eye of chokidar)
					} else {
						// not a valid install type (module, theme, plugin)
						throw('Invalid install type!');
					}
				} else {
					throw('Not editing a site!');
				}
			} catch (err) {
				return resolve({ error: true, message: err });
			}
		});
	}

	// update the current site
	self.updateSite = function(changes) {
		if (site && site.name) {
			// TODO this...
		} else {
			return { error: true, message: 'Not editing a site!' };
		}
	}

	/* ************************** */
	//  GIT REPOSITORY functions  //
	/* ************************** */

	self.commitSite = function(message) {
		if (!site) return { error: true, message: 'not editing a site...' };

		if (!message) message = user.name + '@springboard >>> COMMITED >>> ' + site.name;
		else message = user.name + '@springboard >>> ' + message;

		return repos.sites.status().then(stats => {
			if (!stats.changes) {
				throw({ error: false, site: site.name, action: 'commit', message: 'nothing to commit' });
			}
			return repos.sites.add(site.directory);
		}).then(() => {
			return repos.sites.commit(message);
		}).then(() => {
			logit.log('commit', message, 'pass');
			return { error: false, site: site.name, action: 'commit', message: 'success' };
		}).catch(err => {
			logit.log('commit', site.name.bold + ' ' + err.message);
			return err;
		});
	}

	self.pushSite = function() {
		if (!site) return { error: true, message: 'not editing a site...' };

		return repos.sites.push('origin', site.branch, ['-u']).then(() => {
			logit.log('pushed', site.name + ' has been pushed to gitland', 'pass');
			return { error: false, site: site.name, action: 'push', status: 'success', message: 'site pushed to the repo' };
		}).catch(error => {
			throw { error: true, site: site.name, action: 'push', message: err.message };
		});
	}

	self.publishSiteMockup = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			if (!site) return reject({ error: true, message: 'not editing a site...' });
			// TODO
			// move production files (js, html, css) into 'live' folder
			site.capture().then(function() {
				// TODO some s3 stuff...
				// copy mockup data into s3 mockup folder
				logit.log('publish', site.name + ' has been published to S3 MOCKUP', 'pass');
				return resolve( { error: false, site: site.name, action: 'publish', status: 'success', message: 'published mockup files to s3' } );
			}).catch(function(err) {
				logit.log('publish', 'failed to publish' + site.name, 'fail');
				console.error(err.red);

				return reject({ error: true, site: site.name, action: 'publish', status: 'failed', message: err.message });
			});
		});
	}

	self.resetSite = function() {
		return repos.sites.clean(['-fd']).then(() => {
			return repos.sites.reset(['--hard']);
		}).then(() => {
			return { error: false, site: site.name, action: 'reset', status: 'success' };
		}).catch(error => {
			throw { error: true, site: site.name, action: 'reset', status: 'failed', message: err.message };
		});
	}

	/****************/
	// s3 functions //
	/****************/

	self.publishSiteLive = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			if (!site) return reject({ error: true, message: 'not editing a site...' });
			// TODO
			// move production files (js, html, css) into 'live' folder
			site.capture().then(function() {
				var commitmsg = user.name + '@springboard >>> PUBLISHED LIVE >>> ' + site.name;
				return self.pushSite(commitmsg);
			}).then(function() {
				// TODO some s3 stuff...
				// copy site data into s3 site folder
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

	function checkConfig() {
		// check for config file and read it
		if (fs.existsSync(options.user_config)) {
			//console.log('config file exists!');
			try {
				user = JSON.parse(fs.readFileSync(options.user_config));
				// check for valid options and version
				// TODO
				// create s3 object
				//var keys = { s3_key_id: user.s3_key_id, s3_key_secret: user.s3_key_secret };
				//s3 = new s3w(keys);
			} catch(err) {
				console.error(err);
				return reject(err);
			}
		}
		else {
			logit.log('initialization', 'created new config file');
			writeConfig();
		}
	}

	function writeConfig() {
		try {
			fs.writeFileSync(options.user_config, JSON.stringify(user, null, 2));
		}
		catch(err) {
			logit.log('config file', 'failed to write springboard config', 'fail');
			console.error(err);
		}
		return;
	}

	function repoInit(repo_dir, repo) {
		return core.exists(repo_dir).catch(error => {
			logit.log('initialization', 'cloning ...');
			return gitmo.clone(repo_dir, repo);
		}).then(() => {
			return gitmo(repo_dir);
		}).catch(error => {
			throw(error);
		});
	}

	function loadLastState() {
		return repos.sites.status().then(stats => {
			console.log('loading last state', stats);
			if (stats.branch == 'master') {
				// no current site
				self.loadSites().then(() => {
					console.log('loaded sites...');
					return;
				}).catch(error => {
					throw (error);
				});
			} else if (stats.branch == 'site/' + user.current_site) {
				try {
					sites[user.current_site] = new Website({ name: user.current_site, directory: options.sites_repo_dir + '/' + user.current_site }, user);

					if (!sites[user.current_site].valid) throw new Error('Site is invalid!');

					logit.log('loading site ' + user.current_site, '', 'blue');
					self.editSite(user.current_site).then(() => {
						return;
					}).catch(error => {
						throw (error);
					});
				} catch(error) {
					throw (error);
				}
			} else if (!user.current_site) {
				throw new Error('Not on a valid site!')
			} else {
				throw new Error('Repository out of sync with Springboard!');
			}
		});
	}

	// to be used on site creation ONLY for now...
	function mergeSite(message) {
		// promisified
		return new Promise(function(resolve, reject) {
			if (message === undefined) {
				message = user.name + '@springboard >>> MERGED >>> ' + site.name;
			}
			self.pushSite(message).then(function(){
				git.checkout('master', function(err) {
					if (err) return reject(err);
				}).merge(message, 'site/' + site.name, function(err) {
					if (err) return reject(err);
				}).push('origin', 'master', function(err) {
					if (err) return reject(err);

					logit.log('merged', site.name + ' >>> ' + 'master', 'warn');
					return resolve(true);
				});
			}).catch(function(err) {
				// TODO FIX THIS
				// check if offline
				if (err.message.indexOf('Could not resolve hostname') > -1) {
					logit.log('warning', 'working offline!', 'fail');
					console.log('unable to merge new site...'.red);
					return resolve(true);
				} else {
					console.log(err);
					return reject(err);
				}
			});
		});
	}

	function loadModules() {
		// promisified
		return new Promise(function(resolve, reject) {
			try {
				var folders = fs.readdirSync(options.modules_repo_dir);
			}
			catch(err) {
				console.error(err);
				reject(err);
			}
			// first empty modules object (to start fresh)
			for (var del in modules) delete modules[del];

			logit.log('loading modules', '', 'blue');
			// load up the modules
			for (var folder of folders) {
				// ignore non directories... or hidden folders (^.*)
				var module_dir = options.modules_repo_dir + '/' + folder;

				if (!fs.lstatSync(module_dir).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop

				// create module object
				try {
					modules[folder] = new mod({ name: folder, directory: module_dir });
					if (!modules[folder].valid) delete modules[folder];
				}
				catch(err) {
					console.log('failed at creating module object...'.red);
					console.error(err);
					reject(err);
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
			resolve(true);
		});
	}

}
