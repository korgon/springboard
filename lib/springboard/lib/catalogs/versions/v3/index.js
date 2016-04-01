// ajax v3 catalog methods
'use strict';

var fs = require('fs');
var fspro = require('_/fspro');
var mod = require('./mod.js');

const DEFAULT_SASS =
'/* springboard generated styles for v3 */\n\
@import "._variables.scss";\n\
@import "._modules.scss";';
const DEFAULT_TEMPLATE = '<script type="text/ss-template" target=""></script>';

const variables = require('./v3.js').variables;

// initialization
var init = (state) => {
	// load modules
	return loadModules(state).loadModules();
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
		return loadModules(state).loadModules();
	}
});

var loadModules = (state) => ({
	loadModules: () => {
		var modules_dir = state.directory + '/' + variables.MODULE_DIR;

		return fspro.exists(modules_dir).then(exists => {
			if (!exists) throw new Error('v3 loadModules(): ' + modules_dir + ' directory does not exist!');

			return fspro.readDir(modules_dir);
		}).then(folders => {
			console.log('loading ' + state.name + ' modules from: ' + modules_dir);

			var modulesPromises = [];

			for (var folder of folders) {
				let module_dir = modules_dir + '/' + folder;

				// ignore non directories... or hidden folders (^.*)
				if (!fs.lstatSync(module_dir).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop

				console.log('found a module: ', module_dir);
				modulesPromises.push(loadModule(folder, module_dir, state));
			}

			return Promise.all(modulesPromises);
		}).then(() => {
			console.log('loaded ' + state.name + ' modules');
			return;
		}).catch(err => {
			console.log(err);
			throw err;
		});
	}
});

var loadModule = (folder, module_dir, state) => {
	return mod(folder, module_dir).then(mod => {
		if (mod) {
			state.modules[folder] = mod;
		}
	}).catch(err => {
		console.log(err);
		throw err;
	});
}

module.exports = {
	compile: compile,
	getData: getData,
	init: init,
	install: install,
	loadModules: loadModules,
	reloadModules: reloadModules,
	variables: variables
}
