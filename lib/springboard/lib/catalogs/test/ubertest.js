'use strict';

var fs = require('fs');

var lib = require('../index');

// // eslint
// // http://eslint.org/docs/rules/
// const ESLINT_CONFIG = __dirname + '/.eshintrc';
// const CLIEngine = require('eslint').CLIEngine;
// const eslint = new CLIEngine({ configFile: ESLINT_CONFIG });


var dir = __dirname + '/testing';

console.log('------------------------');
console.log('------------------------');
console.log('------------------------');


var testsites = [];
for (let i=0; i<5; i++) {
	testsites.push('test' + i);
}

var sites = [];

var library;

// first create all test directories...
fs.mkdirSync(dir);
for (let site in testsites) {
	fs.mkdirSync(dir + '/' + testsites[site]);
}


lib.load('/home/korgon/Work/springboard/springboard-library').then(l => {
	// install v3 to testsite
	library = l;
	return Promise.resolve();
}).catch(err => {
	console.log(err);
}).then(() => {
	var install_promise = testsites.reduce((promise, site) => {
		return promise.then(() => {
			let install_details = {
				name: 'vthree',
				directory: dir + '/' + site
			}

			return library.catalogs.v3.install(install_details);
		});
	}, Promise.resolve());

	return install_promise;
}).then(() => {
	var load_promise = testsites.reduce((promise, site) => {
		return promise.then(() => {
			let directory = dir + '/' + site;

			return lib.load(directory).then(load => {
				sites.push(load);
			});
		});
	}, Promise.resolve());

	return load_promise;
}).then(() => {
	var install_promise = sites.reduce((promise, site) => {
		return promise.then(() => {
			let install_details = {
				name: 'slide',
				directory: site.catalogs.vthree.directory,
				theme: 'default'
			}

			return library.catalogs.v3.modules.slideout.install(install_details);
		});
	}, Promise.resolve());

	return install_promise;
}).then(() => {
	var reload_promise = sites.reduce((promise, site) => {
		return promise.then(() => {
			return site.reloadCatalogs();
		});
	}, Promise.resolve());

	return reload_promise;
}).then(() => {
	var compile_promise = sites.reduce((promise, site) => {
		return promise.then(() => {
			return site.catalogs.vthree.compile.all();
		});
	}, Promise.resolve());

	return compile_promise;
}).then(() => {
	var install_promise = sites.reduce((promise, site) => {
		return promise.then(() => {
			let install_details = {
				directory: site.catalogs.vthree.modules.slide.directory,
			}

			return library.catalogs.v3.modules.slideout.themes.blocky.install(install_details);
		});
	}, Promise.resolve());

	return install_promise;
}).then(() => {
	var reload_promise = sites.reduce((promise, site) => {
		return promise.then(() => {
			return site.reloadCatalogs();
		});
	}, Promise.resolve());

	return reload_promise;
}).then(() => {
	var theme_promise = sites.reduce((promise, site) => {
		return promise.then(() => {
			return site.catalogs.vthree.modules.slide.setTheme('blocky');
		});
	}, Promise.resolve());

	return theme_promise;
}).then(() => {
	var compile_promise = sites.reduce((promise, site) => {
		return promise.then(() => {
			return site.catalogs.vthree.compile.all();
		});
	}, Promise.resolve());

	return compile_promise;
}).catch(err => {
	console.log('errr!!!');
	console.log(err);
	console.log(library);
	console.log('------------------------');
	console.log(testsite);
});


// to give time to checkout memory usage
setTimeout(function() {
	console.log('done');
}, 100000)


// Next TODO
// figure out how to lower memory footprint?
// incorporate into springboard
// clean up springboard
// create watchers
