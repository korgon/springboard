// site "class"

// ajax v3 catalog theme methods

"use strict";

const fspro = require('_/fspro');
const library = require('./catalogs');

// site factory
const site = (name, directory, data, library) => {
	let state = {
		name,
		library: library,
		directory,
		json_file: directory + '/.' + name + '.json',
		data
	}

	return Object.assign(
		{},
		{
			name,
			branch: 'site/' + name,
			directory: state.directory
		},
		library,
		getData(state),
		getLibrary(state),
		update(state),
		reload(state)
	)
}

const getData = (state) => ({
	getData: () => {
		return state.data;
	}
});

const getLibrary = (state) => ({
	getLibrary: () => {
		let data = state.data;
		data.catalogs = {};

		for (let cat in state.library.catalogs) {
			data.catalogs[cat] = state.library.catalogs[cat].getData();
			data.catalogs[cat].modules = {};

			for (let mod in state.library.catalogs[cat].modules) {
				data.catalogs[cat].modules[mod] = state.library.catalogs[cat].modules[mod].getData();
				data.catalogs[cat].modules[mod].themes = {};

				for (let thm in state.library.catalogs[cat].modules[mod].themes) {
					data.catalogs[cat].modules[mod].themes[thm] = state.library.catalogs[cat].modules[mod].themes[thm].getData();
				}
			}
		}

		return data;
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
					if (err && err.message) err.message = 'site update(): ' + err.message;
					throw err;
				});
			} else {
				return Promise.reject(new Error('site update(): Object key mismatch!'));
			}
		} else {
			return Promise.reject(new Error('site update(): No details provided.'));
		}
	}
});

const reload = (state) => ({
	reload: () => {
		return fspro.getJSON(state.json_file).then(contents => {
			if (contents && contents.created) {
				state.data = contents;
				return state.library.reloadCatalogs();
			} else {
				throw new Error('Bad site data!')
			}
		}).then(() => {
			// reloaded site data and catalogs!
			return;
		}).catch(err => {
			if (err && err.message) err.message = 'site reload(): ' + err.message;
			throw err;
		})
	}
});

const save = (state) => {
	return fspro.putJSON(state.json_file, state.data);
}



// * * * * * * * * * * * */

// module exports
module.exports = function(name, directory) {
	console.log('loading site from ', directory);

	let json_data;
	let json_file = directory + '/.' + name + '.json';

	// load site json
	return fspro.getJSON(json_file).then(data => {
		if (data && data.created) {
			json_data = data;

			// load catalogs
			return library.load(directory);
		} else {
			throw new Error('Bad site data!')
		}
	}).then(lib => {
		console.log('loaded library...');
		return site(name, directory, json_data, lib);
	}).catch(err => {
		if (err && err.message) err.message = 'site load: ' + err.message;
		throw err;
	});
}
