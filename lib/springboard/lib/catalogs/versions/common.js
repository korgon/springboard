// misc tools used for building v3 catalogs

'use strict';

var fspro = require('_/fspro');

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
	return fspro.exists(config_file).then(exists => {
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
	return fspro.exists(directory).then(exists => {
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
	putObject: putObject
}
