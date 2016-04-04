// misc tools used for building v3 catalogs

'use strict';

var fspro = require('_/fspro');

/**
* compare two objects top level keys
* @param {object} thing1
* @param {object} thing2
* @return {boolean}
*/
var compareKeys = function(thing1, thing2) {
	var equality = true;
	// ensure objects have same top level keys
	var thing1_keys = Object.keys(thing1);
	var thing2_keys = Object.keys(thing2);

	// check that thing1 keys exist in thing2
	for (let key of thing1_keys) {
		if (typeof thing2[key] == 'undefined') {
			equality = false;
			break;
		}
	}

	// check thing2 keys in thing1 if thing1 keys were in thing2...
	if (equality) {
		// check that thing2 keys exist in thing1
		for (let key of thing2_keys) {
			if (typeof thing1[key] == 'undefined') {
				equality = false;
				break;
			}
		}
	}

	// check that the types are the same
	if (thing1.type != thing2.type) {
		equality = false;
	}

	return equality;
}

/**
* get JSON file, parse it and return it
* @param {string} name
* @param {string} directory
* @return {promise}
*/
var getObject = function(name, directory) {
	var config_file = directory + '/.' + name + '.json';
	// check for config file and read it
	return fspro.exists(config_file).then(exists => {
		if (!exists) {
			throw new Error('getObject: ' + config_file + ' does not exist.');
		} else {
			return fspro.readFile(config_file);
		}
	}).then(file => {
		return JSON.parse(file);
	}).catch(err => {
		if (err && err.message) err.message = 'catalogs getObject(): ' + err.message;
		throw err;
	});
}

/**
* put object, JSONify it and write it to file
* @param {string} name
* @param {string} directory
* @return {promise}
*/
var putObject = function(name, directory, object) {
	var config_file = directory + '/.' + name + '.json';
	// check for directory and write to it
	return fspro.exists(directory).then(exists => {
		if (!exists) {
			throw new Error('putObject: ' + directory + ' does not exist.');
		} else {
			var config = JSON.stringify(object, null, 4);
			return fspro.writeFile(config_file, config);
		}
	}).then(() => {
		return;
	}).catch(err => {
		if (err && err.message) err.message = 'catalogs putObject(): ' + err.message;
		throw err;
	});
}

module.exports = {
	compareKeys: compareKeys,
	getObject: getObject,
	putObject: putObject
}
