// watchers
// watch the files for changes

/*

Using cascading events...
watch for json changes -> Do things...

watch for sass changes -> build css file
watch for css changes -> reload inject browser
watch for js changes -> trigger re-compile / reload browser
watch for html changes -> reload browser

TODO:
Watch for template changes and use catalog.compile
Watch for catalog js changes and use catalog.compile
Watch for json changes and do various things...
Watch for image changes and inject changes
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

/*******************/
// Watch functions //
/*******************/

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
		all_seeing_eye: null,			// used for tracking json
		eye_of_horus: null,				// used for tracking html
		eye_of_providence: null,	// used for tracking css
		eye_of_sauron: null,			// used for tracking sass
		eye_of_saturn: null				// used for tracking compiled js
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

		console.log(catalog_vars);
		self.stop();
		startWatch();
	}

	self.stop = function() {
		// blinding the eyes
		for (let eye in eyes) {
			if (eyes[eye]) {
				eyes[eye].close();
			}
			eyes[eye] = null;
		}
	}

	function startWatch() {
		eyes.eye_of_horus = watchHtml();
		eyes.eye_of_providence = watchCss();
		eyes.eye_of_sauron = watchSass();
		eyes.eye_of_saturn = watchJs();
	}

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

	function watchJs() {
		// which files to watch...
		let watch_list = [
			site.directory + '/js/*.js'
		];

		for (let catalog in catalog_vars) {
			watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/*.js')
		}

		let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

		watcher.on('all', function(event, file) {
			if (lintJs(file)) {
				// reload browser if no linting errors
				bs.reload(path.basename(file));
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
			watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/*.css')
		}

		let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

		watcher.on('all', function(event, file) {
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

		for (let catalog in catalog_vars) {
			watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].SASS_DIR + '/**/*.scss');
			watch_list.push(site.directory + '/' + catalog + '/' + catalog_vars[catalog].SASS_DIR + '/**/*.sass')
		}

		let watcher = chokidar.watch(watch_list, { ignoreInitial: true });

		watcher.on('all', function(event, file) {
			let ext = path.extname(file);
			let output = site.directory + '/css/' + path.basename(file, ext) + '.css';

			let catalog = sourceCatalog(file);
			if (catalog) {
				output = site.directory + '/' + catalog + '/' + catalog_vars[catalog].COMPILE_DIR + '/' + catalog_vars[catalog].COMPILED_SASS;
			}

			sassBuilder(file, output).then(() => {
				// ?
			});
		});

		return watcher;
	}

	function sourceCatalog(file_path) {
		let dir = path.dirname(file_path).replace(site.directory + '/', '');
		let catalog = dir.split(path.sep)[0];
		if (catalog_vars[catalog]) {
			return catalog;
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

		return new Promise(function(resolve, reject) {
			// check if file is an include file
			if (sass_name.match(/^\_.*/)) {
				// TODO find parent source
				// or just compile all sass in containing folder just to be sure
				return reject('need to compile the parent files... but not doing it now!');
			}

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
