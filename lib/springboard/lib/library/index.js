// springboard library
// contains all the catalogs

// houses catalogs and methods for installing and managing them
// eventually would be nice to make it easy to create new modules / themes from springboard (long way off)

/*
ideal methods

*/

"use strict";
var fs = require('fs');

var catalogs = {};
var catalog = require('./catalogs');

var library_directory;

// var library = require('./library')('pathtorepo')
module.exports = function(dir) {
	library_directory = dir;

	loadCatalogs();
  return {
		catalogs,
		reload: reloadCatalogs,
		json: jsonify()
  }
}



var reloadCatalogs = () => {
	// empty catalog objects (to start fresh)
	for (var cat in catalogs) delete catalogs[cat];
	loadCatalogs();
}

var loadCatalogs = () => {
	console.log('loading catalogs from: ', library_directory);

	try {
		var folders = fs.readdirSync(library_directory);
	}
	catch(err) {
		console.error(err);
	}

	for (var folder of folders) {
		// ignore non directories... or hidden folders (^.*)
		var catalog_dir = library_directory + '/' + folder;

		if (!fs.lstatSync(catalog_dir).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop

		console.log('found a catalog: ', catalog_dir);
		catalogs[folder] = catalog(folder, catalog_dir);

		if (!catalogs[folder]) delete catalogs[folder];

	}
}

var jsonify = () => {
	let status = {};

	// for (let cat in catalogs) {
	// 	status[cat] = catalogs[cat].status;
	// }

	return JSON.stringify(status);
}
