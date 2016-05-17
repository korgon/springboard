// ajax v3 catalog methods
'use strict';

const path = require('path');

const sass = require('node-sass');
const css = require('clean-css');

const fspro = require('_/fspro');

const mod = require('./mod.js');
const variables = require('./v3.js').variables;

// initialization
const init = (state) => {
	// load modules
	return loadModules(state).loadModules();
}

// extensions

const compile = (state) => ({
	compile: {
		all: () => {
			let compile_promises = [];

			compile_promises.push(compileSassModules(state));
			compile_promises.push(compileSassVariables(state));
			compile_promises.push(compileJs(state));
			compile_promises.push(compileTemplates(state));

			return Promise.all(compile_promises).then(() => {
				return compileCatalog(state);
			}).catch(err => {
				if (err && err.message) err.message = 'v3 compile(): ' + err.message;
				throw err;
			});
		},
		sassModules: () => compileSassModules(state),
		sassVariables: () => compileSassVariables(state),
		js: () => compileJs(state),
		templates: () => compileTemplates(state),
		catalog: () => compileCatalog(state)
	}
});

const checkGeneratedDir = (generated_dir) => {
	return fspro.exists(generated_dir).then(exists => {
		// ensure generated_dir exists
		if (!exists) {
			return fspro.mkDir(generated_dir);
		} else {
			return Promise.resolve();
		}
	});
}

// concatenate js
const compileJs = (state) => {
	let generated_dir = state.directory + '/' + variables.COMPILE_DIR;
	let js_dir = state.directory + '/' + variables.JS_DIR;
	let js_concat = generated_dir + '/' + variables.COMPILED_JS;

	return checkGeneratedDir(generated_dir).then(() => {
		return fspro.concatDir(js_dir, js_concat);
	}).catch(err => {
		if (err && err.message) err.message = 'v3 compileJs(): ' + err.message;
		throw err;
	});
}

// create sass module include file
const compileSassModules = (state) => {
	let sass_dir = state.directory + '/' + variables.SASS_DIR;
	let sass_modules_file = sass_dir + '/' + variables.COMPILED_SASS_MODULES;

	let sass_modules_content = '/* springboard generated module includes (do not edit manually) */\n';
	for (let mod in state.modules) {
		let mod_data = state.modules[mod].getData();

		// only include modules that are enabled
		if (mod_data.enabled) {
			sass_modules_content +=	'@import "' + mod + '/_' + mod_data.theme + '.scss";\n';
		}
	}

	return fspro.writeFile(sass_modules_file, sass_modules_content);
}

// create sass variables include file
const compileSassVariables = (state) => {
	let sass_dir = state.directory + '/' + variables.SASS_DIR;
	let sass_variables_file = sass_dir + '/' + variables.COMPILED_SASS_VARIABLES;

	let sass_variables_content = '/* springboard generated variables (do not edit manually) */\n';

	for (let style in state.data.styles) {
		let style_data = state.data.styles[style];

		if (style_data.value && style_data.value != '') {
			sass_variables_content +=	'$' + style + ': ' + style_data.value + ';\n';	
		}
	}

	return fspro.writeFile(sass_variables_file, sass_variables_content);
}

// concatenate v3 template files
const compileTemplates = (state) => {
	let generated_dir = state.directory + '/' + variables.COMPILE_DIR;
	let templates_dir = state.directory + '/' + variables.TEMPLATES_DIR;
	let templates_concat = generated_dir + '/' + variables.COMPILED_TEMPLATES;

	return checkGeneratedDir(generated_dir).then(() => {
		return fspro.concatDir(templates_dir, templates_concat)
	});
}

