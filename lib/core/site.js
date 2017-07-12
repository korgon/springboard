// site "class"
// composable object factory
// returns a springboard library object contained in a website object

"use strict";

const fspro = require('_/fspro');
const library = require('./catalogs');
const options = require('_/config')();

// site factory
const site = (name, directory, data, library) => {
	let state = {
		name,
		library,
		directory,
		json_file: directory + '/.' + name + '.json',
		data
	}

	return Object.assign(
		{},
		{
			name,
			branch: 'site/' + name,
			directory
		},
		library,
		compile(state),
		getData(state),
		getFiles(state),
		getState(state),
		update(state),
		reload(state)
	);
}

// compiles a catalog
const compile = (state) => ({
	compile: (catalog_name, to_compile) => {
		to_compile = to_compile || 'all';
		let catalog = state.library.catalogs[catalog_name].getData();

		if (catalog && state.library.catalogs[catalog_name].compile[to_compile]) {
			let variables = {
				siteid: catalog.settings.siteid.value || state.data.settings.siteid.value || 'xxxxxx',
				context: catalog.settings.context.value || '',
				site: state.name,
				catalog: catalog_name,
				cdn: options.cdn_url + '/' + options.sites_base_dir
			}
			if (state.data.proxy.enable && state.data.proxy.enable.value) {
				variables.proxy = {
					catalog: state.data.proxy.catalog ? state.data.proxy.catalog.value : ''
				}
			}
			return state.library.catalogs[catalog_name].compile[to_compile](variables);
		} else {
			return Promise.reject('Catalog not found in site.');
		}
	}
});

// returns a new object with the current site state (for updating)
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

// returns object of the site file structure contents
const getFiles = (state) => ({
	getFiles: () => {
		return fspro.getDirStruct(state.directory).then(structure => {
			recurseModifyStruct(structure.root.contents);

			function recurseModifyStruct(object) {
				for (let entry in object) {
					object[entry].level = object[entry].path.split('/').length;
					if (object[entry].type == 'file') {
						// check if in cloud_files
						object[entry].cloud = state.data.cloud_files.indexOf(object[entry].path) != -1;
					} else if (object[entry].type == 'directory') {
						// check if any cloud_files in directory
						let match_cloud = new RegExp('^' + object[entry].path + '\/', 'i');
						object[entry].cloud = state.data.cloud_files.filter((file) => file.match(match_cloud)).length;
						recurseModifyStruct(object[entry].contents);
					}
				}
			}

			return structure;
		});
	}
});

// return a new object with the site library and site state
const getState = (state) => ({
	getState: () => {
		let catalogs = {};

		for (let cat in state.library.catalogs) {
			catalogs[cat] = state.library.catalogs[cat].getData();
			catalogs[cat].modules = {};

			for (let mod in state.library.catalogs[cat].modules) {
				catalogs[cat].modules[mod] = state.library.catalogs[cat].modules[mod].getData();
				catalogs[cat].modules[mod].themes = {};

				for (let thm in state.library.catalogs[cat].modules[mod].themes) {
					catalogs[cat].modules[mod].themes[thm] = state.library.catalogs[cat].modules[mod].themes[thm].getData();
				}
			}
		}

		return Object.assign(
			{},
			state.data,
			{
				catalogs
			}
		);
	}
});

// update the site state
// must have same number of top level object keys
const update = (state) => ({
	update: (details) => {
		if (details) {
			// remove catalogs
			delete details.catalogs;
			if (fspro.compareKeys(state.data, details)) {
				state.data = details;
				return save(state).then(() => {
					return state;
				}).catch(err => {
					if (err && err.message) err.message = 'site update(): ' + err.message;
					throw err;
				});
			} else {
				return Promise.reject(new Error('site update(): Object key mismatch!'));
			}
		} else {
			return Promise.reject(new Error('site update(): No details provided.'));
		}
	}
});

// reload state data from JSON and library
const reload = (state) => ({
	reload: () => {
		return fspro.getJSON(state.json_file).then(contents => {
			if (contents && contents.created) {
				state.data = contents;
				return state.library.reloadCatalogs();
			} else {
				throw new Error('Bad site data!')
			}
		}).then(() => {
			// unlink catalog directories
			let unlinkdir_promises = [];

			for (let cat in state.library.catalogs) {
				unlinkdir_promises.push(state.library.catalogs[cat].actions.unlinkDirs());
			}

			return Promise.all(unlinkdir_promises);
		}).then(() => {
			// link directories
			let linkdir_promises = [];

			for (let cat in state.library.catalogs) {
				for (let mod in state.library.catalogs[cat].modules) {
					linkdir_promises.push(state.library.catalogs[cat].modules[mod].linkDirs());
				}
			}

			return Promise.all(linkdir_promises);
		}).then(() => {
			// done reloading site data and catalogs!
			return;
		}).catch(err => {
			if (err && err.message) err.message = 'site reload(): ' + err.message;
			throw err;
		})
	}
});

// save current state to JSON file
const save = (state) => {
	return fspro.putJSON(state.json_file, state.data);
}



// * * * * * * * * * * * */

// module exports
module.exports = function(name, directory) {
	let json_data;
	let json_file = directory + '/.' + name + '.json';

	return fspro.exists(json_file).then(stats => {
		if (stats) {
			// load site json
			return fspro.getJSON(json_file)
		} else {
			throw new Error('Site does not have a config!');
		}
	}).then(data => {
		if (data && data.created) {
			json_data = data;

			// load library
			return library.load(directory);
		} else {
			throw new Error('Bad site data!')
		}
	}).then(lib => {
		// loaded library
		return site(name, directory, json_data, lib);
	}).catch(err => {
		// return empty object on fail for smooth loading of other sites
		return false;
	});
}
