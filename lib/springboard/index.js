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
				|-	publish buttons (commit, publish mockup, publish live)
				|-	tabbed settings (modules, config etc...)
		c.	gallery (view sites)

4.	angular module
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
Finish out module tab
Finish out remaining tabs (maybe skip tags)
Refactor code; move all sync -> async; fix promises (git library, etc...)
Require user entry of name and s3 info
Move modules folder to repository


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
var website = require('./lib/website.js');
var mod = require('./lib/mod.js');
//var s3w = require('./lib/s3w');

module.exports = function() {
	return new springboard();
}();

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

	var config_file = 'user.json';

	var sites = {};				// object containing all site objects
	var site;							// points to the current site being edited (watched)
	var modules = {};			// object containing all modules (and associated themes and plugins)

	var repo = {};
	var options;

	/*	_________________	*\
	//										\\
	//	 public methods 	\\
	//	_________________	\\
	\*										*/


	self.init = function(config) {
		options = config;
		// promisified
		return new Promise(function(resolve, reject) {
			var title = '           spr1ngb0ard           ';
			var ver = 'version [' + options.version +']';
			logit.log(title.trap, ver, 'red');

			// check for config file and read it
			if (fs.existsSync(config_file)) {
				//console.log('config file exists!');
				try {
					user = JSON.parse(fs.readFileSync(config_file));
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
			repoInit(options.sites_repo_dir, options.sites_repo).then(repo => {
				self.repo.sites = repo;
				return repoInit(options.modules_repo_dir, options.modules_repo);
			}).then(repo => {
				repo.modules = repo;
				return loadModules();
			}).then(function() {
				console.log(repo);
				console.log('wtf');
				return repo.sites.status();
			}).then(stats => {
				if (stats.branch == 'master') {
					self.loadSites().then(() => {
						return resolve();
					}).catch(error => {
						return reject(error);
					})
				} else if (stats.branch.indexOf('site/') > -1 && stats.branch != 'site/_template') {
					try {
						sites[user.current_site] = new website({ name: user.current_site, directory: options.sites_repo_dir + '/' + user.current_site }, user);

						logit.log('loading site ' + user.current_site, '', 'blue');
						self.editSite(user.current_site).then(() => {
							return resolve(true);
						}).catch(error => {
							return reject(error);
						})
					} catch(error) {
						return reject(error);
					}
				} else {
					throw new Error('Repository out of sync with Springboard.');
				}
			}).then(function() {
				console.log('initialization complete');
				return resolve();
			}).catch(function(err) {
				logit.log('initialization', 'failed', 'fail');
				return reject(err);
			});
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
		// promisified
		return new Promise(function(resolve, reject) {

			// check if site was being worked on to check for uncommited work
			// also check for unpushed commits
			repo.sites.status().then(stats => {
				if (stats.changes) {
					// there are uncommited changes on current site
					return reject({ error: true, action: 'commit', message: 'There are uncommited changes!' });
				} else if (stats.ahead && !ignore) {
					// there are unpushed commits on current site
					return reject({ error: true, action: 'push', message: 'There are unpushed changes!' });
				}

				//watchers.stop();

				return repo.sites.checkout('master');
			}).catch(error => {
				// check for working offline?
				console.log('offline?');
				return reject(error);
				// if (err.message.indexOf('Could not resolve hostname') > -1) {
				// 	logit.log('warning', 'working offline!', 'fail');
				// 	return;
				// } else {
				// 	return reject(err);
				// }
			}).then(() => {
				return repo.sites.pull('origin', 'master');
			}).then(() => {
				logit.log('syncing repository', 'updating local copy of repository');
				// load the sites
				var total = 0;
				logit.log('loading sites', '', 'blue');
				try {
					var folders = fs.readdirSync(options.sites_repo_dir);
				}
				catch(err) {
					console.error(err);
				}
				// first empty sites object (to start fresh)
				for (var del in sites) delete sites[del];

				for (var folder of folders) {
					// ignore non directories... or hidden folders (^.*)
					if (!fs.lstatSync(options.sites_repo_dir + '/' + folder).isDirectory() || folder.match(/^\./))
						continue;
					// build out the sites object...
					// with website objects...
					try {
						// fill sites with sites...
						sites[folder] = new website({ name: folder, directory: options.sites_repo_dir + '/' + folder }, user);
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

				return resolve(self.getSites());
			}).catch(error => {
				return reject(error);
			});




			// self.gitStatus().then(function(status) {
			// 	if (status.changes) {
			// 		// there are uncommited changes on current site
			// 		return reject({ error: true, action: 'commit', message: 'There are uncommited changes!' });
			// 	} else if (status.ahead && !ignore) {
			// 		// there are unpushed commits on current site
			// 		return reject({ error: true, action: 'push', message: 'There are unpushed changes!' });
			// 	}
			//
			// 	stopWatch();
			//
			// 	git.fetch(null, null, function(err) {
			// 		console.log('lo?');
			// 		if (err) {
			// 			// check if offline
			// 			if (err.message.indexOf('Could not resolve hostname') > -1) {
			// 				logit.log('warning', 'working offline!', 'fail');
			// 			} else {
			// 				return reject(err);
			// 			}
			// 		}
			// 	}).checkout('master', function(err) {
			// 		if (err) return reject({ error: true, message: err.message });
			// 	}).pull('origin', 'master', function (err) {
			// 		if (err) {
			// 			// check if offline
			// 			if (err.message.indexOf('Could not resolve hostname') > -1) {
			// 				// working offline
			// 				// logit.log('warning', 'working offline!', 'fail');
			// 			} else {
			// 				return reject(err);
			// 			}
			// 		} else {
			// 			logit.log('syncing repository', 'updating local copy of repository');
			// 		}
			//
			// 		// load the sites
			// 		var total = 0;
			// 		logit.log('loading sites', '', 'blue');
			// 		try {
			// 			var folders = fs.readdirSync(options.sites_repo_dir);
			// 		}
			// 		catch(err) {
			// 			console.error(err);
			// 		}
			// 		// first empty sites object (to start fresh)
			// 		for (var del in sites) delete sites[del];
			//
			// 		// force garbage collection (reduces memory footprint)
			// 		global.gc();
			//
			// 		for (var folder of folders) {
			// 			// ignore non directories... or hidden folders (^.*)
			// 			if (!fs.lstatSync(options.sites_repo_dir + '/' + folder).isDirectory() || folder.match(/^\./))
			// 				continue;
			// 			// build out the sites object...
			// 			// with website objects...
			// 			try {
			// 				// fill sites with sites...
			// 				sites[folder] = new website({ name: folder, directory: options.sites_repo_dir + '/' + folder }, user);
			// 				if (!sites[folder].valid) {
			// 					delete sites[folder];
			// 					throw(folder);
			// 				}
			// 				else {
			// 					process.stdout.write('   .'.bold.blue);
			// 					total++;
			// 				}
			// 			}
			// 			catch(err) {
			// 				var errormsg = 'failed to load sites';
			// 				logit.log('loading sites', errormsg, 'fail');
			// 				console.error(err.red);
			// 			}
			// 		}
			// 		if (folders) console.log('\n');
			// 		logit.log('load complete', total + ' sites loaded', 'blue');
			//
			// 		return resolve(self.getSites());
			// 	});
			// });
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
								details.gitstatus = 'new';
								details.status = 'new';
								sites[details.name] = new website(details, user, git, s3);
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
		// promisified function that returns a site object
		return new Promise(function(resolve, reject) {
			if (sites[thesite]) {

				stopWatch();
				site = sites[thesite];

				git.checkout(site.branch, function(err) {
					if (err) {
						console.log('dude, need to commit that shit!');
						return reject({ error: true, site: site.name, action: 'checkout', status: 'failed', message: err });
					}
				}).then(function() {
					self.pullSite().then(function(pulled) {
						site.reload();
						site.compile();

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

						// start watching
						watchScss();
						watchHtml();
						//watchJSON();
						//watchJs();
						logit.log('editing site', 'now watching for changes on ' + site.name.bold, 'warn');

						return resolve(site);
					}).catch(function(err) {
						console.log('got an error...');
						return reject(err);
					});
				});
			}
			else {
				return reject(Error(thesite + ' is not a valid site!'));
			}
		});
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

	self.commitSite = function(message, new_status) {
		// promisified
		return new Promise(function(resolve, reject) {
			if (!site) return reject({ error: true, message: 'not editing a site...' });

			if (!message) message = user.name + '@springboard >>> COMMITED >>> ' + site.name;
			else message = user.name + '@springboard >>> ' + message;

			if (!new_status) new_status = 'commited';

			// check for changes first to see if commit is needed
			git.status(function(err, status_data) {
				if (err) return reject({ error: true, site: site.name, action: 'commit', message: err.message });

				if (status_data.changed) {
					// changes to be commited
					site.setStatus({ gitstatus: new_status });

					git.addAll(function(err, data) {
						if (err) return reject({ error: true, site: site.name, action: 'commit', message: err.message });
					}).commit(message, function(err) {
						if (err) {
							logit.log('commit', site.name.bold + ' commit error!');
							return reject({ error: true, site: site.name, action: 'commit', message: err.message });
						}
						logit.log('commit', message, 'pass');
						return resolve({ error: false, site: site.name, action: 'commit', message: 'success', changes: new_status });
					});
				} else if (status_data.ahead) {
					// no changes, but unpushed commits so don't reject
					logit.log('commit', site.name.bold + ' nothing to commit');

					return resolve({ error: false, site: site.name, action: 'commit', message: 'nothing to commit' });
				} else {
					// no changes
					logit.log('commit', site.name.bold + ' nothing to commit');

					return reject({ error: false, site: site.name, action: 'commit', message: 'nothing to commit' });
				}
			});
		});
	}

	self.pushSite = function(message) {
		// promisified
		return new Promise(function(resolve, reject) {
			if (!site) return reject({ error: true, message: 'not editing a site...' });

			self.commitSite(message, 'pushed').then(function() {
				// pushit!!!
				if (site.status == 'new') {
					git.pushUp('origin', 'site/' + site.name, function(err) {
						if (err) {
							// check if offline
							if (err.message.indexOf('Could not resolve hostname') > -1) {
								logit.log('warning', 'working offline...', 'fail');
								return reject({ error: false, site: site.name, action: 'pushup', status: 'failed', message: 'working offline' });
							} else {
								return reject({ error: true, site: site.name, action: 'pushup', message: err.message });
							}
						} else {
							logit.log('pushed', site.name + ' has been pushed to gitland', 'pass');

							return resolve({ error: false, site: site.name, action: 'pushup', status: 'success', message: 'site pushed to the newly created branch on the repo' });
						}
					});
				} else {
					git.push('origin', 'site/' + site.name, function(err) {
						if (err) {
							// check if offline
							if (err.message.indexOf('Could not resolve hostname') > -1) {
								logit.log('warning', 'working offline...', 'fail');
								return reject({ error: false, site: site.name, action: 'push', status: 'failed', message: 'working offline' });
							} else {
								return reject({ error: true, site: site.name, action: 'push', message: err.message });
							}
						} else {
							logit.log('pushed', site.name + ' has been pushed to gitland', 'pass');

							return resolve({ error: false, site: site.name, action: 'push', status: 'success', message: 'site pushed to the repo' });
						}
					});
				}
			}, function(err) {
				// rejected from commitSite()
				if (!err.error) {
					logit.log('push', site.name.bold + ' nothing to push');
				}
				return reject(err);
			});
		});
	}

	self.pullSite = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			if (!site) return reject({ error: true, message: 'not editing a site...' });

			git.pull('origin', 'site/' + site.name, function(err) {
				if (err) {
					// check if offline
					if (err.message.indexOf('Could not resolve hostname') > -1) {
						logit.log('warning', 'working offline...', 'fail');
						return resolve({ site: site.name, action: 'pull', status: 'failed' });
					} else {
						return reject(err);
					}
				} else {
					// reload site config to match actual repo if not offline
					site.getConfig();
					logit.log('pulled', site.name + ' has been pulled from gitland', 'pass');
					return resolve({ site: site.name, action: 'pull', status: 'success' });
				}
			});
		});
	}

	self.pullRequestSite = function() {
		// promisified
		return new Promise(function(resolve, reject) {
			if (!site) return reject({ error: true, message: 'not editing a site...' });

			logit.log('pull request', 'pull request made for ' + site.name, 'warn');
			return resolve( { error: false, site: site.name, action: 'pullrequest', status: 'success' } )
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
				site.setStatus({ status: 'mockup' });
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
		// promisified
		return new Promise(function(resolve, reject) {
			if (!site) return reject({ error: true, message: 'not editing a site...' });

			git.clean().then(function() {
				git.reset(function(err) {
					if (err) return resolve({ error: true, site: site.name, action: 'reset', status: 'failed', message: err.message });
					git.reset(function(err) {
						if (err) return resolve({ error: true, site: site.name, action: 'reset', status: 'failed', message: err.message });
						return resolve({ error: false, site: site.name, action: 'reset', status: 'success' });
					});
				});
			});
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
			fs.writeFileSync(config_file, JSON.stringify(user, null, 2));
		}
		catch(err) {
			logit.log('config file', 'failed to write springboard config', 'fail');
			console.error(err);
		}
		return;
	}

	function repoInit(repo_dir, repo) {
		// promisified
		return new Promise(function(resolve, reject) {
			core.exists(repo_dir).catch(error => {
				return gitmo.clone(repo_dir, repo);
			}).then(() => {
				return resolve(gitmo(repo_dir));
			}).catch(error => {
				return reject(error);
			});
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
				return reject(err);
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



	/***************/
	// Browsersync //
	/***************/

// 	function startBrowserSync() {
// 		// promisified
// 		logit.log('initialization', 'beginning browersersyncification');
// 		return new Promise(function(resolve, reject) {
// 			try {
// 				browserSync({
// 					ui: false,							// start with ui?
// 					notify: false,						// show browser notifications?
// 					port: global.port,			// port number
// 					online: false,						// online features?
// 					open: false,						// open browser on start?
// 					logLevel: "silent",					// silencio!
// 					proxy: "localhost:" + (global.port + 1)
// 				}, function() {
// 					// callback function after browsersync loads
// 					var msg = 'http://localhost:' + global.port + '/';
// 					logit.log('server started', msg, 'green');
// 					return resolve(true);
// 				});
// 			}
// 			catch(err) {
// 				var msg = 'failed to start browsersync';
// 				logit.log('server fail', msg, 'fail');
// 				return reject(err);
// 			}
// 		});
// 	}

}
