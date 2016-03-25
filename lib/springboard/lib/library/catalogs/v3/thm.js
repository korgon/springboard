// ajax v3 catalog theme methods

"use strict";

var fs = require('fs');
var tools = require('./tools.js');

// theme factory
var thm = (name, directory, data) => {
	let state = {
		name,
		directory,
		data
	}

	return Object.assign(
		{},
		install(state)
	)
}

var install = (state) => ({
  install: (details) => {
    console.log('copying data from ' + state.directory + ' to ' + details.directory);
    tools.copy(state.directory, details.directory);
  }
})

var getObject = (name, directory) => {
	// check for config file and read it
	if (fs.existsSync(directory + '/.' + name + '.json')) {
		try {
			var config = JSON.parse(fs.readFileSync(directory + '/.' + name + '.json'));
		} catch(err) {
			console.error(err);
		}
	}

	return config;
}

module.exports = function(name, directory) {
	console.log('loading module from ', directory);

	let data = getObject(name, directory);

	if (data && data.type) {
		return thm(name, directory, data);
	} else {
		return;
	}
}
