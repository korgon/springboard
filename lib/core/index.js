// searchspring springboard
// controller of the spring
// manages sites and watches 1 site file structure (git branch) for autobuilding
// manages github and s3 connection for site
// includes css injection / browser reload

/*

avg ram usage 76MB, 79MB


*** Verify all functionality and fix bugs
BUGS TODO
--- ensure watchers are firing correctly

NEXT TODO
* New sites
	- move platform type to catalog (drop down right after creation input and in settings)

* Add settings page and require initial setup
	! style it
		+ tabs: USER, CONFIG, SHORTCUTS
	- move linting to user settings
	- add bs reload settings

* Finish out Settings tabs
	- Implement s3 capabilities incorporate into file viewer
		- show loading image until complete, then show detailed list (similar to commit list)
		- modify cloudstruct and filestruct to load structures only when vtab is opened
		? file viewer show symlinks?
		? default cloud files
	- Add history recording (could put off)
	- Add instructions (could put off)
	- Add screen capture (could put off)
	+ Add default_url and thumb to settings

* Finish out modules for existing v3 ones
* Move modules folder to repository
	+ move module image icon into module folder
* New site templates (selectable)

* Write hooke (proxy with hoxy)
	- proxy @ 1338
	+ use SMC templates or choose catalog

v1.X ? LATER TODO
	* UI variables
	* Module editor and manager
			+ ability to get quick boilerplate for module creation
			+ ability to edit current modules and push to repo
			+ ability to publish module to cdn
	* Shortcut keys
	* Ability to clone modules
	* Ability to clone sites
	* Easy theme / module creation
	* Add ace editor to allow direct edit/save of key files
		- js code
		- templates
		- scss

vX.X ? Much Later TODO
	* Build with electron?
	* Incorporate websockets for real time interface updates
	* Make all template files require modules
		- add targeting to modules
		- use js to build targetting overlay of current page [iframe] (blue all available targets, red targeted + new targets)

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
var s3w = require('./s3w.js');

module.exports = new springboard();

function springboard() {
	var self = this;

	var options;					// object for holding springboard config
	var user;							// object containing user config and methods
	var sites = {};				// object containing all site objects
	var site;							// points to the current site being edited (watched)
	var library;					// object containing all springboard catalogs and modules (v3 only at this point)

	// browsersync instantiation
	var bs;

	// s3 connection
	var s3;

	// site and library repository objects
	var repos = { sites, library };

	var tags = [];	// array of tags loaded from sites in "Master"
	const DEFAULT_TAGS = ['desktop', 'mobile', 'responsive'];
	const DEFAULT_CARTS = ['custom', 'magento', 'bigcommerce', 'miva', 'shopify', '3dcart', 'yahoo', 'volusion', 'commercev3', 'netsuite'];


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

			// initialize the s3 connection
			return s3connect();
		}).then(s3connection => {
			s3 = s3connection;

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
			watchers.init(options, user, bs);
			return loadLastState();
		}).catch(function(err) {
			logit.log('initialization', 'failed', 'fail');
			throw err;
		});
	}

	self.getOptions = () => {
		try {
			return options;
		}
		catch(err) {
			return { error: true, message: err.message };
		}
	}

	self.getStatus = () => {
		try {
			let userdata = user.getData();
			let status = {
				setup: true,
				user: userdata.name,
				recents: userdata.recent_sites,
				carts: DEFAULT_CARTS,
				tags,
				templates: []
			}
			if (userdata.name == '' || userdata.email == '') {
				status.setup = false;
			}

			return self.getSiteTemplates().then(templates => {
				status.templates = templates;
				return status;
			}).catch(err => {
				throw "unable to retrieve templates";
			});
		}
		catch(err) {
			return { error: true, message: err.message };
		}
	}

	self.getUser = () => {
		try {
			return user.getData();
		}
		catch(err) {
			return { error: true, message: err.message };
		}
	}

	self.updateUser = (userdata) => {
		try {
			return user.update(userdata).then(() => {
				return s3connect();
			}).then(s3connection => {
				s3 = s3connection;
				if (options.debug) console.log('changed s3 connection');
			});
		}
		catch(err) {
			return { error: true, message: err.message };
		}
	}

	self.getLibrary = () => {
		try {
			return library.getData();
		}
		catch(err) {
			return { error: true, message: err.message };
		}
	}

	self.getCatalog = (catalog) => {
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
	self.getSites = () => {
		try {
			return Object.keys(sites).reduce(function(sites_array, site) {
				sites_array.push(sites[site].getState());
				return sites_array;
			}, []);
		}
		catch(err) {
			return { error: true, message: err.message };
		}
	}

	// return site under edit (watch)
	self.getSite = (asite) => {
		if (asite === undefined) {
			if (!site) return { error: true, message: 'not editing a site...' };

			return site.getState();
		}
		if (sites[asite]) {
			return sites[asite].getState();
		} else {
			return { error: true, message: 'site ' + asite + ' not found.' };
		}
	}

	// return site under edit (watch)
	self.getSiteFiles = (asite) => {
		if (asite === undefined) {
			if (!site) return { error: true, message: 'not editing a site...' };

			return site.getFiles();
		}
		if (sites[asite]) {
			return sites[asite].getFiles();
		} else {
			return { error: true, message: 'site ' + asite + ' not found.' };
		}
	}

	self.getSiteTemplates = () => {
		return repos.sites.branch(['-a']).then(branches => {
			let templates = [];

			branches.forEach(function(branch) {
				// look for template branches
				let matches = branch.match(/\/template\/(\w+$)/);
				if (matches) {
					templates.push(matches[1]);
				}
			});

			return templates;
		});
	}

	// reload site under edit
	self.reloadSite = () => {
		if (!site) return { error: true, message: 'not editing a site...' };

		// stop watching files
		return watchers.stop().then(() => {
			// reload site data
			return site.reload();
		}).then(() => {
			// start watching for changes again
			if (options.debug) console.log('about to watch');
			return watchers.watch(site);
		}).then(() => {
			// return the site
			return site.getState();
		});
	}

	self.loadSites = (ignore) => {
		// check if site was being worked on to check for uncommited work
		// also check for unpushed commits
		return repos.sites.status().then(stats => {

			if (stats.changes) {
				// there are uncommited changes on current site
				throw { error: true, action: 'commit', location: 'loadSites', message: 'There are uncommited changes!' };
			} else if (stats.ahead && !ignore) {
				// there are unpushed commits on current site
				throw { error: true, action: 'push', message: 'There are unpushed changes!' };
			}

			// stop watching files
			return watchers.stop();
		}).then(() => {
			return repos.sites.checkout('master');
		}).then(() => {
			return repos.sites.pull('', '', ['--all']);
		}).catch(error => {
			// check for working offline?
			if (!error.error) {
				// working offline...
				logit.log('offline', 'cannot connect to repository', 'fail');
				if (!ignore) {
					throw { error: true, action: 'connect', message: error };
				} else {
					return true;
				}
			} else {
				throw error;
			}
		}).then((offline) => {
			if (offline) {
				logit.log('using local data', 'cannot update local copy of repository', 'warn');
			} else {
				logit.log('syncing site repository', 'updating local copy of repository');
			}
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

			rebuildTags();

			site = undefined;
			if (websites) console.log('\n');
			let loadmsg = count + ' site' + (count > 1 ? 's' : '') + ' loaded';
			logit.log('load complete', loadmsg, 'blue');

			return self.getSites();
		}).catch(error => {
			if (options.debug) console.log(error);
			return error;
		});
	}

	// create new site
	// assuming that current site has been commited
	self.addSite = (details) => {
		let site_dir = options.sites_repo_dir + '/' + details.name;
		let site_json_file = options.sites_repo_dir + '/' + details.name + '/.' + details.name + '.json';
		let template_json_file = options.sites_repo_dir + '/example.com/.example.com.json';
		let template_dir = options.sites_repo_dir + '/example.com';

		// check to see if there are branch changes
		return repos.sites.status().then(stats => {
			if (options.debug) console.log(stats);
			if (stats.changes) {
				// there are uncommited changes on current site
				throw { error: true, action: 'commit', message: 'There are uncommited changes!' };
			} else if (stats.ahead && !ignore) {
				// there are unpushed commits on current site
				throw { error: true, action: 'push', message: 'There are unpushed changes!' };
			}

			// stop watching files
			return watchers.stop();
		}).then(() => {
			return repos.sites.checkout('master');
		}).then(() => {
			logit.log('syncing site repository', 'updating local copy of repository');
			return repos.sites.pull('origin', 'master');
		}).catch(error => {
			// check for working offline?
			if (!error.error) {
				// working offline...
				logit.log('offline', 'cannot connect to repository', 'fail');
				throw { error: true, action: 'connect', message: 'Cannot add site while offline.' };
			} else {
				throw error;
			}
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
			// mulitiple templates TODO
			var template = 'template/' + details.template;
			var site_match = new RegExp('\/site\/' + details.name);
			var found_template = false;

			branches.forEach(function(branch) {
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
		}).then((branch) => {
			// pull down template branch
			return repos.sites.pull('origin', branch);
		}).then(() => {
			// checkout new branch
			return repos.sites.checkout('site/' + details.name, ['-b']);
		}).then(() => {
			return repos.sites.clean(['-fd']);
		}).then(() => {
			return repos.sites.reset(['--hard']);
		}).then(() => {
			// rename example.com folder from template to site name
			return fspro.rename(template_dir, site_dir);
		}).then(() => {
			// rename .example.com.json from template to site name
			return fspro.rename(site_dir + '/.example.com.json', site_json_file);
		}).then(() => {
			// modify JSON defaults
			return fspro.exists(site_json_file);
		}).then(stats => {
			if (stats) {
				// load site json
				return fspro.getJSON(site_json_file)
			} else {
				throw new Error('Site does not have a config!');
			}
		}).then(data => {
			if (data && data.name) {
				// modify the data and save it
				data.name = details.name;
				data.settings.siteid.value = details.siteid;
				data.created = new Date().getTime();
				data.creator = user.getName();
				data.default_url = '/' + options.sites_base_dir + '/' + details.name + '/' + data.default_url;

				return fspro.putJSON(site_json_file, data);
			} else {
				throw new Error('Bad template JSON data!')
			}

			let json_file = site_dir + '/' + '.' + details.name + '.json';
		}).then(() => {
			// load site from JSON
			return website(details.name, site_dir);
		}).then(loaded_site => {
			sites[details.name] = loaded_site;
			site = loaded_site;
			// update user config
			return user.switchSite(site.name);
		}).then(() => {
			logit.log('new site', 'new branch created for ' + site.name, 'warn');
			var commitmsg = 'CREATED >>> ' + site.name;
			return self.commitSite(commitmsg);
		}).then(() => {
			return self.pushSite();
		}).then(() => {
			var mergemsg = 'MERGED CREATION >>> ' + site.name;
			return mergeSite(mergemsg);
		}).then(() => {
			return self.editSite(site.name);
		}).catch((err) => {
			throw err;
		});
	}

	self.editSite = (thesite, ignore) => {
		if (options.debug) console.log('preparing to edit site ', thesite);
		// function returns a site object
		if (sites[thesite]) {

			return repos.sites.status().then(stats => {
				// TODO check for changes to current site
				// for now relying upon angular to force loadSites
				// by going to gallery prior to editSite

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

				// stop watching files
				return watchers.stop();
			}).then(() => {
				return repos.sites.checkout(sites[thesite].branch);
			}).then(() => {
				return repos.sites.pull('origin', sites[thesite].branch);
			}).catch(error => {
				// check for working offline?
				if (!error.error) {
					// working offline...
					logit.log('offline', 'cannot connect to repository', 'fail');
					if (!ignore) {
						throw { error: true, action: 'connect', message: error };
					} else {
						return true;
					}
				} else {
					throw error;
				}
			}).then((offline) => {
				site = sites[thesite];

				if (offline) {
					logit.log('local data', 'loaded ' + site.name + ' using local data', 'warn');
				} else {
					logit.log('pulled', site.name + ' has been pulled from gitland', 'warn');
				}

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

				logit.log('loading ' + site.name, '', 'blue');

				printCatalogs(site.getState().catalogs, 'blue');

				// for recent site history
				return user.switchSite(site.name);
			}).then(() => {
				// start watchers
				return watchers.watch(site);
			}).then(() => {

				logit.log('editing site', 'now watching for changes on ' + site.name.bold, 'blue');

				return site.getState();
			}).catch(err => {
				if (options.debug) console.log(err);
				if (err.action != 'connect') {
					site = undefined;
					self.loadSites();
				}

				// format error
				if (!err.message && err.includes('Your local changes to the following files would be overwritten by checkout:')) {
					throw {
						error: true,
						type: 'masterbranchmodified',
						message: 'You modified the master branch!'
					};
				}

				throw err;
			});
		}
		else {
			// not a valid site...
			throw new Error(thesite + ' is not a valid site!');
		}
	}

	// update site
	self.updateSite = (info) => {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		// TODO sanitize info

		if (info.name == site.name) {
			return site.update(info).then(() => {
				// do some things...
			}).then(() => {
				return site.getState();
			}).catch(err => {
				throw { error: true, message: err.message };
			});
		} else {
			// invalid site catalog
			return Promise.reject({ error: true, message: 'failed to updateSite: invalid site data' });
		}
	}

	// install catalog
	self.installCatalog = (info) => {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		let site_data = site.getData();

		let install_info = {
			name: info.name,
			directory: site.directory,
			siteid: site_data.settings.siteid.value,
			creator: user.getName()
		}

		if (library.catalogs[info.type]) {
			return library.catalogs[info.type].install(install_info).then(() => {
				return site.reloadCatalogs();
			}).then(() => {
				let site_state = site.getState();

				let variables = {
					siteid: site_state.catalogs[info.name].settings.siteid.value || site_state.settings.siteid.value || 'xxxxxx',
					context: site_state.catalogs[info.name].settings.context.value || '',
					site: site.name,
					catalog: info.name,
					cdn: options.cdn_url + '/' + options.sites_base_dir
				}

				return site.catalogs[info.name].compile.all(variables);
			}).then(() => {
				return watchers.watch(site);
			}).then(() => {
				return site.catalogs[info.name].compile.sassModules();
			}).then(() => {
				return site.catalogs[info.name].compile.js();
			}).then(() => {
				return site.getState();
			}).catch(err => {
				if (options.debug) console.log(err);
				throw { error: true, message: err.message };
			});
		} else {
			// invalid catalog type
			return Promise.reject({ error: true, message: 'invalid catalog type' });
		}
	}

	// update catalog
	self.updateCatalog = (catalog_name, info) => {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		// TODO sanitize info
		if (catalog_name == info.name && site.catalogs[info.name]) {
			return site.catalogs[info.name].update(info).then(() => {
				return site.reloadCatalogs();
			}).then(() => {
				return site.getState();
			}).catch(err => {
				throw { error: true, message: err.message };
			});
		} else {
			// invalid site catalog
			return Promise.reject({ error: true, message: 'failed to updateCatalog: catalog does not exist in site' });
		}
	}

	// compile catalog
	self.compileCatalog = (info) => {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		let site_state = site.getState();

		// TODO sanitize info

		if (site.catalogs[info.name]) {

			let variables = {
				siteid: site_state.catalogs[info.name].settings.siteid.value || site_state.settings.siteid.value || 'xxxxxx',
				context: site_state.catalogs[info.name].settings.context.value || '',
				site: site.name,
				catalog: info.name,
				cdn: options.cdn_url + '/' + options.sites_base_dir
			}

			return site.catalogs[info.name].compile.all(variables).then(() => {
				return;
			}).catch(err => {
				throw { error: true, message: err.message };
			});
		} else {
			// invalid site catalog
			return Promise.reject({ error: true, message: 'failed to compileCatalog: catalog does not exist in site' });
		}
	}

	// install module
	self.installModule = (catalog_name, info) => {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		let install_info = {
			name: info.module,
			directory: site.catalogs[catalog_name].directory,
			theme: info.theme
		}
		if (library.catalogs[info.catalog]) {
			let site_state = site.getState();

			// stop the watchers
			return watchers.stop().then(() => {
				if (options.debug) logit.log('sb[installModule]', 'install_info object:');
				if (options.debug) console.log(install_info);
				return library.catalogs[info.catalog].modules[info.module].install(install_info);
			}).then(() => {
				return site.catalogs[catalog_name].reloadModules();
			}).then(() => {
				// restart the watchers
				return watchers.watch(site);
			}).then(() => {
				// compile new module theme
				return site.catalogs[catalog_name].modules[info.module].themes[info.theme].compileVariables();
			}).then(() => {
				// compile catalog
				let variables = {
					siteid: site_state.catalogs[catalog_name].settings.siteid.value || site_state.settings.siteid.value || 'xxxxxx',
					context: site_state.catalogs[catalog_name].settings.context.value || '',
					site: site.name,
					catalog: catalog_name,
					cdn: options.cdn_url + '/' + options.sites_base_dir
				}
				return site.catalogs[catalog_name].compile.all(variables);
			}).then(() => {
				// return the site json object
				return site.getState();
			}).catch(err => {
				if (options.debug) console.log('sb[installModule]error: ' + err);
				throw { error: true, message: err.message };
			});
		} else {
			// invalid site catalog
			let errormsg = 'failed to installModule: catalog ' + catalog_name + '(' + info.catalog + ') does not exist in site';
			return Promise.reject({ error: true, message: errormsg });
		}
	}

	// update module (disable/enable/change theme)
	self.updateModule = (catalog_name, module_name, info) => {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		// TODO sanitize info

		// invalid catalog
		if (!site.catalogs[catalog_name]) {
			// invalid site catalog
			return Promise.reject({ error: true, message: 'failed to updateModule: catalog does not exist in site' });
		}

		// invalid module
		if (!site.catalogs[catalog_name].modules[module_name]) {
			// invalid site module
			return Promise.reject({ error: true, message: 'module does not exist in site' });
		}

		if (module_name == info.name && site.catalogs[catalog_name].modules[module_name]) {
			return site.catalogs[catalog_name].modules[module_name].update(info).then(() => {
				return site.getState();
			}).catch(err => {
				throw { error: true, message: err.message };
			});
		} else {
			// invalid site module
			return Promise.reject({ error: true, message: 'module does not exist in site' });
		}
	}

	// install theme
	self.installTheme = (info) => {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		let site_details = site.getState();

		if (!site_details.catalogs[info.catalog]) {
			// invalid site catalog
			return Promise.reject({ error: true, message: 'failed to installTheme: catalog does not exist in site' });
		}

		let catalog_type = site_details.catalogs[info.catalog].type;

		if(!site_details.catalogs[info.catalog].modules[info.module]) {
			// invalid site module
			return Promise.reject({ error: true, message: 'module does not exist in site' });
		}

		let module_type = site_details.catalogs[info.catalog].modules[info.module].type.split('/')[1];

		if(!library.catalogs[catalog_type].modules[module_type].themes[info.theme]) {
			// invalid theme
			return Promise.reject({ error: true, message: 'theme does not exist in library' });
		}

		let install_info = {
			directory: site.catalogs[info.catalog].modules[info.module].directory,
		}

		// install the theme
		return library.catalogs[catalog_type].modules[module_type].themes[info.theme].install(install_info).then(() => {
			return site.catalogs[info.catalog].modules[info.module].reloadThemes();
		}).then(() => {
			return site.getState();
		}).catch(err => {
			throw { error: true, message: err.message };
		});
	}

	// update module theme
	self.updateModuleTheme = (catalog_name, module_name, theme_name, info) => {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		// TODO sanitize info

		// invalid catalog
		if (!site.catalogs[catalog_name]) {
			// invalid site catalog
			return Promise.reject({ error: true, message: 'failed to updateModuleTheme: catalog does not exist in site' });
		}

		// invalid module
		if (!site.catalogs[catalog_name].modules[module_name]) {
			// invalid site module
			return Promise.reject({ error: true, message: 'failed to updateModuleTheme: module does not exist in site' });
		}

		// invalid theme
		if (!site.catalogs[catalog_name].modules[module_name].themes[theme_name]) {
			// invalid site module
			return Promise.reject({ error: true, message: 'failed to updateModuleTheme: theme does not exist in site' });
		}

		if (theme_name == info.name) {
			return site.catalogs[catalog_name].modules[module_name].themes[theme_name].update(info).then(() => {
				return site.getState();
			}).catch(err => {
				throw { error: true, message: err.message };
			});
		} else {
			// invalid site module
			return Promise.reject({ error: true, message: 'failed to updateModuleTheme: invalid data' });
		}
	}

	/* ************************** */
	//  GIT REPOSITORY functions  //
	/* ************************** */

	self.commitSite = (message) => {
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
			logit.log('commit', message, 'warn');
			return { error: false, site: site.name, action: 'commit', message: 'success' };
		}).catch(err => {
			logit.log('commit', site.name.bold + ' error!', 'fail');
			console.log(err.red);
			throw err;
		});
	}

	self.pushSite = () => {
		if (!site) return { error: true, message: 'not editing a site...' };

		return repos.sites.push('origin', site.branch, ['-u']).then(() => {
			logit.log('pushed', site.name + ' has been pushed to gitland', 'warn');
			return { error: false, site: site.name, action: 'push', status: 'success', message: 'site pushed to the repo' };
		}).catch(error => {
			if (options.debug) console.log(error);
			if (error.indexOf('fatal: Could not read from remote repository.') != -1) {
				error = { action: 'connect', message: 'Cannot connect to repository.' };
			}
			throw { error: true, site: site.name, action: error.action || 'push', message: error.message || error };
		});
	}

	self.resetSite = () => {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		return watchers.stop().then(() => {
			return repos.sites.clean(['-fd']);
		}).then(() => {
			return repos.sites.reset(['--hard']);
		}).then(() => {
			return { error: false, site: site.name, action: 'reset', status: 'success' };
		}).catch(error => {
			throw { error: true, site: site.name, action: 'reset', status: 'failed', message: err.message };
		});
	}

	self.gitStatus = () => {
		return repos.sites.status().then(stats => {
			return stats;
		});
	}

	/************************/
	//    s3 functions      //
	/************************/

	function s3connect() {
		let keys = user.getData().s3;

		if (keys.key_id && keys.key_secret) {
			return s3w(options, keys);
		}
	}

	self.getSiteS3 = () => {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		let prefix = options.sites_base_dir + '/' + site.name + '/';

		return s3.listFiles(prefix).then(list => {
			let s3files = {
				bucket: list.Name,
				root: {
					path: '/' + prefix,
					type: 'directory',
					name: site.name,
					contents: {}
				}
			};

			// build out the response
			list.Contents.forEach(item => {
				let key = item.Key.replace(prefix, '');
				let location = s3files.root;
				let parts = key.split('/');

				parts.forEach((part, i) => {
					if ((i + 1) != parts.length) {
						// must be a sub directory
						let directory = {
							type: 'directory',
							name: part,
							path: part,
							contents: {}
						}

						if (!location.contents[part]) {
							// sub directory does not yet exist, add it
							location.contents[part] = directory;
						}
						location = location.contents[part];
					} else {
						// must be the file itself
						let file = {
							type: 'file',
							key: item.Key,
							name: part,
							size: (item.Size/1000).toFixed(2) + 'kB',
							modified: Date.parse(item.LastModified),
							extension: path.extname(part).replace('.', '')
						}
						// add file to s3files
						location.contents[part] = file;
					}
				});
			});
			return s3files;
		}).catch(err => {
			if (options.debug) console.log('sb[getSiteS3]error: ' + err);

			if (err.code == 'NetworkingError') {
				throw { error: true, message: 'connection to CDN failed', action: 's3connect' };
			} else {
				throw { error: true, message: err.message };
			}
		});;
	}

	self.publishSite = () => {
		// check existence of cloud_files, remove non-existant files
		// put files to s3
		// return object containing urls

		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		// add file directory for file check
		let cloud_files = site.getState().cloud_files.map(file => {
			return site.directory + '/' + file;
		});
		let cloud_uploads;

		// check all cloud_files for existence
		let cloud_promises = [];

		cloud_files.forEach(file => {
			cloud_promises.push(fspro.exists(file));
		});

		return Promise.all(cloud_promises).then(status => {
			let s3_promises = [];

			cloud_uploads = status.filter(status => {
				if (status.path) return true;
			});

			cloud_uploads.map(details => {
				return details.path;
			}).forEach(file => {
				let s3_file = file.replace(options.sites_repo_dir, options.sites_base_dir);

				s3_promises.push(s3.putFile(file, s3_file));
			});

			return Promise.all(s3_promises);
		}).then(urls => {
			let details = cloud_uploads.map((upload, index) => {
				return {
					name: upload.path.replace(site.directory, ''),
					url: urls[index],
					size: (upload.size/1000).toFixed(2) + 'kB',
					path: upload.path
				}
			});

			if (options.debug) {
				logit.log('sb[publishSite]', 'upload object:');
				console.log(details);
			}
			return details;
		}).catch(err => {
			if (options.debug) console.log('sb[publishSite]error: ' + err);

			if (err.code == 'NetworkingError') {
				throw { error: true, message: 'Network connection to CDN failed.', action: 's3connect' };
			} else {
				throw { error: true, message: err.message };
			}
		});
	}


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	function rebuildTags() {
		// loop through sites, get tags from all catalogs
		// concatenate and remove duplicates
		// save to file
		let new_tags = DEFAULT_TAGS;

		for (let s in sites) {
			let state = sites[s].getState();

			for (let cat in state.catalogs) {
				new_tags = concatTags(new_tags, state.catalogs[cat].tags);
			}
		}

		tags = new_tags;

		return saveCache();

		function concatTags (this_array, that_array) {
			var new_array = this_array.concat(that_array).sort(function (a, b) {
				return a > b ? 1 : a < b ? -1 : 0;
			});

			return new_array.filter(function (item, index) {
				return new_array.indexOf(item) === index;
			});
		};
	}

	function saveCache() {
		// save state to save file (json)
		let cache = {
			tags
		}

		return fspro.putJSON(options.save_file, cache);
	}

	// initialize a repository (used for sites / library)
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


		// load tags first
		return fspro.getJSON(options.save_file).then(save_data => {
			if (!save_data.tags) throw new Error('Bad tag data!')

			tags = save_data.tags;

			return repos.sites.status();
		}).then(stats => {
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

			return self.editSite(current_site, true);
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
				throw { error: true, action: 'commit', location: 'mergeSite', message: 'There are uncommited changes!' };
			} else if (stats.ahead && !ignore) {
				// there are unpushed commits on current site
				throw { error: true, action: 'push', message: 'There are unpushed changes!' };
			}

			return watchers.stop();
		}).then(() => {
			return repos.sites.checkout('master');
		}).catch(error => {
			// check for working offline?
			if (!error.error) {
				if (options.debug) console.log('offline?');
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
			if (options.debug) console.log('MERGE ERROR!!!...');
			if (options.debug) console.log(err);
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
				line += mod_name;
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
					proxy: "localhost:" + options.koa_port,
					scriptPath: function (path, port, options) {	// allows to use bs w/base tag
						return options.get("absolute");
					}
				}, function() {
					// callback function after browsersync loads
					return resolve();
				});
			}
			catch(err) {
				logit.log('server fail', 'failed to start browsersync', 'fail');
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
		var url = 'http://localhost:' + global.port + '/sites/' + self.name + '/' + self.default_url;

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
