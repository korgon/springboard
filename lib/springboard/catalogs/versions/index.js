// springboard catalogs

/*
Composable catalog factory. Created for easy extension.

Requires an input name and directory of catalog

Returns a catalog object:
{
	state
	modules
	directory
	getData(state),
	compile(state),
	install(state),
	loadModules(state),
	reloadModules(state),
	update(state)
}

*/

"use strict";
const fspro = require('_/fspro');

const types = {};
types.v3 = require('./v3');


const catalog = (name, directory, data) => {
	let state = {
		name,
		directory,
		data,
		variables: types[data.type].variables,
		modules: {}
	}

	return types[state.data.type].init(state).then(() => {
		return Object.assign(
			{},
			{
				modules: state.modules,
				directory: state.directory
			},
			types[state.data.type].getData(state),
			types[state.data.type].compile(state),
			types[state.data.type].install(state),
			types[state.data.type].loadModules(state),
			types[state.data.type].reloadModules(state),
			types[state.data.type].update(state)
		)
	});

}

module.exports = function(name, directory) {
	let json_file = directory + '/.' + name + '.json';

	return fspro.getJSON(json_file).then(data => {
		if (data && data.type && types[data.type]) {
			return catalog(name, directory, data);
		} else {
			return Promise.resolve();
		}
	}).catch(err => {
		// directory does not contain json, ignore it...
		return;
	});
}
