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

Redo springboard-modules (v3 focused)

Redo watchers with browserify (option for proxy)
  - proxy @ 1336

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
var fs = require('fs');
var colors = require('colors');

// browsersync
// var browserSync = require('browser-sync');

var logit = require('_/logit');
var gitmo = require('_/gitmo');
var lib = require('./lib/catalogs');

var fspro = require('_/fspro');

// local modules
var website = require('./lib/site.js');
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
		current_site: '',
		email: ''
	};

	var sites = {};				// object containing all site objects
	var site;							// points to the current site being edited (watched)
	var modules = {};			// object containing all modules (and associated themes and plugins)
	var library;					// object containing all catalogs

	// site and modules repository objects
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
			// setup site repository
			repos.sites = repo;

			return repoInit(options.modules_repo_dir, options.modules_repo);
		}).then(repo => {
			// setup springboard module repository
			repos.modules = repo;

			logit.log('initializing springboard library', '', 'white');
			return lib.load(options.modules_repo_dir);
		}).then(libs => {
			library = libs;
			printCatalogs(library.getData(), 'white');

			return loadLastState();
		}).catch(function(err) {
			logit.log('initialization', 'failed', 'fail');
			throw err;
		});
	}

	self.getOptions = () => {
		return options;
	}

	self.getLibrary = () => {
		return library.getData();
	}

	self.getCatalog = function(catalog) {
		if (catalog === undefined) {
			return { error: true, message: 'please choose a catalog...' };
		}
		if (library.catalogs[catalog]) {
			return library.catalogs[catalog].getData();
		} else {
			return { error: true, message: 'catalog ' + catalog + ' not found.' };
		}
	}

	// return sites
	self.getSites = function() {
		try {
			return Object.keys(sites).reduce(function(sites_array, site) {
				sites_array.push(sites[site].getLibrary());
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
				return site.getLibrary();
			} else {
				return { error: true, message: 'not editing a site...' };
			}
		}
		if (sites[asite]) {
			return sites[asite].getLibrary();
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

			logit.log('loading sites', '', 'blue');

			return fspro.readDir(options.sites_repo_dir);
		}).then(folders => {
			folders = folders.map(folder => {
				return path.join(options.sites_repo_dir, folder);
			});
			return fspro.lstat(folders);
		}).then(stats => {

			let site_promises = [];

			for (let stat of stats) {
				// ignore non directories... or hidden folders (^.*)
				let name = path.basename(stat.path);

				if (stat.isDirectory() && !name.match(/^\./)) {
					site_promises.push(website(name, stat.path))
				}
			}
			return Promise.all(site_promises);
		}).then(websites => {
			// first empty sites object (to start fresh)
			for (var del in sites) delete sites[del];

			for (let website of websites) {
				sites[website.name] = website;
				process.stdout.write('   .'.bold.blue);
			}

			site = undefined;
			if (websites) console.log('\n');
			logit.log('load complete', websites.length + ' sites loaded', 'blue');

			return self.getSites();
		}).catch(error => {
			console.log(error);
			return error;
		});
	}

	// create new site
	// assuming that current site has been commited
	self.addSite = function(details) {

		// // new site defaults
		// this.branch = 'site/' + this.name;
		// this.created = new Date().getTime();
		// this.proxy = this.proxy || false;
		// this.proxy_url = this.proxy_url || '';
		// this.default_html = this.name + '.html';
		// this.thumb = '/images/working.png';
		// this.history = [];

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
		}).then(() => {
			// check if site already exists
			if (fs.existsSync(options.sites_repo_dir + '/' + details.name)) {
				throw { error: true, action: 'addSite', message: details.name + ' already exists!' };
			}
			// TODO add preset options
			return repos.sites.checkout('site/_template');
		}).then(() => {
			// checkout new branch
			return repos.sites.checkout('site/' + details.name, ['-b']);
		}).then(() => {
			// create new folder
			var site_folder = options.sites_repo_dir + '/' + details.name;
			fs.mkdirSync(site_folder);
			try {
				details.directory = options.sites_repo_dir + '/' + details.name;
				details.status = 'new';
				sites[details.name] = new Website(details, user);
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
				throw { error: true, action: 'addSite', message: 'Failed to create: ' + details.name + '; ' + err };
			}

			logit.log('new site', 'new branch created for ' + site.name, 'pass');
			console.log(site.directory.green + '\n');

			var commitmsg = 'CREATED >>> ' + site.name;
			return self.commitSite(commitmsg);
		}).then(() => {
			return self.pushSite();
		}).then(() => {
			var mergemsg = 'MERGED CREATION >>> ' + site.name;
			return mergeSite();
		}).then(() => {
			self.editSite(site.name);
			return site;
		}).catch((err) => {
			console.log(err);
			return err;
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
				return site.reload();
			}).then(() => {
				logit.log('pulled', site.name + ' has been pulled from gitland', 'pass');

				logit.log('loading site ' + site.name, '', 'blue');

				printCatalogs(site.getLibrary().catalogs, 'blue');

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

				return site.getLibrary();
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

	// install catalog module or theme
	self.install = function(info) {

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
			// move generated files (js, html, css) into 'live' folder
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
		return fspro.exists(repo_dir).then(stats => {
			if (stats) {
				// proceed
				return Promise.resolve();
			} else {
				// setup repo
				logit.log('initialization', 'cloning ...');
				return gitmo.clone(repo_dir, repo);
			}
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
				throw 'load sites';
			} else if (stats.branch == 'site/' + user.current_site) {
				return website(user.current_site, options.sites_repo_dir + '/' + user.current_site);

			} else if (!user.current_site) {
				throw new Error('Not on a valid site!')
			} else {
				throw new Error('Repository out of sync with Springboard!');
			}
		}).then(loaded_site => {
			sites[user.current_site] = loaded_site;

			return self.editSite(user.current_site)
		}).catch(err => {
			if (err == 'load sites') {
				return self.loadSites();
			} else {
				throw err;
			}
		}).then(() => {
			return;
		}).catch(error => {
			throw (error);
		});
	}

	// to be used on site creation ONLY for now...
	// must have changes commited and pushed
	function mergeSite(message) {
		if (!site) return { error: true, message: 'not editing a site...' };

		if (!message) {
			message = user.name + '@springboard >>> MERGED >>> ' + site.name;
		} else {
			message = user.name + '@springboard >>> ' + message;
		}

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
			return repos.sites.merge(site.branch, ['--commit', '-m "' + message +'"']);
		}).then(() => {
			return repos.sites.push('origin', 'master');
		}).then(() => {
			logit.log('merged', site.name + ' >>> ' + 'master', 'warn');
			return;
		}).catch((err) => {
			console.log(err);
			return err;
		});
	}

	function printCatalogs(data, color) {
		// loop through catalogs/modules/themes

		for (let cat in data) {
			logit.log(cat, '', color);

			let line;
			let mod_cnt = 1;
			let mod_total = Object.keys(data[cat].modules).length;

			for (let a_mod in data[cat].modules) {
				// style last line differently
				if (mod_cnt != mod_total) {
					 line = ' ├ ';
				} else {
					line = ' └ ';
				}
				line += data[cat].modules[a_mod].type + ' v' + data[cat].modules[a_mod].version;
				console.log(line[color]);

				// loop through themes
				var thm_cnt = 1;
				var thm_total = Object.keys(data[cat].modules[a_mod].themes).length;
				if (thm_total > 0) {
					if (mod_cnt != mod_total) line = ' │   themes';
					else line = '     themes';
					console.log(line[color]);
				}
				for (var a_thm in data[cat].modules[a_mod].themes) {
					// style last line differently
					if (thm_cnt != thm_total) {
						if (mod_cnt != mod_total) line = ' │    ├ ';
						else line = '      ├ ';
					} else {
						if (mod_cnt != mod_total) line = ' │    └ ';
						else line = '      └ ';
					}
					line += data[cat].modules[a_mod].themes[a_thm].type + ' v' + data[cat].modules[a_mod].themes[a_thm].version;
					console.log(line[color]);
					thm_cnt++;
				}
				mod_cnt++;
			}
		}
	}

}

