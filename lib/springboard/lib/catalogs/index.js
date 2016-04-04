// springboard catalog library
// contains functionality for various catalog versions

// eventually would be nice to make it easy to create new modules / themes from springboard (long way off)

"use strict";
var fs = require('fs');
var path = require('path');
var fspro = require('_/fspro');

var catalog = require('./versions');

var library = (directory) => {
	let state = {
		directory,
		catalogs: {}
	}

	return init(state).then(() => {
		return Object.assign(
			{},
			{
				catalogs: state.catalogs,
			},
			getData(state),
			reloadCatalogs(state)
		)
	});
}

// initialization
var init = (state) => {
	// load themes
	return loadCatalogs(state);
}

// spit out a complete catalog object
var getData = (state) => ({
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

var reloadCatalogs = (state) => ({
	reloadCatalogs: () => {
		// empty catalog objects (to start fresh)
		for (var cat in state.catalogs) delete state.catalogs[cat];
		return loadCatalogs(state);
	}
})

var loadCatalogs = (state) => {
	console.log('loading catalogs from: ', state.directory);

	return fspro.readDir(state.directory).then(folders => {
		folders = folders.map(folder => {
			return path.join(state.directory, folder);
		});
		return fspro.lstat(folders);
	}).then(folder_stats => {
		var catalogsPromises = [];

		for (let stats of folder_stats) {
			// ignore non directories... or hidden folders (^.*)
			let catalog_dir = stats.path;
			let name = path.basename(catalog_dir);

			if (!stats.isDirectory() || name.match(/^\./)) continue;	// drop out of loop

			console.log('found a catalog: ', catalog_dir);
			catalogsPromises.push(loadCatalog(name, catalog_dir, state));
		}

		return Promise.all(catalogsPromises);
	}).then(() => {
		console.log('loaded catalogs');
	}).catch(err => {
		throw err;
	});
}

var loadCatalog = (name, catalog_dir, state) => {
	return catalog(name, catalog_dir).then(catalog => {
		if (catalog) {
			state.catalogs[name] = catalog;
		}
	});
}

var load = (directory) => {
	return fspro.exists(directory).then(dir => {
		if (dir.isDirectory()) {
			return library(directory);
		} else {
			throw new Error('v3 catalogs: ' + directory + ' does not exist.');
		}
	});
}

module.exports = {
	load: load
}
