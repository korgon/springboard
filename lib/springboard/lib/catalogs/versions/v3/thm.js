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
			return fspro.exists(details.directory).then(exists => {
				if (!exists) {
					throw new Error('v3 thm install(): Directory ' + details.directory + ' does not exists.');
				} else {
					return fspro.exists(details.directory + '/' + state.name);
				}
			}).then(exists => {
				if (exists) {
					throw new Error('v3 thm install(): Directory ' + details.directory + '/' + state.name + ' exists.');
				} else {
					return fspro.copyDir(state.directory, details.directory);
				}
			}).then(() => {
				return;
			}).catch(err => {
				if (err && err.message) err.message = 'v3 thm install(): ' + err.message;
				throw err;
			});;
		} else {
			return Promise.reject(new Error('v3 thm install(): No details provided.'));
		}
	}
});

var update = (state) => ({
	update: (details) => {
		if (details) {
			if (common.compareKeys(state.data, details)) {
				state.data = details;
				return save(state).then(() => {
					return state;
				}).catch(err => {
					if (err && err.message) err.message = 'v3 thm update(): ' + err.message;
					throw err;
				});
			} else {
				return Promise.reject(new Error('v3 thm update(): Object key mismatch!'));
			}
		} else {
			return Promise.reject(new Error('v3 thm update(): No details provided.'));
		}
	}
});

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
	}).catch(err => {
		if (err && err.message) err.message = 'v3 thm load: ' + err.message;
		throw err;
	});
}
