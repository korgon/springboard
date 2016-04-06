'use strict';

var dir = __dirname + '/testing';

var lib = require('./index');
// console.log(library.jsonify());
//
// console.log(library);
//
// library.catalogs.v3.install({ name: 'v3', directory: dir });
// library.catalogs.v3.modules.slideout.install({ name: 'slidie', directory: dir + '/v3', theme: 'blocky' });
// library.catalogs.v3.modules.slideout.themes.blocky.install({ directory: dir + '/v3/modules/slideout' });

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
	return library.catalogs.v3.modules.slideout.install({ name: 'slide', directory: testsite.catalogs.vthree.directory, theme: 'default' });
}).catch(err => {
	console.log(err);
}).then(() => {
	// install slideout blocky theme
	return library.catalogs.v3.modules.slideout.themes.blocky.install({ directory: testsite.catalogs.vthree.modules.slide.directory });
}).catch(err => {
	console.log(err);
}).then(() => {
	return testsite.catalogs.vthree.compile();
}).then(() => {
	console.log('DONEZO');
}).catch(err => {
	console.log('errr!!!');
	console.log(library);
	console.log('------------------------');
	console.log(testsite);
});

/*
lib.load('/home/korgon/Work/springboard/springboard-library').then(l => {
	library = l;
	return library.catalogs.v3.install({
		name: 'v3',
		directory: dir
	});
}).then(() => {
	return lib.load(dir);
}).then(l => {
	testsite = l;
}).then(() => {
	console.log('installing slideout...');
	return library.catalogs.v3.modules.slideout.install({
		name: 'slideout',
		directory: testsite.catalogs.v3.directory,
		theme: 'default'
	});
}).then(() => {
	console.log('installed slideout!!!');
	return testsite.reloadCatalogs();
}).then(() => {
	console.log(JSON.stringify(testsite.getData()));
	console.log('installing slideout blocky theme...');
	return library.catalogs.v3.modules.slideout.themes.blocky.install({
		directory: testsite.catalogs.v3.modules.slideout.directory
	});
}).then(() => {
	console.log('installed slideout blocky theme!!!');
}).catch(err => {
	console.log(err);
	console.log('errr!!!');
	console.log(library);
	console.log('------------------------');
	console.log(testsite);
});
*/

// Next TODO
// write compile function for sass
