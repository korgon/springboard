// springboard catalog library
// contains functionality for various catalog versions

// eventually would be nice to make it easy to create new modules / themes from springboard (long way off)

"use strict";
var fs = require('fs');
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

var getData = (state) => ({
	getData: () => {
		let status = {};

		for (let cat in state.catalogs) {
			status[cat] = state.catalogs[cat].getData();
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
		var catalogsPromises = [];

		for (var folder of folders) {
			// ignore non directories... or hidden folders (^.*)
			var catalog_dir = state.directory + '/' + folder;

			if (!fs.lstatSync(catalog_dir).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop

			console.log('found a catalog: ', catalog_dir);
			catalogsPromises.push(loadCatalog(folder, catalog_dir, state));
		}

		return Promise.all(catalogsPromises);
	}).then(() => {
		console.log('loaded catalogs');
	}).catch(err => {
		throw err;
	});
}

var loadCatalog = (folder, catalog_dir, state) => {
	return catalog(folder, catalog_dir).then(catalog => {
		if (catalog) {
			state.catalogs[folder] = catalog;
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
