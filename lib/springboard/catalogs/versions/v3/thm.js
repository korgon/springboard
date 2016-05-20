// ajax v3 catalog theme methods

"use strict";

const fspro = require('_/fspro');
const variables = require('./v3.js').variables;

// theme factory
const thm = (name, directory, data) => {
	let state = {
		name,
		directory,
		data,
		contents: {}
	}

	return init(state).then(() => {
		return Object.assign(
			{},
			compileVariables(state),
			getContents(state),
			getData(state),
			install(state),
			update(state)
		)
	});
}

// initialization
const init = (state) => {
	// check for theme contents (scss/js/template)
	let js_dir = state.directory + '/' + variables.JS_DIR;
	let sass_dir = state.directory + '/' + variables.SASS_DIR;
	let templates_dir = state.directory + '/' + variables.TEMPLATES_DIR;

	return fspro.readDir(js_dir).then((contents) => {
		state.contents.js = contents;
	}).catch(err => {
		// do nothing!
	}).then(() => {
		return fspro.readDir(sass_dir);
	}).then((contents) => {
		state.contents.sass = contents;
	}).catch(err => {
		// do nothing!
	}).then(() => {
		return fspro.readDir(templates_dir);
	}).then((contents) => {
		state.contents.templates = contents;
	}).catch(err => {
		// do nothing!
	});
}

// create sass variables include file
const compileVariables = (state) => ({
	compileVariables: () => {
		let sass_dir = state.directory + '/' + variables.SASS_DIR;
		let sass_variables_file = sass_dir + '/' + variables.COMPILED_SASS_VARIABLES;

		let sass_variables_content = '/* springboard generated variables (do not edit manually) */\n';

		for (let avar in state.data.variables) {
			sass_variables_content +=	'var ' + avar + ' = ';

			let variable = state.data.variables[avar];
			if (variable.type == boolean) {
				sass_variables_content += variable.value + ';';
			} else if (variable.type == 'string') {
				sass_variables_content += '\'' + variable.value.replace(/'/g, "\\\'") + '\';';
			} else if (variable.type == 'number') {
				sass_variables_content += variable.value + ';';
			} else {
				sass_variables_content += variable.value + ';';
			}
			sass_variables_content += '\n';
		}

		return fspro.writeFile(sass_variables_file, sass_variables_content);
	}
});

const getContents = (state) => ({
	// returns contents of folders (scss/js/templates)
	getContents: () => {
		return Object.assign(
			{},
			state.contents
		);
	}
});

const getData = (state) => ({
	// returns state data object that is typically saved to disk in json file
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
			// remove added attributes
			delete details.name;
			
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
