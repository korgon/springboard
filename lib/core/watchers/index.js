// watchers
// watch the files for changes

/*

Using cascading events...
watch for json changes -> Do things...

watch for sass changes -> build css file
watch for css changes -> reload inject browser
watch for catalog js changes -> trigger re-compile
watch for js changes -> lint js -> reload browser
watch for html changes -> reload browser

TODO:
Watch for json changes and do various things...	(all seeing)
*/

'use strict';

const path = require('path');

const chokidar = require('chokidar');
const sass = require('node-sass');
const ccss = require('clean-css');
const colors = require('colors');

// eslint
// http://eslint.org/docs/rules/
const ESLINT_CONFIG = __dirname + '/.eshintrc';
const CLIEngine = require('eslint').CLIEngine;
const eslint = new CLIEngine({ configFile: ESLINT_CONFIG });
const formatter = eslint.getFormatter();

const fspro = require('_/fspro');

const logit = require('_/logit');

// time to wait for all changes before compiling certain files
const BLINK_TIME = 100;

module.exports = new watchers();

function watchers() {
	let self = this;

	// options passed in to init
	let options;

	// current site under watch
	let site;
	let catalog_vars = {};

	// browsersync
	let bs;

	// watchers for watching things...
	let eyes = {
		all_seeing_eye: null,				// used for tracking json
		eye_of_horus: null,					// used for tracking html
		eye_of_providence: null,		// used for tracking css
		eye_of_sauron: null,				// used for tracking sass
		eye_of_saturn: null,				// used for tracking linting compiled js
		eye_of_jupiter: null,				// used for watching catalog js
		eye_of_the_blind: null			// used for watching catalog templates
	};

	self.init = function(config, browsersync) {
		options = config;
		bs = browsersync;
	}

	self.watch = function(thesite) {
		site = thesite;
		catalog_vars = {};

		// populate the catalog variables
		for (let catalog in site.catalogs) {
			catalog_vars[catalog] = site.catalogs[catalog].getVariables();
		}

		self.stop();
		startWatch();
		console.log("WATCHING YOU...");
	}

	self.stop = function() {
		console.log('I CAN SEE I\'M GOING BLIND!!!')
		// blinding the eyes
		stopWatch();
	}

	function startWatch() {
		eyes.all_seeing_eye = watchJson();
		eyes.eye_of_horus = watchHtml();
		eyes.eye_of_providence = watchCss();
		eyes.eye_of_sauron = watchSass();
		eyes.eye_of_saturn = watchJs();
		eyes.eye_of_jupiter = watchCatalogJs();
		eyes.eye_of_the_blind = watchTemplates();
	}

	function stopWatch() {
		for (let eye in eyes) {
			if (eyes[eye]) {
				eyes[eye].close();
			}
			delete eyes[eye];
		}
	}

	/*******************/
	// Watch functions //
	/*******************/

	function watchHtml() {
		// which files to watch...
		let watch_list = [
			site.directory + '/*.html',
			site.directory + '/*.htm'
		];

		let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

		watcher.on('change', function(path) {
			bs.reload();
		});

		return watcher;
	}

	// v3 at least...
	function watchJson() {
		// which files to watch...
		let site_json = site.directory + '/.' + site.name + '.json';
		let watch_list = [
			site_json
		];

		for (let catalog in catalog_vars) {
			watch_list.push(site.directory + '/' + catalog + '/.' + catalog + '.json');
			watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].MODULE_DIR + '/**/*.json');

			// // loop through the modules to watch their configs
			// for (let mod in site.catalogs[catalog].modules) {
			// 	let module_data = site.catalogs[catalog].modules[mod].getData();
			//
			// 	let mod_dir = site.directory + '/' + catalog + '/' + catalog_vars[catalog].MODULE_DIR + '/' + mod;
			// 	let mod_file = mod_dir + '/.' + mod + '.json';
			//
			// 	watch_list.push(mod_file);
			//
			// 	// also watch the current theme config
			// 	if (module_data.theme) {
			// 		console.log('should watch theme: ' + module_data.theme)
			//
			// 		let theme_file = mod_dir + '/' + module_data.theme + '/.' + module_data.theme +'.json';
			// 		watch_list.push(theme_file);
			// 	}
			// }
		}

		let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

		console.log('json watch');
		console.log(watch_list);

		watcher.on('all', function(event, file) {
			console.log('saw json change: ' + file);
			let source = sourceFile(file);
			console.log(source);

			if (source.catalog) {
				if (!source.module) {
					// change was to the catalog json
					console.log('catalog ' + source.catalog + ' changed!');
					return site.catalogs[source.catalog].compile.jsVariables().then(() => {
						console.log('compiled js variables for ' + source.catalog);
						return site.catalogs[source.catalog].compile.sassVariables();
					}).then(() => {
						console.log('compiled sass variables for ' + source.catalog);
					}).catch(err => {
						console.log(err);
					});
				} else {
					if (!source.theme) {
						// change was to the module
						console.log('catalog ' + source.catalog + ' module ' + source.module + ' changed!');
						return site.catalogs[source.catalog].compile.sassModules().then(() => {
							console.log('compiled sass modules for ' + source.module);
						}).catch(err => {
							console.log(err);
						});
					} else {
						// change was to the module theme
						console.log('catalog ' + source.catalog + ' module ' + source.module + ' theme ' + source.theme + ' changed!');
						return site.catalogs[source.catalog].modules[source.module].themes[source.theme].compileVariables().then(() => {
							console.log('compiled sass and js variables for ' + source.catalog + '/' + source.module + '/' + source.theme);
						}).catch(err => {
							console.log(err);
						});
					}
				}
			} else if (file == site_json) {
				// site json modified
				console.log('site json changed!');
			} else {
				// some other file changed?
				console.log('something else changed! ' + file);
				//bs.reload()
			}
		});

		return watcher;
	}

	// v3 at least...
	function watchTemplates() {
		// which files to watch...
		let watch_list = [];

		for (let catalog in catalog_vars) {
			watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].TEMPLATES_DIR);
		}

		let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

		watcher.on('all', function(event, file) {
			console.log('saw template change');
			let catalog = sourceCatalog(file);
			if (site.catalogs[catalog]) {
				return site.catalogs[catalog].compile.templates().then(() => {
					//let template_file = './' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/' + catalog_vars[catalog].COMPILED_TEMPLATES;
					//logit.log('templates', 'concatenated ' + template_file.bold, 'pass');

					return site.catalogs[catalog].compile.catalog();
				}).then(() => {
					// reload
					bs.reload();
				}).catch(err => {
					console.log(err);
				});
			}
		});

		return watcher;
	}

	// v3 at least...
	function watchCatalogJs() {
		// which files to watch...
		let watch_list = [];

		for (let catalog in catalog_vars) {
			watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].JS_DIR);
		}

		let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

		watcher.on('all', function(event, file) {
			// only act on js files
			if (file.match(/\.js$/)) {
				console.log('saw catalogjs change', file);
				console.log('event', event);
				let catalog = sourceCatalog(file);
				if (site.catalogs[catalog]) {

					if (this.compileInterval) clearTimeout(this.compileInterval);

					this.compileInterval = setTimeout(function() {
						return site.catalogs[catalog].compile.js().then(() => {
							return site.catalogs[catalog].compile.catalog();
						}).then(() => {
							let catalog_file = './' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/' + catalog + '.js';
							logit.log('js', 'compiled ' + catalog_file.bold, 'pass');
						}).catch(err => {
							console.log(err);
						});
					}, BLINK_TIME);
				}
			}
		});

		return watcher;
	}

	function watchJs() {
		// which files to watch...
		let watch_list = [
			site.directory + '/js/**/*.js'
		];

		for (let catalog in catalog_vars) {
			watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/scripts.js');
		}

		let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

		watcher.on('all', function(event, file) {
			console.log('saw js change', file);
			let catalog = sourceCatalog(file);

			if (catalog) {
				let catalog_data = site.catalogs[catalog].getData();
				let catalog_file = site.directory + '/' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/' + catalog + '.js';

				if (this.compileInterval) clearTimeout(this.compileInterval);

				this.compileInterval = setTimeout(function() {
					// only lint if catalog settings specify
					// do not lint compiled catalog (to prevent duplicate errors)
					if (catalog_data.settings.eslint.value == true && file != catalog_file) {
						if (lintJs(file)) {
							// no linting errors
						}
					}
					// reload
					bs.reload(path.basename(file));
				}, BLINK_TIME);
			}
		});

		return watcher;
	}

	function watchCss() {
		// which files to watch...
		let watch_list = [
			site.directory + '/css/*.css'
		];

		for (let catalog in catalog_vars) {
			watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/*.css');
		}

		//  { ignored: /.*min.css$/, ignoreInitial: true } <- could ignore minified
		let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

		watcher.on('all', function(event, file) {
			console.log('saw css change');
			bs.reload(path.basename(file));
		});

		return watcher;
	}

	function watchSass() {
		// which files to watch...
		let watch_list = [
			site.directory + '/scss/**/*.scss',
			site.directory + '/scss/**/*.sass'
		];

		// watch catalog and module sass
		for (let catalog in catalog_vars) {
			watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].SASS_DIR);
		}

		let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

		watcher.on('all', function(event, file) {
			// act on scss or sass files only
			if (file.match(/\.sass$|\.scss$/)) {
				console.log('saw sass change: ', file);
				console.log('event', event);
				let ext = path.extname(file);
				let output = site.directory + '/css/' + path.basename(file, ext) + '.css';

				let catalog = sourceCatalog(file);
				if (catalog) {
					output = site.directory + '/' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/' + catalog_vars[catalog].COMPILED_SASS;
				}

				// using setTimeout and clearTimeout to prevent multiple compiles when several files are changed within the 'blink time'
				// prevent final event captured from being an unlink (will cause sass to fail to compile)
				if (this.compileInterval && event == 'unlink' && this.lastWatchEvent != 'unlink') {
					clearTimeout(this.compileInterval);
				} else {
					this.lastWatchEvent = event;
					this.compileInterval = setTimeout(function() {
						sassBuilder(file, output);
					}, BLINK_TIME);
				}
			}
		});

		return watcher;
	}

	function sourceFile(file_path) {
		let source = {};
		let dir = path.dirname(file_path).replace(site.directory + '/', '');
		let catalog = dir.split(path.sep)[0].trim();

		if (site.catalogs[catalog] && catalog_vars[catalog]) {
			source.catalog = catalog;

			let mod_dir = dir.replace(catalog + '/' + catalog_vars[catalog].MODULE_DIR + '/', '');
			let mod = mod_dir.split(path.sep)[0].trim();

			if (site.catalogs[catalog].modules[mod]) {
				source.module = mod;

				let theme = mod_dir.replace(mod + '/', '').trim();

				if (site.catalogs[catalog].modules[mod].themes[theme]) {
					source.theme = theme;
				}
			}
		}

		return source;
	}

	function sourceCatalog(file_path) {
		let dir = path.dirname(file_path).replace(site.directory + '/', '');
		let catalog = dir.split(path.sep)[0].trim();

		if (site.catalogs[catalog]) {
			return catalog;
		} else {
			return false;
		}
	}

	function sourceModule(file_path) {
		let dir = path.dirname(file_path).replace(site.directory + '/', '');
		let catalog = dir.split(path.sep)[0];

		if (catalog_vars[catalog]) {
			let mod_dir = dir.replace(catalog + '/' + catalog_vars[catalog].MODULE_DIR + '/', '');
			let mod = mod_dir.split(path.sep)[0];

			if (site.catalogs[catalog].modules[mod]) {
				return mod;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	function sourceTheme(file_path) {
		let dir = path.dirname(file_path).replace(site.directory + '/', '');
		let catalog = dir.split(path.sep)[0];
		if (catalog_vars[catalog]) {
			let mod_dir = dir.replace(catalog + '/' + catalog_vars[catalog].MODULE_DIR + '/', '');
			let mod = mod_dir.split(path.sep)[0];

			if (site.catalogs[catalog].modules[mod]) {
				let theme = mod_dir.replace(mod + '/', '');

				if (site.catalogs[catalog].modules[mod].themes[theme]) {
					return theme
				}
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	function sassBuilder(sass_file, css_file) {
		let sass_name = path.basename(sass_file);
		let sass_text = './' + sass_file.replace(site.directory + '/', '');
		let dest_folder = path.dirname(css_file);
		let ext = path.extname(css_file);

		let dest_css = css_file;
		let dest_min = dest_folder + '/' + path.basename(css_file, ext) + '.min.css';
		let dest_map = dest_folder + '/' + path.basename(css_file, ext) + '.css.map';

		let sass_options = {
			file: sass_file,
			outputStyle: 'expanded',
			outFile: dest_css,
			sourceMap: true
		};

		let rendered;

		// check if file is an import or partial file (starting with _)
		if (sass_name.match(/^\.*\_.*/)) {
			// TODO find parent source and try to compile it
			return findSassImporter(sass_name, path.dirname(sass_file)).then(files => {
				console.log('after search...');
				console.log(css_file);
				console.log(files);

				let build_promises = []

				for (let file of files) {
					if (path.basename(css_file).match(/^\.*\_.*/)) {
						console.log('not a good css output file...');
						css_file = path.dirname(css_file) + '/' + path.basename(file).replace(/.scss$|.sass$/, '.css');
						console.log('=== using ' + css_file);
					}
					build_promises.push(sassBuilder(file, css_file));
				}

				return Promise.all(build_promises);
			});
		} else {
			return new Promise(function(resolve, reject) {

				sass.render(sass_options, function(err, result) {
					if (err) {
						return reject(err);
					} else {
						return resolve(result);
					}
				});
			}).then(result => {
				rendered = result;
				return fspro.exists(dest_folder);
			}).then(stats => {
				if (stats) {
					return Promise.resolve();
				} else {
					logit.log('sass', 'creating destination directory...');
					return fspro.mkDir(dest_folder);
				}
			}).then(() => {
				let ccss_options = {
					// see https://www.npmjs.com/package/clean-css
				};

				let minified = new ccss(ccss_options).minify(rendered.css).styles;
				let write_promises = [];

				write_promises.push(fspro.writeFile(dest_min, minified));
				write_promises.push(fspro.writeFile(dest_css, rendered.css));
				write_promises.push(fspro.writeFile(dest_map, rendered.map));

				return Promise.all(write_promises);
			}).then(() => {
				logit.log('sass', 'compiled and minified ' + sass_text.bold, 'pass');
			}).catch(err => {
				if (err.formatted) {
					logit.log('sass', 'failed to render ' + sass_text.bold, 'fail');
					console.log(err.formatted);
				} else {
					logit.log('sass', err.message || err, 'fail');
				}
				return;
			});
		}
	}

	// find sass importer recursively until reach top scss directory
	function findSassImporter(sass_name, search_dir, files) {
		if (typeof files == 'undefined') files = [];

		console.log('looking for importer starting in: ' + search_dir);
		console.log('looking for filename: ' + sass_name + ' @import in scss and sass files');
		return fspro.readDir(search_dir).then((contents) => {
			let relevant_files = contents.filter(file => file.match(/.*\.scss$|.*\.sass/) && file != sass_name);

			// check files for import
			let check_promises = [];

			console.log(relevant_files);
			for (let file of relevant_files) {
				console.log('*** Going to check: ' + search_dir + '/' + file);
				check_promises.push(checkForImport(search_dir + '/' + file, sass_name));
			}

			return Promise.all(check_promises);
		}).then(matched_files => {
			// remove unmatched (false) entries
			matched_files = matched_files.filter(file => file != false);
			console.log(matched_files);
			files = files.concat(matched_files);

			console.log(files);
			let containing_dir = path.basename(search_dir);
			if (containing_dir != 'scss') {
				console.log('looking above');
				// now looking for a path
				let sass_path = containing_dir + '/' + sass_name;
				return findSassImporter(sass_path, path.dirname(search_dir), files);
			} else {
				// done looking up dir tree
				console.log('done searching for importer');
				return files;
			}
		});
	}

	// inspect sass file contents to see if it is importing filename
	function checkForImport(file, importing) {
		return fspro.readFile(file).then(contents => {
			if (contents.indexOf(importing) != -1) {
				console.log('found a match!!!');
				return file;
			} else {
				console.log('nope...');
				return false;
			}
		});
	}

	// lint JS using eslint
	function lintJs(js_file) {
		let report = eslint.executeOnFiles([ js_file ]);
		let filename = './' + js_file.replace(site.directory + '/', '');

		// output report only when something to show
		if (report.errorCount != 0 || report.warningCount != 0) {
			if (report.errorCount) {
				// found an error
				logit.log('js', 'found an error in script ' + filename.bold, 'fail');
				console.log(formatter(report.results));
				return false;
			} else if (report.warningCount) {
				// got a warning
				logit.log('js', 'found a potential issue in script ' + filename.bold, 'warn');
				console.log(formatter(report.results));
				return true;
			}
		} else {
			logit.log('js', 'successfully linted ' + filename.bold , 'pass');
			return true;
		}
	}


}
