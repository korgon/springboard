// misc tools used for building v3 catalogs

'use strict';

var fspro = require('_/fspro');
var path = require('path');

// Constants
const MODULE_DIR = "modules";
const COMPILE_DIR = "generated";
const JS_DIR = "js";
const TEMPLATES_DIR = "templates";
const SASS_DIR = "scss";

const variables = {
	MODULE_DIR,
	COMPILE_DIR,
	JS_DIR,
	TEMPLATES_DIR,
	SASS_DIR
}

var compareKeys = function(thing1, thing2) {
	// ensure objects have same top level keys
}

/**
* getObject
* @param {string} name
* @param {string} directory
* @return {promise}
*/
var getObject = function(name, directory) {
	var config_file = directory + '/.' + name + '.json';
	// check for config file and read it
	fspro.exists(config_file).then(exists => {
		if (!exists) {
			throw new Error('getObject: ' + config_file + ' does not exist.');
		}
		return fspro.readFile(config_file);
	}).then(file => {
		return JSON.parse(file);
	}).catch(err => {
		throw err;
	});
}

var putObject = function(name, directory, object) {
	var config_file = directory + '/.' + name + '.json';
	// check for directory and write to it
	fspro.exists(directory).then(exists => {
		if (!exists) {
			throw new Error('putObject: ' + directory + ' does not exist.');
		}
		var config = JSON.stringify(object, null, 4);
		return fspro.writeFile(config_file, config);
	}).then(() => {
		return;
	}).catch(err => {
		throw err;
	});
}

module.exports = {
	compareKeys: compareKeys,
	getObject: getObject,
	putObject: putObject,
	variables: variables
}
