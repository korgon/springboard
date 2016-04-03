// ajax v3 catalog module methods

"use strict";

var fspro = require('_/fspro');
var fs = require('fs');

var thm = require('./thm.js');
var common = require('../common.js');
const variables = require('./v3.js').variables;

// module factory
var mod = (name, directory, data) => {
	let state = {
		name,
		directory,
		data,
		themes: {}
	}

	return init(state).then(() => {
		console.log('loaded module from ', directory);
		return Object.assign(
			{},
			{ themes: state.themes,
				directory: state.directory
			},
			getData(state),
			install(state),
			loadThemes(state),
			reloadThemes(state),
			setTheme(state),
			update(state)
		)
	});
}

// initialization
var init = (state) => {
	// load themes
	return loadThemes(state).loadThemes();
}

var reloadThemes = (state) => ({
	reloadThemes: () => {
		// empty module objects (to start fresh)
		for (var thm in state.themes) delete state.themes[thm];
		// load modules
		return loadThemes(state).loadThemes();
	}
});

var loadThemes = (state) => ({
	loadThemes: () => {
		console.log('loading ' + state.name + ' themes from: ' + state.directory);

		return fspro.readDir(state.directory).then(folders => {
			var theme_promises = [];

			for (var folder of folders) {
				var theme_dir = state.directory + '/' + folder;

				// ignore non directories... or hidden folders (^.*)
				if (!fs.lstatSync(theme_dir).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop

				console.log('found a theme: ', theme_dir);

				theme_promises.push(loadTheme(folder, theme_dir, state));
			}

			return Promise.all(theme_promises);
		}).then(() => {
			console.log('loaded ' + state.name + ' themes');
			return;
		}).catch(err => {
			if (err && err.message) err.message = 'v3 mod loadThemes(): ' + err.message;
			throw err;
		});
	}
});

var loadTheme = (folder, theme_dir, state) => {
	return thm(folder, theme_dir).then(theme => {
		if (theme) {
			state.themes[folder] = theme;
		}
	}).catch(err => {
		if (err && err.message) err.message = 'v3 mod loadTheme(): ' + err.message;
		throw err;
	});
}

var getData = (state) => ({
	getData: () => {
		var themes = {};

		for (let thm in state.themes) {
			themes[thm] = state.themes[thm].getData();
		}
		return Object.assign(
			{},
			{ themes: themes },
			state.data
		);
	}
});

// install module!
var install = (state) => ({
	install: (details) => {
		if (details) {
			var modules_dir = details.directory + '/' + variables.MODULE_DIR;
			var install_dir = modules_dir + '/' + details.name;
			var config;

			return fspro.exists(details.directory).then(exists => {
				if (!exists) {
					// if details.directory does not exist
					throw new Error('v3 mod install(): Install directory (' + details.directory + ') is invalid!');
				}

				// ensure that the install location is a directory
				if (!exists.isDirectory()) {
					throw new Error('v3 mod install(): Install directory (' + details.directory + ') is not a directory!');
				}

				// ensure that the module directory does not yet exist
				return fspro.exists(install_dir);
			}).then(exists => {
				if (exists) {
					// if details.directory does not exist
					throw new Error('v3 mod install(): Module already installed at location (' + details.directory + ')!');
				}

				// install module
				console.log('installing module to ' + details.directory);
				return common.getObject(state.name, state.directory);
			}).then(data => {
				config = data;
				config.created = new Date().getTime();

				return fspro.mkDir(install_dir);
			}).then(() => {
				// install theme
				if (config.theme === null && details.theme && state.themes[details.theme]) {
					return state.themes[details.theme].install({ directory: install_dir });
				} else {
					// the theme is invalid
					throw new Error('v3 mod install(): Theme [' + details.theme + '] is invalid!');
				}
			}).then(() => {
				// theme installed successfully...
				config.theme = details.theme;

				return common.putObject(details.name, install_dir, config);
			}).then(() => {
				return;
			}).catch(err => {
				if (err && err.message) err.message = 'v3 mod install(): ' + err.message;
				throw err;
			});
		} else {
			return Promise.reject(new Error('v3 mod install(): No details provided.'));
		}
	}
});

// change theme
var setTheme = (state) => ({
	setTheme: (name) => {
		if (state.themes[name]) {
			return state.themes[name].makeDefault().then(() => {
				state.data.theme = name;
				return save(state);
			}).catch(err => {
				if (err && err.message) err.message = 'v3 mod setTheme: ' + err.message;
				throw err;
			});
		} else {
			return Promise.reject(new Error('v3 mod setTheme(): Theme [' + name + '] not installed.'));
		}
	}
});

var update = (state) => ({
	update: (details) => {
		if (details) {
			if (common.compareKeys(state.data, details)) {
				state.data = details;
				save(state);
			} else {
				return Promise.reject(new Error('v3 mod update(): Object key mismatch!'));
			}
		} else {
		return Promise.reject(new Error('v3 mod update(): No details provided.'));
		}
	}
});

var save = (state) => {
	return common.putObject(state.name, state.directory, state.data);
}

module.exports = function(name, directory) {
	console.log('loading module from ', directory);
	return common.getObject(name, directory).then(data => {
		if (data && data.type) {
			return mod(name, directory, data);
		} else {
			return Promise.resolve();
		}
	}).catch(err => {
		// directory does not contain json, ignore it...
		return;
	});
}
