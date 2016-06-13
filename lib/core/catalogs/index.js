// springboard catalog library
// contains functionality for various catalog versions

// eventually would be nice to make it easy to create new modules / themes from springboard (long way off)

"use strict";

const path = require('path');
const fspro = require('_/fspro');

const catalog = require('./versions');

const library = (directory) => {
	let state = {
		directory,
		catalogs: {}
	}

	return loadCatalogs(state).then(() => {
		return Object.assign(
			{},
			{
				catalogs: state.catalogs,
				directory: state.directory
			},
			getData(state),
			reloadCatalogs(state)
		)
	});
}

// spit out a complete catalog object
const getData = (state) => ({
	getData: () => {
		let status = {};

		for (let cat in state.catalogs) {
			status[cat] = state.catalogs[cat].getData();
			status[cat].modules = {};

			for (let mod in state.catalogs[cat].modules) {
				status[cat].modules[mod] = state.catalogs[cat].modules[mod].getData();
				status[cat].modules[mod].themes = {};

				for (let thm in state.catalogs[cat].modules[mod].themes) {
					status[cat].modules[mod].themes[thm] = state.catalogs[cat].modules[mod].themes[thm].getData();
				}
			}
		}
		return status;
	}
})

const reloadCatalogs = (state) => ({
	reloadCatalogs: () => {
		return loadCatalogs(state);
	}
})

const loadCatalogs = (state) => {
	return fspro.readDir(state.directory).then(folders => {
		folders = folders.map(folder => {
			return path.join(state.directory, folder);
		});
		return fspro.lstat(folders);
	}).then(folder_stats => {
		let catalogsPromises = [];
		let catalog_dirs = [];

		for (let stats of folder_stats) {
			// ignore non directories... or hidden folders (^.*)
			let catalog_dir = stats.path;
			let name = path.basename(catalog_dir);

			if (!stats.isDirectory() || name.match(/^\./)) continue;	// drop out of loop

			catalogsPromises.push(loadCatalog(name, catalog_dir, state));
			catalog_dirs.push(name);
		}

		// loop through any existing catalogs and remove any that no longer exist
		for (let catalog in state.catalogs) {
			if (catalog_dirs.indexOf(catalog) == -1) delete state.catalogs[catalog];
		}

		return Promise.all(catalogsPromises);
	}).then(() => {
		return;
	}).catch(err => {
		throw err;
	});
}

// load a single catalog. called by loadCatalogs();
const loadCatalog = (name, catalog_dir, state) => {
	return catalog(name, catalog_dir).then(catalog => {
		if (catalog) {
			state.catalogs[name] = catalog;
		}
	});
}

// returns a library of catalogs catalog object
const load = (directory) => {
	return fspro.exists(directory).then(dir => {
		if (dir && dir.isDirectory()) {
			return library(directory);
		} else {
			throw new Error('Catalogs: ' + directory + ' does not exist.');
		}
	});
}

module.exports = {
	load: load
}
