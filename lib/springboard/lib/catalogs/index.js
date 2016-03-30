// springboard catalog library
// contains functionality for various catalog versions

// eventually would be nice to make it easy to create new modules / themes from springboard (long way off)

"use strict";
var fs = require('fs');

var catalog = require('./versions');

var library = (directory) => {
	let state = {
		directory,
		catalogs: {}
	}

	init(state);

	return Object.assign(
		{},
		{
			catalogs: state.catalogs,
		},
		getData(state),
		reloadCatalogs(state)
	)
}

// initialization
var init = (state) => {
	// load themes
	loadCatalogs(state);
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
		loadCatalogs(state);
	}
})

var loadCatalogs = (state) => {
	console.log('loading catalogs from: ', state.directory);

	try {
		var folders = fs.readdirSync(state.directory);
	}
	catch(err) {
		console.error(err);
	}

	for (var folder of folders) {
		// ignore non directories... or hidden folders (^.*)
		var catalog_dir = state.directory + '/' + folder;

		if (!fs.lstatSync(catalog_dir).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop

		console.log('found a catalog: ', catalog_dir);
		state.catalogs[folder] = catalog(folder, catalog_dir);

		if (!state.catalogs[folder]) delete state.catalogs[folder];

	}
}

module.exports = function(directory) {
	console.log('loading catalogs from ', directory);
	if (fs.existsSync(directory)) {
		return library(directory);
	}
}
