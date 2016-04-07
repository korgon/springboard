// ajax v3 catalog methods
'use strict';

const fs = require('fs');
const path = require('path');
const sass = require('node-sass');
const ccss = require('clean-css');

const fspro = require('_/fspro');

const common = require('../common.js');
const mod = require('./mod.js');

// eslint
// http://eslint.org/docs/rules/
const ESLINT_CONFIG = __dirname + '/.eshintrc';
const CLIEngine = require('eslint').CLIEngine;
const eslint = new CLIEngine({ configFile: ESLINT_CONFIG });

const variables = require('./v3.js').variables;

// initialization
const init = (state) => {
	// load modules
	return loadModules(state).loadModules();
}

// extensions
const getData = (state) => ({
	getData: () => {
		return state.data;
	}
});

const compile = (state) => ({
	compile: {
		all: () => {
			console.log('compiling ' + state.name);
			let compile_promises = [];

			compile_promises.push(compileJs(state));
			compile_promises.push(compileSass(state));
			compile_promises.push(compileTemplates(state));

			return Promise.all(compile_promises).then(() => {
				console.log('compiled ' + state.name);
			}).catch(err => {
				if (err && err.message) err.message = 'v3 compile(): ' + err.message;
				throw err;
			});
		},
		js: () => compileJs(state),
		sass: () => compileSass(state),
		templates: () => compileTemplates(state)
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
		return fspro.concatFiles(js_dir, js_concat);
	}).then(() => {
		// lint final file if settings allow
		if (state.data.settings.eslint.value) {
			lintJs(state);
		}
	}).catch(err => {
		if (err && err.message) err.message = 'v3 compileJs(): ' + err.message;
		throw err;
	});
}

// concatenate and minify sass
const compileSass = (state) => {
	let generated_dir = state.directory + '/' + variables.COMPILE_DIR;
	let sass_concat = generated_dir + '/' + variables.COMPILED_SASS;
	let sass_file = state.directory + '/' + variables.SASS_DIR + '/' + state.name + '.scss';

	let basename = path.basename(sass_concat, '.css');

	let dest_css = generated_dir + '/' + basename + '.css';
	let dest_min = generated_dir + '/' + basename + '.min.css';
	let dest_map = generated_dir + '/' + basename + '.css.map';

	return checkGeneratedDir(generated_dir).then(() => {
		return fspro.exists(sass_file);
	}).then(existence => {
		if (existence) {

			let sass_options = {
				file: sass_file,
				outputStyle: 'expanded',
				outFile: dest_css,
				sourceMap: true
			};

			sass.render(sass_options, function(err, result) {
				if (err) {
					throw new Error('failed to render sass!');
				} else {
					let ccss_options = {
						// see https://www.npmjs.com/package/clean-css
					};

					let minified = new ccss(ccss_options).minify(result.css).styles;

					let sass_promises = [];

					sass_promises.push(fspro.writeFile(dest_min, minified));
					sass_promises.push(fspro.writeFile(dest_css, result.css));
					sass_promises.push(fspro.writeFile(dest_map, result.map));

					return Promise.all(sass_promises);
				}
			});
		} else {
			throw new Error('nothing to compile!');
		}
	}).then(() => {
		return;
	}).catch(err => {
		if (err && err.message) err.message = 'v3 compileSass(): ' + err.message;
		throw err;
	});
}

// concatenate v3 template files
const compileTemplates = (state) => {
	let generated_dir = state.directory + '/' + variables.COMPILE_DIR;
	let templates_dir = state.directory + '/' + variables.TEMPLATES_DIR;
	let templates_concat = generated_dir + '/' + variables.COMPILED_TEMPLATES;

	return checkGeneratedDir(generated_dir).then(fspro.concatFiles(templates_dir, templates_concat));
}

// lint JS using eslint
const lintJs = (state) => {
	let generated_dir = state.directory + '/' + variables.COMPILE_DIR;
	let js_file = generated_dir + '/' + variables.COMPILED_JS;
	let report = eslint.executeOnFiles([ js_file ]);

	let formatter = eslint.getFormatter();

	// output report only when something to show
	if (report.errorCount != 0 || report.warningCount != 0) {
		console.log(formatter(report.results));
	}
}

const install = (state) => ({
	install: (details) => {
		if (details) {
			let install_dir = details.directory + '/' + details.name;

			return fspro.exists(details.directory).then(exists => {
				if (!exists) {
					// if details.directory does not exist
					throw new Error('v3 install(): Install directory (' + details.directory + ') is invalid!');
				}

				// ensure that the install location is a directory
				if (!exists.isDirectory()) {
					throw new Error('v3 install(): Install directory (' + details.directory + ') is not a directory!');
				}

				// ensure that the module directory does not yet exist
				return fspro.exists(install_dir);
			}).then(exists => {
				if (exists) {
					// if details.directory does not exist
					throw new Error('v3 install(): v3 catalog already installed at location (' + details.directory + ')!');
				}

				// install catalog
				console.log('installing v3 catalog to ' + details.directory);
				return fspro.mkDir(install_dir);
			}).then(() => {
				// get default catalog object
				return common.getObject(state.name, state.directory);
			}).then(data => {
				// write new object using defaults and timestamp
				data.created = new Date().getTime();
				return common.putObject(details.name, install_dir, data);
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
			console.log('loading ' + state.name + ' modules from: ' + modules_dir);

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

				console.log('found a module: ', module_dir);
				modules_promises.push(loadModule(name, module_dir, state));
			}

			return Promise.all(modules_promises);
		}).then(() => {
			console.log('loaded ' + state.name + ' modules');
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
		console.log(err);
		if (err && err.message) err.message = 'v3 loadModule(): ' + err.message;
		throw err;
	});
}

const update = (state) => ({
	update: (details) => {
		if (details) {
			if (common.compareKeys(state.data, details)) {
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
	return common.putObject(state.name, state.directory, state.data);
}

module.exports = {
	compile: compile,
	getData: getData,
	init: init,
	install: install,
	loadModules: loadModules,
	reloadModules: reloadModules,
	update: update,
	variables: variables
}
