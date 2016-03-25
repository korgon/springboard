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

var types = {};
types.v3 = require('./v3');

// Constants
const MODULE_DIR = "modules";
const COMPILE_DIR = "generated";
const JS_DIR = "js";
const TEMPLATES_DIR = "templates";
const SASS_DIR = "scss";


var catalog = (name, directory, data) => {
	let state = {
		name,
		directory,
		data,
		module_directory: directory + '/' + MODULE_DIR,
		compile_directory: directory + '/' + COMPILE_DIR,
		js_directory: directory + '/' + JS_DIR,
		templates_directory: directory + '/' + TEMPLATES_DIR,
		sass_directory: directory + '/' + SASS_DIR,
		modules: {}
	}

	types[state.data.type].init(state);

	//types[state.type].init(state);

	return Object.assign(
		{},
		{ modules: state.modules,
			directory: state.directory
		},
		types[state.data.type].compile(state),
		types[state.data.type].install(state),
		types[state.data.type].loadModules(state)
	)
}

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
	console.log('loading from ', directory);

	let data = getObject(name, directory);

	if (data && data.type && types[data.type]) {
		return catalog(name, directory, data);
	} else {
		return ;
	}
}