// generate template data with js (similar to angular.js out of SMC)
const compileCatalog = (state) => {
	let generated_dir = state.directory + '/' + variables.COMPILE_DIR;
	let output = generated_dir + '/' + state.name + '.js';
	let js_concat = generated_dir + '/' + variables.COMPILED_JS;
	let templates_concat = generated_dir + '/' + variables.COMPILED_TEMPLATES;

	let compilation = variables.DEFAULT_GENERATED_HEAD;

	return checkGeneratedDir(generated_dir).then(() => {
		return fspro.exists(templates_concat);
	}).then(stats => {
		if (!stats) {
			return Promise.resolve('');
		} else {
			return fspro.readFile(templates_concat);
		}
	}).then(templates => {
		compilation += templates.replace(/\n|\r/g, '').replace(/'/g, "\\\'");
		compilation += variables.DEFAULT_GENERATED_MID;

		return fspro.exists(js_concat);
	}).then(stats => {
		if (!stats) {
			return Promise.resolve('');
		} else {
			return fspro.readFile(js_concat);
		}
	}).then(js => {
		compilation += js;
		compilation += variables.DEFAULT_GENERATED_FOOT;
		return fspro.writeFile(output, compilation);
	}).catch(err => {
		if (err && err.message) err.message = 'v3 compileJs(): ' + err.message;
		throw err;
	});
}

const install = (state) => ({
	install: (details) => {
		if (details) {
			let install_dir = details.directory + '/' + details.name;
			let json_source_file = state.directory + '/.' + state.name + '.json';
			let json_file = install_dir + '/.' + details.name + '.json';

			return fspro.exists(details.directory).then(exists => {
				if (!exists) {
					// if details.directory does not exist
					throw new Error('Install directory (' + details.directory + ') is invalid!');
				}

				// ensure that the install location is a directory
				if (!exists.isDirectory()) {
					throw new Error('Install directory (' + details.directory + ') is not a directory!');
				}

				// ensure that the module directory does not yet exist
				return fspro.exists(install_dir);
			}).then(exists => {
				if (exists) {
					// if details.directory does not exist
					throw new Error('Catalog named "' + details.name + '" already installed!');
				}

				// install catalog
				return fspro.mkDir(install_dir);
			}).then(() => {
				// get default catalog object

				return fspro.getJSON(json_source_file);
			}).then(data => {
				// write new object using defaults and timestamp
				data.created = new Date().getTime();
				data.settings.siteid.value = details.siteid;
				return fspro.putJSON(json_file, data);
			}).then(() => {
				// create default directories (scss/js/template)
				let dir_promises = [];
				dir_promises.push(fspro.mkDir(install_dir + '/' + variables.COMPILE_DIR));
				dir_promises.push(fspro.mkDir(install_dir + '/' + variables.JS_DIR));
				dir_promises.push(fspro.mkDir(install_dir + '/' + variables.SASS_DIR));
				dir_promises.push(fspro.mkDir(install_dir + '/' + variables.TEMPLATES_DIR));

				return Promise.all(dir_promises);
			}).then(() => {
				// create default files
				let file_promises = [];
				// readme
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.COMPILE_DIR + '/readme.md', '*generated by sprinboard*\n**DO NOT EDIT MANUALLY**'));
				// scss
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.SASS_DIR + '/' + details.name + '.scss', variables.DEFAULT_SASS));
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.SASS_DIR + '/._variables.scss', ''));
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.SASS_DIR + '/._modules.scss', ''));
				// js
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.JS_DIR + '/custom.js', ''));
				// templates
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.TEMPLATES_DIR + '/facets.html', variables.DEFAULT_TEMPLATE));
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.TEMPLATES_DIR + '/results.html', variables.DEFAULT_TEMPLATE));
				file_promises.push(fspro.writeFile(install_dir + '/' + variables.TEMPLATES_DIR + '/main.html', variables.DEFAULT_TEMPLATE));

				return Promise.all(file_promises);
			}).catch(err => {
				if (err && err.message) err.message = 'v3 install(): ' + err.message;
				throw err;
			});
		} else {
			return Promise.reject(new Error('v3 install(): No details provided.'));
		}
	}
});

const reloadModules = (state) => ({
	reloadModules: () => {
		// empty module objects (to start fresh)
		for (let mod in state.modules) delete state.modules[mod];
		// load modules
		return loadModules(state).loadModules();
	}
});

const loadModules = (state) => ({
	loadModules: () => {
		let modules_dir = state.directory + '/' + variables.MODULE_DIR;

		return fspro.exists(modules_dir).then(exists => {
			if (!exists) {
				return fspro.mkDir(modules_dir);
			} else {
				return Promise.resolve();
			}
		}).then(() => {
			return fspro.readDir(modules_dir);
		}).then(folders => {
			folders = folders.map(folder => {
				return path.join(modules_dir, folder);
			});
			return fspro.lstat(folders);
		}).then(folder_stats => {
			let modules_promises = [];

			for (let stats of folder_stats) {
				let module_dir = stats.path;
				let name = path.basename(module_dir);

				// ignore non directories... or hidden folders (^.*)
				if (!stats.isDirectory() || name.match(/^\./)) continue;	// drop out of loop

				modules_promises.push(loadModule(name, module_dir, state));
			}

			return Promise.all(modules_promises);
		}).then(() => {
			return;
		}).catch(err => {
			if (err && err.message) err.message = 'v3 loadModules(): ' + err.message;
			throw err;
		});
	}
});

const loadModule = (name, module_dir, state) => {
	return mod(name, module_dir, state.directory).then(mod => {
		if (mod) {
			state.modules[name] = mod;
		}
	}).catch(err => {
		if (err && err.message) err.message = 'v3 loadModule(): ' + err.message;
		throw err;
	});
}

const update = (state) => ({
	update: (details) => {
		if (details) {
			// remove added attributes
			delete details.modules;
			delete details.name;

			if (fspro.compareKeys(state.data, details)) {
				state.data = details;

				return save(state).then(() => {
					return state;
				}).catch(err => {
					if (err && err.message) err.message = 'v3 update(): ' + err.message;
					throw err;
				});
			} else {
				return Promise.reject(new Error('v3 update(): Object key mismatch!'));
			}
		} else {
			return Promise.reject(new Error('v3 update(): No details provided.'));
		}
	}
});

const save = (state) => {
	let json_file = state.directory + '/.' + state.name + '.json';
	return fspro.putJSON(json_file, state.data);
}

module.exports = {
	compile: compile,
	init: init,
	install: install,
	loadModules: loadModules,
	reloadModules: reloadModules,
	update: update,
	variables: variables
}
