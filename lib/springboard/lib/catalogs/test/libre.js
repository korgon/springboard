'use strict';

var dir = __dirname + '/testing';

var lib = require('../index');


// compilers
const sass = require('node-sass');
const css = require('clean-css');
// eslint
// http://eslint.org/docs/rules/
const ESLINT_CONFIG = __dirname + '/.eshintrc';
const CLIEngine = require('eslint').CLIEngine;
const eslint = new CLIEngine({ configFile: ESLINT_CONFIG });

const compilers = {
	css,
	sass,
	js: eslint
}

console.log('------------------------');
console.log('------------------------');
console.log('------------------------');


var testsite;
var library;

lib.load('/home/korgon/Work/springboard/springboard-library').then(l => {
	// install v3 to testsite
	library = l;
	return library.catalogs.v3.install({
		name: 'vthree',
		directory: dir
	});
}).catch(err => {
	console.log(err);
}).then(() => {
	return lib.load(dir);
}).then(l => {
	// load testsite
	testsite = l;
}).then(() => {
	// install slideout module onto testsite
	console.log('installing slideout module');
	return library.catalogs.v3.modules.slideout.install({ name: 'slide', directory: testsite.catalogs.vthree.directory, theme: 'default' });
}).catch(err => {
	console.log(err);
}).then(() => {
	return testsite.catalogs.vthree.reloadModules();
}).catch(err => {
	console.log(err);
}).then(() => {
	// install slideout blocky theme
	console.log('installing slideout theme');
	return library.catalogs.v3.modules.slideout.themes.blocky.install({ directory: testsite.catalogs.vthree.modules.slide.directory });
}).catch(err => {
	console.log(err);
}).then(() => {
	return testsite.catalogs.vthree.compile(compilers).all();
}).then(() => {
	console.log('DONEZO');
	console.log(library);
	return testsite.catalogs.vthree.compile(compilers).all();
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
