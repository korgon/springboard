// ajax v3 catalog methods
'use strict';

var fs = require('fs');

var mod = require('./mod.js');

const DEFAULT_SASS =
'/* springboard generated styles for v3 */\n\
@import "._variables.scss";\n\
@import "._modules.scss";';
const DEFAULT_TEMPLATE = '<script type="text/ss-template" target=""></script>';

const variables = require('./common.js').variables;

// initialization
var init = (state) => {
	// load modules
	loadModules(state).loadModules();
}

// extensions
var getData = (state) => ({
	getData: () => {
		var modules = {};

		for (let mod in state.modules) {
			modules[mod] = state.modules[mod].getData();
		}
		return Object.assign(
			{},
			{ modules: modules },
			state.data
		);
	}
});

var compile = (state) => ({
	compile: () => {
		console.log('compiling ' + state.name);
	}
});

var install = (state) => ({
	install: (details) => {
		if (details) {
			var install_dir = details.directory + '/' + details.name;
			if (fs.existsSync(details.directory) && !fs.existsSync(install_dir)) {
				console.log('installing catalog to ' + details.directory);
				var source_config_file = state.directory + '/.' + state.name + '.json'
				var new_config_file = install_dir + '/.' + details.name + '.json';

				// create catalog folder and json
				fs.mkdirSync(install_dir);
				fs.writeFileSync(new_config_file, fs.readFileSync(source_config_file));

				// add scss build folder and files
				fs.mkdirSync(install_dir + '/' + variables.SASS_DIR);
				fs.writeFileSync(install_dir + '/' + variables.SASS_DIR + '/' + state.name + '.scss', variables.DEFAULT_SASS);
				fs.writeFileSync(install_dir + '/' + variables.SASS_DIR + '/._variables.scss', '');
				fs.writeFileSync(install_dir + '/' + variables.SASS_DIR + '/._modules.scss', '');

				// add js build folder and file
				fs.mkdirSync(install_dir + '/' + variables.JS_DIR);
				fs.writeFileSync(install_dir + '/' + variables.JS_DIR + '/custom.js', '');

				// add templates build folder and files
				fs.mkdirSync(install_dir + '/' + variables.TEMPLATES_DIR);
				fs.writeFileSync(install_dir + '/' + variables.TEMPLATES_DIR + '/facets.html', variables.DEFAULT_TEMPLATE);
				fs.writeFileSync(install_dir + '/' + variables.TEMPLATES_DIR + '/items.html', variables.DEFAULT_TEMPLATE);
				fs.writeFileSync(install_dir + '/' + variables.TEMPLATES_DIR + '/main.html', variables.DEFAULT_TEMPLATE);

			} else {
				// directory already exists...
				console.log('NOT GONNA INSTALL CATALOG!');
			}
		}
	}
});

var reloadModules = (state) => ({
	reloadModules: () => {
		// empty module objects (to start fresh)
		for (var mod in state.modules) delete state.modules[mod];
		// load modules
		loadModules(state).loadModules();
	}
});

var loadModules = (state) => ({
	loadModules: () => {
		var modules_dir = state.directory + '/' + variables.MODULE_DIR;
		if (fs.existsSync(modules_dir)) {
			console.log('loading ' + state.name + ' modules from: ' + modules_dir);

			try {
				var folders = fs.readdirSync(modules_dir);
			}
			catch(err) {
				console.error(err);
			}

			for (let folder of folders) {
				// ignore non directories... or hidden folders (^.*)
				let module_dir = modules_dir + '/' + folder;

				if (!fs.lstatSync(module_dir).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop

				console.log('found a module: ', module_dir);
				// add the module if it doesn't already exist
				if (!state.modules[folder]) state.modules[folder] = mod(folder, module_dir);

				// remove the module if it is empty (bad config)
				if (!state.modules[folder]) delete state.modules[folder];
			}	
		}
	}
});

module.exports = {
	compile: compile,
	getData: getData,
	init: init,
	install: install,
	loadModules: loadModules,
	reloadModules: reloadModules,
	variables: variables
}
