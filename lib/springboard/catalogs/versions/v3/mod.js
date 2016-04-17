// ajax v3 catalog module methods

"use strict";

const fspro = require('_/fspro');
const path = require('path');

const thm = require('./thm.js');
const variables = require('./v3.js').variables;

// module factory
const mod = (name, directory, catalog_directory, data) => {
	let state = {
		name,
		directory,
		catalog_directory,
		data,
		themes: {}
	}

	return init(state).then(() => {
		return Object.assign(
			{},
			{
				themes: state.themes,
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
const init = (state) => {
	// load themes
	return loadThemes(state).loadThemes();
}

const reloadThemes = (state) => ({
	reloadThemes: () => {
		// empty module objects (to start fresh)
		for (let thm in state.themes) delete state.themes[thm];
		// load modules
		return loadThemes(state).loadThemes();
	}
});

const loadThemes = (state) => ({
	loadThemes: () => {
		return fspro.readDir(state.directory).then(folders => {
			folders = folders.map(folder => {
				return path.join(state.directory, folder);
			});
			return fspro.lstat(folders);
		}).then(folder_stats => {
			var theme_promises = [];

			for (let stats of folder_stats) {
				let theme_dir = stats.path;
				let name = path.basename(theme_dir);

				// ignore non directories... or hidden folders (^.*)
				if (!stats.isDirectory() || name.match(/^\./)) continue;	// drop out of loop

				theme_promises.push(loadTheme(name, theme_dir, state));
			}

			return Promise.all(theme_promises);
		}).then(() => {
			return;
		}).catch(err => {
			if (err && err.message) err.message = 'v3 mod loadThemes(): ' + err.message;
			throw err;
		});
	}
});

const loadTheme = (name, theme_dir, state) => {
	return thm(name, theme_dir).then(theme => {
		if (theme) {
			state.themes[name] = theme;
		}
	}).catch(err => {
		if (err && err.message) err.message = 'v3 mod loadTheme(): ' + err.message;
		throw err;
	});
}

const getData = (state) => ({
	getData: () => {
		return Object.assign(
			{},
			{
				name: state.name
			},
			state.data
		);
	}
});

// install module!
const install = (state) => ({
	install: (details) => {
		if (details && details.directory && details.name && details.theme) {
			var modules_dir = details.directory + '/' + variables.MODULE_DIR;
			var install_dir = modules_dir + '/' + details.name;
			let json_source_file = state.directory + '/.' + state.name + '.json';
			let json_file = install_dir + '/.' + details.name + '.json';
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

				// TODO if module is not multiple friendly ensure there are no others of that type installed.

				// install module
				return fspro.getJSON(json_source_file);
			}).then(data => {
				config = data;
				config.created = new Date().getTime();

				if (state.themes[details.theme]) {
					return fspro.mkDir(install_dir);
				} else {
					// the theme is invalid
					throw new Error('v3 mod install(): Theme [' + details.theme + '] is invalid!');
				}
			}).then(() => {
				// install theme
				return state.themes[details.theme].install({ directory: install_dir });
			}).then(() => {
				// link the theme
				return link(details.directory, install_dir, details.name, details.theme);
			}).then(() => {
				// theme installed and linked successfully...
				config.theme = details.theme;
				return fspro.putJSON(json_file, config);
			}).then(() => {
				return;
			}).catch(err => {
				if (err && err.message) err.message = 'v3 mod install(): ' + err.message;
				throw err;
			});
		} else {
			return Promise.reject(new Error('v3 mod install(): Invalid details provided.'));
		}
	}
});

// change theme
const setTheme = (state) => ({
	setTheme: (name) => {
		if (state.themes[name]) {
			return link(state.catalog_directory, state.directory, state.name, name).then(() => {
				// update data and save
				state.data.theme = name;
				return save(state);
			});
		} else {
			return Promise.reject(new Error('v3 mod setTheme(): Theme [' + name + '] not installed.'));
		}
	}
});

// linkup theme folders to build folders
const link = (catalog_directory, module_directory, module_name, theme_name) => {
	// link locations
	let js_link = catalog_directory + '/' + variables.JS_DIR + '/' + module_name;
	let sass_link = catalog_directory + '/' + variables.SASS_DIR + '/' + module_name;
	let templates_link = catalog_directory + '/' + variables.TEMPLATES_DIR + '/' + module_name;

	// actual files
	let real_js_link = module_directory + '/' + theme_name + '/' + variables.JS_DIR;
	let real_sass_link = module_directory + '/' + theme_name + '/' + variables.SASS_DIR;
	let real_templates_link = module_directory + '/' + theme_name + '/' + variables.TEMPLATES_DIR;

	// unlink first
	let unlink_promises = [];
	unlink_promises.push(fspro.unLink(js_link));
	unlink_promises.push(fspro.unLink(sass_link));
	unlink_promises.push(fspro.unLink(templates_link));

	return Promise.all(unlink_promises).then(() => {
		// link to module theme
		let link_promises = [];
		link_promises.push(fspro.linkUp(real_js_link, js_link));
		link_promises.push(fspro.linkUp(real_sass_link, sass_link));
		link_promises.push(fspro.linkUp(real_templates_link, templates_link));

		return Promise.all(link_promises);
	}).catch(err => {
		throw err;
	});
}

const update = (state) => ({
	update: (details) => {
		if (details) {
			if (fspro.compareKeys(state.data, details)) {
				state.data = details;
				return save(state).then(() => {
					return state;
				}).catch(err => {
					if (err && err.message) err.message = 'v3 mod update(): ' + err.message;
					throw err;
				});
			} else {
				return Promise.reject(new Error('v3 mod update(): Object key mismatch!'));
			}
		} else {
			return Promise.reject(new Error('v3 mod update(): No details provided.'));
		}
	}
});

const save = (state) => {
	let json_file = state.directory + '/.' + state.name + '.json';
	return fspro.putJSON(json_file, state.data);
}

module.exports = function(name, directory, parent_directory) {
	let json_file = directory + '/.' + name + '.json';

	return fspro.getJSON(json_file).then(data => {
		if (data && data.type) {
			return mod(name, directory, parent_directory, data);
		} else {
			return Promise.resolve();
		}
	}).catch(err => {
		// directory does not contain json, ignore it...
		return;
	});
}