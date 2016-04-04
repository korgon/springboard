// ajax v3 catalog methods
'use strict';

var fs = require('fs');
var path = require('path');
var fspro = require('_/fspro');

var common = require('../common.js');
var mod = require('./mod.js');

const variables = require('./v3.js').variables;

// initialization
var init = (state) => {
	// load modules
	return loadModules(state).loadModules();
}

// extensions
var getData = (state) => ({
	getData: () => {
		return state.data;
	}
});

var compile = (state) => ({
	compile: () => {
		console.log('compiling ' + state.name);
	}
});

var install = (state) => ({
	install: (details) => {
		if (details) {
			var install_dir = details.directory + '/' + details.name;

			return fspro.exists(details.directory).then(exists => {
				if (!exists) {
					// if details.directory does not exist
					throw new Error('v3 install(): Install directory (' + details.directory + ') is invalid!');
				}

				// ensure that the install location is a directory
				if (!exists.isDirectory()) {
					throw new Error('v3 install(): Install directory (' + details.directory + ') is not a directory!');
				}

				// ensure that the module directory does not yet exist
				return fspro.exists(install_dir);
			}).then(exists => {
				if (exists) {
					// if details.directory does not exist
					throw new Error('v3 install(): v3 catalog already installed at location (' + details.directory + ')!');
				}

				// install catalog
				console.log('installing v3 catalog to ' + details.directory);
				return fspro.mkDir(install_dir);
			}).then(() => {
				// get default catalog object
				return common.getObject(state.name, state.directory);
			}).then(data => {
				// write new object using defaults and timestamp
				data.created = new Date().getTime();
				return common.putObject(details.name, install_dir, data);
			}).then(() => {
				// create default directories (scss/js/template)
				var dir_promises = [];
				dir_promises.push(fspro.mkDir(install_dir + '/' + variables.SASS_DIR));
				dir_promises.push(fspro.mkDir(install_dir + '/' + variables.JS_DIR));
				dir_promises.push(fspro.mkDir(install_dir + '/' + variables.TEMPLATES_DIR));

				return Promise.all(dir_promises);
			}).then(() => {
				// create default files
				var file_promises = [];
				// scss
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.SASS_DIR + '/' + state.name + '.scss', variables.DEFAULT_SASS));
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.SASS_DIR + '/._variables.scss', ''));
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.SASS_DIR + '/._modules.scss', ''));
				// js
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.JS_DIR + '/custom.js', ''));
				// templates
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.TEMPLATES_DIR + '/facets.html', variables.DEFAULT_TEMPLATE));
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.TEMPLATES_DIR + '/results.html', variables.DEFAULT_TEMPLATE));
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.TEMPLATES_DIR + '/main.html', variables.DEFAULT_TEMPLATE));

				return Promise.all(file_promises);
			}).catch(err => {
				if (err && err.message) err.message = 'v3 install(): ' + err.message;
				throw err;
			});
		} else {
			return Promise.reject(new Error('v3 install(): No details provided.'));
		}
	}
});

var reloadModules = (state) => ({
	reloadModules: () => {
		// empty module objects (to start fresh)
		for (var mod in state.modules) delete state.modules[mod];
		// load modules
		return loadModules(state).loadModules();
	}
});

var loadModules = (state) => ({
	loadModules: () => {
		var modules_dir = state.directory + '/' + variables.MODULE_DIR;

		return fspro.exists(modules_dir).then(exists => {
			if (!exists) {
				return fspro.mkDir(modules_dir);
			} else {
				return Promise.resolve();
			}
		}).then(() => {
			return fspro.readDir(modules_dir);
		}).then(folders => {
			console.log('loading ' + state.name + ' modules from: ' + modules_dir);

			folders = folders.map(folder => {
				return path.join(modules_dir, folder);
			});

			return fspro.lstat(folders);
		}).then(folder_stats => {
			var modules_promises = [];

			for (let stats of folder_stats) {
				let module_dir = stats.path;
				let name = path.basename(module_dir);

				// ignore non directories... or hidden folders (^.*)
				if (!stats.isDirectory() || name.match(/^\./)) continue;	// drop out of loop

				console.log('found a module: ', module_dir);
				modules_promises.push(loadModule(name, module_dir, state));
			}

			return Promise.all(modules_promises);
		}).then(() => {
			console.log('loaded ' + state.name + ' modules');
			return;
		}).catch(err => {
			if (err && err.message) err.message = 'v3 loadModules(): ' + err.message;
			throw err;
		});
	}
});

var loadModule = (name, module_dir, state) => {
	return mod(name, module_dir, state.directory).then(mod => {
		if (mod) {
			state.modules[name] = mod;
		}
	}).catch(err => {
		console.log(err);
		if (err && err.message) err.message = 'v3 loadModule(): ' + err.message;
		throw err;
	});
}

var update = (state) => ({
	update: (details) => {
		if (details) {
			if (common.compareKeys(state.data, details)) {
				state.data = details;
				return save(state).then(() => {
					return state;
				}).catch(err => {
					if (err && err.message) err.message = 'v3 update(): ' + err.message;
					throw err;
				});
			} else {
				return Promise.reject(new Error('v3 update(): Object key mismatch!'));
			}
		} else {
			return Promise.reject(new Error('v3 update(): No details provided.'));
		}
	}
});

var save = (state) => {
	return common.putObject(state.name, state.directory, state.data);
}

module.exports = {
	compile: compile,
	getData: getData,
	init: init,
	install: install,
	loadModules: loadModules,
	reloadModules: reloadModules,
	update: update,
	variables: variables
}
