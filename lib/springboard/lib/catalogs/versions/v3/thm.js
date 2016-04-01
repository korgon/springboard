// ajax v3 catalog theme methods

"use strict";

var fspro = require('_/fspro');
var common = require('../common.js');
const variables = require('./v3.js').variables;

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
		return new Promise(function(resolve, reject) {
			if (details) {
				fspro.exists(details.directory).then(exists => {
					if (!exists) {
						throw new Error('Theme install(): Directory ' + details.directory + ' does not exists.');
					} else {
						return fspro.exists(details.directory + '/' + state.name);
					}
				}).then(exists => {
					if (exists) {
						throw new Error('Theme install(): Directory ' + details.directory + '/' + state.name + ' exists.');
					} else {
						return common.copy(state.directory, details.directory);
					}
				}).then(() => {
					return linkup(state);
				}).then(() => {
					return;
				}).catch(err => {
					throw err;
				});;
			} else {
				throw new Error('Theme install(): No details provided.');
			}
		});
	}
});

var makeDefault = (state) => ({
	makeDefault: () => {
		linkup(state);
	}
});

var update = (state) => ({
	update: (details) => {
		return new Promise(function(resolve, reject) {
			if (details) {
				if (common.compareKeys(state.data, details)) {
					state.data = details;
					save(state).then(() => {
						return;
					}).catch(err => {
						throw err;
					})
				}
			} else {
				throw new Error('Theme update(): No details provided.');
			}
		});
	}
});

// reusable functions

var linkup = (state) => {
	return new Promise(function(resolve, reject) {
		return resolve();
	});
}

var save = (state) => {
	return common.putObject(state.name, state.directory, state.data);
}

// module exports
module.exports = function(name, directory) {
	console.log('loading theme from ', directory);

	return common.getObject(name, directory).then(data => {
		if (data && data.type) {
			return thm(name, directory, data);
		} else {
			return false;
		}
	});
}
