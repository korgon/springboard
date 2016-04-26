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
1.	get watchers working

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
*** Verify all functionality and fix bugs

* Add settings page and require initial setup

* Finish out UI tabs
Finish UI design for inputs
Add json watcher

* Implement s3 capabilities incorporate into file viewer

* Finish out Settings tabs
Incorporate hoxy proxy
Add history recording
Add tagging system



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

var browsersync = require('browser-sync');

var logit = require('_/logit');
var gitmo = require('_/gitmo');
var lib = require('./catalogs');

var fspro = require('_/fspro');

// local modules
var website = require('./site.js');
var userconf = require('./user.js');
var watchers = require('./watchers');
//var s3w = require('./lib/s3w');

module.exports = new springboard();

function springboard() {
	var self = this;

	var options;					// object for holding springboard config
	var user;							// object containing user config and methods
	var sites = {};				// object containing all site objects
	var site;							// points to the current site being edited (watched)
	var library;					// object containing all springboard catalogs

	// browsersync instantiation
	var bs;

	// site and library repository objects
	var repos = { sites, library };


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

		return userconf(options.user_config).then(userobj => {
			// set user to loaded object
			user = userobj;

			// initialize the sites repo
			return repoInit(options.sites_repo_dir, options.sites_repo);
		}).then(repo => {
			// setup site repository
			repos.sites = repo;

			// initialize the library repo
			return repoInit(options.library_repo_dir, options.library_repo);
		}).then(repo => {
			// setup springboard module repository
			repos.library = repo;

			logit.log('initializing springboard library', '', 'white');
			return lib.load(options.library_repo_dir);
		}).then(libs => {
			library = libs;
			printCatalogs(library.getData(), 'white');
			return startBrowserSync();
		}).then(() => {
			logit.log('server started', 'http://localhost:' + options.app_port + '/');
			watchers.init(options, bs);
			return loadLastState();
		}).catch(function(err) {
			logit.log('initialization', 'failed', 'fail');
			throw err;
		});
	}

	self.getOptions = () => {
		return options;
	}

	self.getStatus = () => {
		let userdata = user.getData();
		let status = {
			setup: true,
			user: userdata.name,
			recents: userdata.recent_sites
		}
		if (userdata.name == '' || userdata.email == '') {
			status.setup = false;
		}

		return status;
	}

	self.getUser = () => {
		return user.getData();
	}

	self.updateUser = (userdata) => {
		return user.update(userdata);
	}

	self.getLibrary = () => {
		try {
			return library.getData();
		}
		catch(err) {
			return { error: true, message: err.message };
		}
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
				sites_array.push(sites[site].getSite());
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
				return site.getSite();
			} else {
				return { error: true, message: 'not editing a site...' };
			}
		}
		if (sites[asite]) {
			return sites[asite].getSite();
		} else {
			return { error: true, message: 'site ' + asite + ' not found.' };
		}
	}

	// reload site under edit
	self.reloadSite = function(asite) {
		if (asite === undefined) {
			if (site && site.name) {
				asite = site.name;
			} else {
				return { error: true, message: 'not editing a site...' };
			}
		}
		if (sites[asite]) {
			return sites[asite].reload().then(() => {
				return watchers.watch(sites[asite]);
			}).then(() => {
				return sites[asite].getSite();
			});
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

			watchers.stop();

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
			logit.log('syncing site repository', 'updating local copy of repository');
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

			let count = 0;

			for (let website of websites) {
				if (website.name) {
					sites[website.name] = website;
					process.stdout.write('   .'.bold.blue);
					count++;
				}
			}

			site = undefined;
			if (websites) console.log('\n');
			let loadmsg = count + ' site' + (count > 1 ? 's' : '') + ' loaded';
			logit.log('load complete', loadmsg, 'blue');

			return self.getSites();
		}).catch(error => {
			console.log(error);
			return error;
		});
	}

	// create new site
	// assuming that current site has been commited
	self.addSite = function(details) {
		let site_dir = options.sites_repo_dir + '/' + details.name;

		// template used for new sites
		const new_site = {
			name: details.name,
			siteid: details.siteid,
			cart: details.cart,
			created: new Date().getTime(),
			proxy: false,
			proxy_url: '',
			default_html: details.name + '.html',
			thumb: '/images/working.png',
			history: []
		}

		// check to see if there are branch changes
		return repos.sites.status().then(stats => {
			console.log(stats);
			if (stats.changes) {
				// there are uncommited changes on current site
				throw { error: true, action: 'commit', message: 'There are uncommited changes!' };
			} else if (stats.ahead && !ignore) {
				// there are unpushed commits on current site
				throw { error: true, action: 'push', message: 'There are unpushed changes!' };
			}

			watchers.stop();

			return repos.sites.checkout('master');
		}).catch(error => {
			// check for working offline?
			if (!error.error) {
				console.log('offline?');
				error.message = 'Working offline...';
			}
			throw error;
		}).then(() => {
			logit.log('syncing site repository', 'updating local copy of repository');
			return repos.sites.pull('origin', 'master');
		}).then(() => {
			// check if site already exists
			return fspro.exists(site_dir);
		}).then(stats => {
			if (stats) {
				throw { error: true, action: 'addSite', message: details.name + ' already exists!' };
			} else {
				// check if the branches exist (site branch and template branch)
				return repos.sites.branch(['-a']);
			}
		}).then(branches => {
			var template = 'template/v3';
			var site_match = new RegExp('site\/' + details.name);
			var found_template = false;

			branches.forEach(function(branch){
				// look for new site branch
				if (branch.match(site_match)) {
					throw { error: true, action: 'addSite', message: 'site/' + details.name + ' branch already exists!' };
				}

				if (branch.match(template)) {
					found_template = true;
				}
			});

			if (!found_template) {
				throw { error: true, action: 'addSite', message: template + ' template does not exists!' };
			}

			return repos.sites.checkout(template);
		}).then(() => {
			// checkout new branch
			return repos.sites.checkout('site/' + details.name, ['-b']);
		}).then(() => {
			// rename example.com folder from template to site name
			let template_dir = options.sites_repo_dir + '/example.com';
			return fspro.rename(template_dir, site_dir);
		}).then(() => {
			// modify defaults and write to JSON
			let json_file = site_dir + '/' + '.' + details.name + '.json';

			return fspro.writeFile(json_file, JSON.stringify(new_site, null, 2));
		}).then(() => {
			// load site from JSON
			return website(details.name, site_dir);
		}).then(loaded_site => {
			sites[details.name] = loaded_site;
			site = loaded_site;
			// update user config
			return user.switchSite(site.name);
		}).then(() => {
			logit.log('new site', 'new branch created for ' + site.name, 'pass');
			var commitmsg = 'CREATED >>> ' + site.name;
			return self.commitSite(commitmsg);
		}).then(() => {
			return self.pushSite();
		}).then(() => {
			var mergemsg = 'MERGED CREATION >>> ' + site.name;
			return mergeSite(mergemsg);
		}).then(() => {
			return self.editSite(site.name);
		}).then(() => {
			return self.getSite();
		}).catch((err) => {
			throw err;
		});
	}

	self.editSite = function(thesite) {
		// function returns a site object
		console.log('editing site...');
		if (sites[thesite]) {
			site = sites[thesite];

			return repos.sites.status().then(stats => {
				// TODO check for changes to current site
				// check if the site branch exists
				return repos.sites.branch(['-a']);
			}).then(branches => {
				let match;

				branches.forEach(branch => {
					if (branch.match('site/' + thesite)) match = true;
				});

				if (!match) {
					throw { error: true, action: 'editSite', message: site.branch + ' branch does not exists!' };
				}

				return repos.sites.checkout(site.branch);
			}).then(() => {
				return repos.sites.pull('origin', site.branch);
			}).then(() => {
				// reset the repo when switching sites (to prevent contamination)
				if (user.getCurrentSite() != site.name) {
					return self.resetSite();
				} else {
					return Promise.resolve();
				}
			}).then(() => {
				// reload site config to match actual repo if not offline
				return site.reload();
			}).then(() => {
				logit.log('pulled', site.name + ' has been pulled from gitland', 'pass');

				logit.log('loading site ' + site.name, '', 'blue');

				printCatalogs(site.getSite().catalogs, 'blue');

				// recent sites
				return user.switchSite(site.name);
			}).then(() => {
				// start watchers
				return watchers.watch(site);
			}).then(() => {
				logit.log('editing site', 'now watching for changes on ' + site.name.bold, 'warn');

				return site.getSite();
			}).catch(err => {
				site = undefined;
				self.loadSites();
				//console.log(err);
				throw err;
			});
		}
		else {
			// not a valid site...
			throw new Error(thesite + ' is not a valid site!');
		}
	}

	// install catalog
	self.installCatalog = function(info) {
		if (site && site.name) {
			let install_info = {
				name: info.name,
				directory: site.directory
			}
			if (library.catalogs[info.type]) {
				return library.catalogs[info.type].install(install_info).then(() => {
					return site.reloadCatalogs();
				}).then(() => {
					return site.getSite();
				}).catch(err => {
					throw { error: true, message: err.message };
				});
			} else {
				// invalid catalog type
				return Promise.reject({ error: true, message: 'invalid catalog type' });
			}
		} else {
			return Promise.reject({ error: true, message: 'not editing a site...' });
		}

	}

	// install module
	self.installModule = function(info) {
		console.log(info);
	}

	// install theme
	self.installTheme = function(info) {
		console.log(info);
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

		if (!message) message = user.getName() + '@springboard >>> COMMITED >>> ' + site.name;
		else message = user.getName() + '@springboard >>> ' + message;

		return repos.sites.status().then(stats => {
			if (!stats.changes) {
				throw({ error: false, site: site.name, action: 'commit', message: 'nothing to commit' });
			}
			return repos.sites.add('', ['-A']);
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
		watchers.stop();

		return repos.sites.clean(['-fd']).then(() => {
			return repos.sites.reset(['--hard']);
		}).then(() => {
			return watchers.watch(site);
		}).then(() => {
			return { error: false, site: site.name, action: 'reset', status: 'success' };
		}).catch(error => {
			throw { error: true, site: site.name, action: 'reset', status: 'failed', message: err.message };
		});
	}

	/************************/
	// s3 and git functions //
	/************************/

	self.gitStatus = function() {
		return repos.sites.status().then(stats => {
			return stats;
		});
	}

	self.publishSiteLive = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			if (!site) return reject({ error: true, message: 'not editing a site...' });
			// TODO
			// move production files (js, html, css) into 'live' folder
			site.capture().then(function() {
				var commitmsg = user.getName() + '@springboard >>> PUBLISHED LIVE >>> ' + site.name;
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


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


	function repoInit(repo_dir, repo) {
		return fspro.exists(repo_dir).then(stats => {
			if (stats) {
				// proceed
				return Promise.resolve();
			} else {
				// setup repo
				let repo_name = repo.replace(/.*\/([^\/]*)/, '$1');
				logit.log('initialization', 'cloning ' + repo_name + '...');
				return gitmo.clone(repo_dir, repo);
			}
		}).then(() => {
			return gitmo(repo_dir);
		}).catch(error => {
			throw(error);
		});
	}

	function loadLastState() {
		let current_site = user.getCurrentSite();

		return repos.sites.status().then(stats => {
			console.log('loading last state', stats);
			// based in part on the current_site in user config
			// and part on the branch currently checked out
			if (stats.branch == 'master') {
				// no current site
				throw 'load sites';
			} else if (stats.branch == 'site/' + current_site) {
				return website(current_site, options.sites_repo_dir + '/' + current_site);
			} else {
				throw new Error('Repository out of sync with Springboard!');
			}
		}).then(loaded_site => {
			sites[current_site] = loaded_site;

			return self.editSite(current_site)
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
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		if (!message) {
			message = user.getName() + '@springboard >>> MERGED >>> ' + site.name;
		} else {
			message = user.getName() + '@springboard >>> ' + message;
		}

		return repos.sites.status().then(stats => {
			if (stats.changes) {
				// there are uncommited changes on current site
				throw { error: true, action: 'commit', message: 'There are uncommited changes!' };
			} else if (stats.ahead && !ignore) {
				// there are unpushed commits on current site
				throw { error: true, action: 'push', message: 'There are unpushed changes!' };
			}

			watchers.stop();

			return repos.sites.checkout('master');
		}).catch(error => {
			// check for working offline?
			if (!error.error) {
				console.log('offline?');
				error.message = 'Working offline...';
			}
			throw error;
		}).then(() => {
			return repos.sites.merge(site.branch, ['--commit', '-m "' + message + '"']);
		}).catch(err => {
			if (err) {
				throw err;
			} else {
				// encountered merge conflict due to renaming template directory
				// to resolve add commit and merge...
				// must be a better way, don't feel like digging deeper when this fix works...
				return repos.sites.add('', ['-A']).then(() => {
					return repos.sites.commit(message);
				}).then(() => {
					return repos.sites.merge();
				});
			}
		}).then(() => {
			return repos.sites.push('origin', 'master');
		}).then(() => {
			logit.log('merged', site.name + ' >>> ' + 'master', 'warn');
			return;
		}).catch((err) => {
			console.log('MERGE ERROR!!!...');
			console.log(err);
			throw err;
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
				let mod_name = data[cat].modules[a_mod].name;
				line += mod_name + ' v' + data[cat].modules[a_mod].version;
				console.log(line[color]);

				// loop through themes
				var thm_cnt = 1;
				var thm_total = Object.keys(data[cat].modules[a_mod].themes).length;

				for (var a_thm in data[cat].modules[a_mod].themes) {
					// style last line differently
					if (thm_cnt != thm_total) {
						if (mod_cnt != mod_total) line = ' │   ├ ';
						else line = '     ├ ';
					} else {
						if (mod_cnt != mod_total) line = ' │   └ ';
						else line = '     └ ';
					}
					let thm_name = data[cat].modules[a_mod].themes[a_thm].name;
					line += thm_name + ' v' + data[cat].modules[a_mod].themes[a_thm].version;
					console.log(line[color]);
					thm_cnt++;
				}
				mod_cnt++;
			}
			// empty line
			console.log();
		}
	}

	/***************/
	// Browsersync //
	/***************/

	function startBrowserSync() {
		// promisified
		logit.log('initialization', 'beginning browersersyncification');
		bs = browsersync.create('springboard');

		return new Promise(function(resolve, reject) {
			try {
				bs.init({
					ui: false,										// start with ui?
					notify: false,								// show browser notifications?
					port: options.app_port,				// port number
					online: false,								// online features?
					open: false,									// open browser on start?
					logLevel: "silent",						// silencio!
					logFileChanges: false,				// mas silencio!
					proxy: "localhost:" + options.koa_port
				}, function() {
					// callback function after browsersync loads
					return resolve();
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
