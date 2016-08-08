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
const BLINK_TIME = 333;

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

	// watcher object for watching things... then unwatching them...
	let eyes = {};

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

		return startWatch();
	}

	self.stop = function() {
		// blinding the eyes
		stopWatch();
		if (options.debug) console.log('blind leading the blind')
	}

	function startWatch() {
		// array of promises
		let watcher_lies = [];

		watcher_lies.push(watchJson());
		watcher_lies.push(watchHtml());
		watcher_lies.push(watchCss());
		watcher_lies.push(watchSass());
		watcher_lies.push(watchJs());
		watcher_lies.push(watchCatalogJs());
		watcher_lies.push(watchTemplates());

		return Promise.all(watcher_lies).then(watchers => {
			// store watchers for ability to blind
			eyes.all_seeing_eye = watchers[0];
			eyes.eye_of_horus = watchers[1];
			eyes.eye_of_providence = watchers[2];
			eyes.eye_of_sauron = watchers[3];
			eyes.eye_of_saturn = watchers[4];
			eyes.eye_of_jupiter = watchers[5];
			eyes.eye_of_the_blind = watchers[6];

			if (options.debug) console.log('watchers be watchin');
		}).catch(err => {
			if (err && err.message) err.message = 'watchers startWatch(): ' + err.message;
			throw err;
		});
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
		return new Promise(function(resolve, reject) {
			// which files to watch...
			let watch_list = [
				site.directory + '/*.html',
				site.directory + '/*.htm'
			];

			let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

			watcher.on('change', path => {
				bs.reload();
			});

			watcher.on('ready', () => {
				if (options.debug) console.log('watching html...');
				resolve(watcher);
			});
		});
	}

	// v3 at least...
	function watchJson() {
		return new Promise(function(resolve, reject) {
			// which files to watch...
			let site_json = site.directory + '/.' + site.name + '.json';
			let watch_list = [
				site_json
			];

			for (let catalog in catalog_vars) {
				watch_list.push(site.directory + '/' + catalog + '/.' + catalog + '.json');
				watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].MODULE_DIR + '/**/*.json');
			}

			let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

			watcher.on('all', function(event, file) {
				if (options.debug) console.log('saw json change: ' + file);
				let source = sourceFile(file);
				if (options.debug) console.log(source);

				if (source.catalog) {
					if (!source.module) {
						// change was to the catalog json
						if (options.debug) console.log('catalog ' + source.catalog + ' changed!');
						return site.catalogs[source.catalog].compile.jsVariables().then(() => {
							if (options.debug) console.log('compiled js variables for ' + source.catalog);
							return site.catalogs[source.catalog].compile.sassVariables();
						}).then(() => {
							if (options.debug) console.log('compiled sass variables for ' + source.catalog);
						}).catch(err => {
							console.log(err);
						});
					} else {
						if (!source.theme) {
							// change was to the module
							if (options.debug) console.log('catalog ' + source.catalog + ' module ' + source.module + ' changed!');
							return site.catalogs[source.catalog].compile.sassModules().then(() => {
								if (options.debug) console.log('compiled sass modules for ' + source.module);
							}).catch(err => {
								console.log(err);
							});
						} else {
							// change was to the module theme
							if (options.debug) console.log('catalog ' + source.catalog + ' module ' + source.module + ' theme ' + source.theme + ' changed!');
							return site.catalogs[source.catalog].modules[source.module].themes[source.theme].compileVariables().then(() => {
								if (options.debug) console.log('compiled sass and js variables for ' + source.catalog + '/' + source.module + '/' + source.theme);
							}).catch(err => {
								console.log(err);
							});
						}
					}
				} else if (file == site_json) {
					// site json modified
					if (options.debug) console.log('site json changed!');
				} else {
					// some other file changed?
					if (options.debug) console.log('something else changed! ' + file);
					//bs.reload()
				}
			});

			if (watch_list.length == 0) {
				if (options.debug) console.log('watching json...');
				resolve(watcher);
			}

			watcher.on('ready', () => {
				if (options.debug) console.log('watching json...');
				resolve(watcher);
			});
		});
	}

	// v3 at least...
	function watchTemplates() {
		return new Promise(function(resolve, reject) {
			// which files to watch...
			let watch_list = [];

			for (let catalog in catalog_vars) {
				watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].TEMPLATES_DIR);
			}

			let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

			watcher.on('all', function(event, file) {
				if (options.debug) console.log('saw template change:', file);
				let catalog = sourceFile(file).catalog;

				if (site.catalogs[catalog]) {

					if (this.compileInterval) clearTimeout(this.compileInterval);

					this.compileInterval = setTimeout(function() {
						return site.catalogs[catalog].compile.templates().then(() => {
							//let template_file = './' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/' + catalog_vars[catalog].COMPILED_TEMPLATES;
							//logit.log('templates', 'concatenated ' + template_file.bold, 'pass');
							return site.catalogs[catalog].compile.catalog();
						}).then(() => {
							if (options.debug) console.log('reloading browser');
							// reload
							bs.reload();
						}).catch(err => {
							console.log(err);
						});
					}, BLINK_TIME);
				}
			});

			if (watch_list.length == 0) {
				if (options.debug) console.log('watching templates...');
				resolve(watcher);
			}

			watcher.on('ready', () => {
				if (options.debug) console.log('watching templates...');
				resolve(watcher);
			});
		});
	}

	// v3 at least...
	function watchCatalogJs() {
		return new Promise(function(resolve, reject) {
			// which files to watch...
			let watch_list = [];

			for (let catalog in catalog_vars) {
				watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].JS_DIR);
			}

			let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

			watcher.on('all', function(event, file) {
				// only act on js files
				if (file.match(/\.js$/)) {
					if (options.debug) console.log('saw catalogjs change', file);

					let catalog = sourceFile(file).catalog;
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

			if (watch_list.length == 0) {
				if (options.debug) console.log('watching catalogjs...');
				resolve(watcher);
			}

			watcher.on('ready', () => {
				if (options.debug) console.log('watching catalogjs...');
				resolve(watcher);
			});
		});
	}

	function watchJs() {
		return new Promise(function(resolve, reject) {
			// which files to watch...
			let watch_list = [
				site.directory + '/js/**/*.js'
			];

			for (let catalog in catalog_vars) {
				watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/scripts.js');
			}

			let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

			watcher.on('all', function(event, file) {
				if (options.debug) console.log('saw js change', file);
				let catalog = sourceFile(file).catalog;

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

			if (watch_list.length == 0) {
				if (options.debug) console.log('watching js...');
				resolve(watcher);
			}

			watcher.on('ready', () => {
				if (options.debug) console.log('watching js...');
				resolve(watcher);
			});
		});
	}

	function watchCss() {
		return new Promise(function(resolve, reject) {
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
				if (options.debug) console.log('saw css change');
				bs.reload(path.basename(file));
			});

			if (watch_list.length == 0) {
				if (options.debug) console.log('watching css...');
				resolve(watcher);
			}

			watcher.on('ready', () => {
				if (options.debug) console.log('watching css...');
				resolve(watcher);
			});
		});
	}

	function watchSass() {
		return new Promise(function(resolve, reject) {
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
					if (options.debug) console.log('saw sass change: ', file);
					if (options.debug) console.log('event', event);
					let ext = path.extname(file);
					let output = site.directory + '/css/' + path.basename(file, ext) + '.css';

					let catalog = sourceFile(file).catalog;
					if (catalog) {
						output = site.directory + '/' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/' + catalog_vars[catalog].COMPILED_SASS;
					}

					// using setTimeout and clearTimeout to prevent multiple compiles when several files are changed within the 'blink time'
					// prevent final event captured from being an unlink (will cause sass to fail to compile)
					if (this.compileInterval && event != 'unlink') {
						clearTimeout(this.compileInterval);
					}

					if (event != 'unlink') {
						this.lastWatchEvent = event;
						this.compileInterval = setTimeout(function() {
							sassBuilder(file, output);
						}, BLINK_TIME);
					}
				}
			});

			if (watch_list.length == 0) {
				if (options.debug) console.log('watching sass...');
				resolve(watcher);
			}

			watcher.on('ready', () => {
				if (options.debug) console.log('watching sass...');
				resolve(watcher);
			});
		});
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

				let build_promises = []

				for (let file of files) {
					if (path.basename(css_file).match(/^\.*\_.*/)) {
						css_file = path.dirname(css_file) + '/' + path.basename(file).replace(/.scss$|.sass$/, '.css');
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

		return fspro.readDir(search_dir).then((contents) => {
			let relevant_files = contents.filter(file => file.match(/.*\.scss$|.*\.sass/) && file != sass_name);

			// check files for import
			let check_promises = [];

			for (let file of relevant_files) {
				check_promises.push(checkForImport(search_dir + '/' + file, sass_name));
			}

			return Promise.all(check_promises);
		}).then(matched_files => {
			// remove unmatched (false) entries
			matched_files = matched_files.filter(file => file != false);
			files = files.concat(matched_files);

			let containing_dir = path.basename(search_dir);
			if (containing_dir != 'scss') {
				// now looking for a path
				let sass_path = containing_dir + '/' + sass_name;
				return findSassImporter(sass_path, path.dirname(search_dir), files);
			} else {
				// done looking up dir tree
				return files;
			}
		});
	}

	// inspect sass file contents to see if it is importing filename
	function checkForImport(file, importing) {
		return fspro.readFile(file).then(contents => {
			if (contents.indexOf(importing) != -1) {
				return file;
			} else {
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
