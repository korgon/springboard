// ajax v3 catalog theme methods

"use strict";

const fspro = require('_/fspro');
const variables = require('./v3.js').variables;

// theme factory
const thm = (name, directory, data) => {
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

const getData = (state) => ({
	getData: () => {
		return Object.assign(
			{},
			{
				name: state.name
			},
			state.data
		);
	}
});

const install = (state) => ({
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

const update = (state) => ({
	update: (details) => {
		if (details) {
			if (fspro.compareKeys(state.data, details)) {
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

const save = (state) => {
	let json_file = state.directory + '/.' + state.name + '.json';
	return fspro.putJSON(json_file, state.data);
}

// module exports
module.exports = function(name, directory) {
	let json_file = directory + '/.' + name + '.json';
	return fspro.getJSON(json_file).then(data => {
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
