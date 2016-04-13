/*
catalog
does what?

initialize

installCatalog
installModule
installTheme

updateCatalog
updateModule
updateTheme(json)

eg:
catalogs.v3.install(locobj)		// install catalog
catalogs['v3'].install()

catalogs.v3.modules['slideout'].install()		// install slideout module

catalogs.v3.compile()		// build out templates and whatever else
catalogs.v3.sync(json)	// update variables

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