/*
const webshot = require('webshot');
const lwip = require('lwip');

const capture = (url) => {
	// promisified
	return new Promise(function(resolve, reject) {
		var options = {
			screenSize: { width: 1280, height: 720 },
			shotSize: { width: 1280, height: 720 },
			renderDelay: 1200
		};

		// variables for files'n'stuff
		var thumb_dir = self.directory + '/.thumbs/';
		var output_file = self.name + '.png';
		var output_path = thumb_dir + output_file;
		var url = 'http://localhost:' + global.port + '/sites/' + self.name + '/' + self.default_html;

		try {
			webshot(url, output_path, options, function(err) {
				// after taking screen capture scale image to thumbnail size using lwip
				// lwip.open(output_path, function(err, image) {
				// 	if (err) return reject(err);
				//
				// 	// scale image
				// 	image.scale(0.50, function(err, image) {
				// 		if (err) return reject(err);
				//
				// 		image.writeFile(output_path, function(err) {
				// 			if (err) return reject(err);
				// 			self.thumb = '/sites/' + self.name + '/' + '.thumbs/' + output_file;
				// 			self.saveConfig();
				// 			return resolve(true);
				// 		});
				// 	});
				// });
			});
		} catch(err) {
			console.error(err);
			return reject(err);
		}
	});
}

*/
