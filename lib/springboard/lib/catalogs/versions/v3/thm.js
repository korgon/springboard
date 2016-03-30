// ajax v3 catalog theme methods

"use strict";

var fs = require('fs');
var common = require('./common.js');
const variables = common.variables;

// theme factory
var thm = (name, directory, data) => {
	let state = {
		name,
		directory,
		data
	}

	return Object.assign(
		{},
		getData(state),
		install(state),
		makeDefault(state),
		update(state)
	)
}

var getData = (state) => ({
	getData: () => {
		return state.data;
	}
});

var install = (state) => ({
	install: (details) => {
		if (details) {
			if (fs.existsSync(details.directory) && !fs.existsSync(details.directory + '/' + state.name )) {
				console.log('copying data from ' + state.directory + ' to ' + details.directory);
				common.copy(state.directory, details.directory);
				linkup(state);
			} else {
				// directory already exists...
				console.log('NOT GONNA INSTALL THEME!');
			}
		}
	}
});

var makeDefault = (state) => ({
	makeDefault: () => {
		linkup(state);
	}
});

var update = (state) => ({
	update: (details) => {
		if (details) {
			if (common.compareKeys(state.data, details)) {
				state.data = details;
				save(state);
			}
		}
	}
});

// reusable functions

var linkup = (state) => {
	
}

var save = (state) => {
	common.putObject(state.name, state.directory, state.data);
}

// module exports

module.exports = function(name, directory) {
	console.log('loading module from ', directory);

	let data = common.getObject(name, directory);

	if (data && data.type) {
		return thm(name, directory, data);
	}
}
