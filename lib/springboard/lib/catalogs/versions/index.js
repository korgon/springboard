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
var fs = require('fs');
var common = require('./common.js');

var types = {};
types.v3 = require('./v3');


var catalog = (name, directory, data) => {
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
			types[state.data.type].reloadModules(state)
		)
	});

}

module.exports = function(name, directory) {
	console.log('loading from ', directory);

	return common.getObject(name, directory).then(data => {
		if (data && data.type && types[data.type]) {
			return catalog(name, directory, data);
		} else {
			return ;
		}
	});
}
