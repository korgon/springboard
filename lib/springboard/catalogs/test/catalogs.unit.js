'use strict';

var test = require('tape');
var fs = require('fs');
var helper = require('./helper.js');

var conf = require('_/config')(__dirname + '/../../../../..');
var lib = require('../index.js');

var testing_dir = __dirname + '/testing';

// library location
var repo_dir = conf.modules_repo_dir;
// library holders
var library;
var testlib;

// Create test directory and load testlib there
test('Setting up test directory', t => {
	helper.setupTest(testing_dir);

	var loader = lib.load(testing_dir);

	t.assert(loader instanceof Promise, 'should return a promise');

	loader.then((loaded) => {
		testlib = loaded;
		t.equal(testing_dir, testlib.directory, 'should return an object with directory property');

		t.deepEqual({}, testlib.catalogs, 'should have empty catalogs');

		t.end();
	}).catch(error => {
    console.log(error);
  });;
});


// Load the master library from repo
test('Catalogs @ load()', t => {
	var loader = lib.load(repo_dir);

	t.assert(loader instanceof Promise, 'should return a promise');

	loader.then((loaded) => {
		library = loaded;

		t.equal(repo_dir, library.directory, 'should return an object with directory property');

		t.end();
	}).catch(error => {
		console.log(library);
    console.log(error);
  });;
});


// install v3 catalog to testlib
test('Catalogs v3 @ install()', t => {
	var install_details = {
		name: 'vthree',
		directory: testing_dir
	};

	var installer = library.catalogs.v3.install(install_details);

	t.assert(installer instanceof Promise, 'should return a promise');

	installer.then(() => {
		t.assert(fs.existsSync(testing_dir + '/' + install_details.name), 'installed to directory');

		t.end();
	}).catch(error => {
    console.log(error);
  });
});


// reload testlib catalogs
test('Catalogs @ reloadCatalogs()', t => {
	var install_details = {
		name: 'vthree',
		directory: testing_dir
	};

	var reload = testlib.reloadCatalogs();

	t.assert(reload instanceof Promise, 'should return a promise');

	reload.then(() => {
		t.assert(testlib.catalogs[install_details.name], install_details.name + ' is installed');

		t.end();
	}).catch(error => {
    console.log(error);
  });
});


// install v3 module slideout to testlib
test('Catalogs v3 module @ install()', t => {
	var install_details = {
		name: 'slider',
		directory: testlib.catalogs['vthree'].directory,
		theme: 'default'
	};

	var installer = library.catalogs.v3.modules.slideout.install(install_details);

	t.assert(installer instanceof Promise, 'should return a promise');

	installer.then(() => {
		// module installed
		t.assert(fs.existsSync(testing_dir + '/vthree/modules/' + install_details.name), 'installed to directory');

		// theme installed
		t.assert(fs.existsSync(testing_dir + '/vthree/modules/' + install_details.name + '/' + install_details.theme), 'installed to directory');

		t.end();
	}).catch(error => {
    console.log(error);
  });
});


// Teardown testing directory
test('Tearing down test directory', t => {
	setTimeout(() => {
		helper.teardownTest(testing_dir);

		t.assert(!fs.existsSync(testing_dir), 'directory removed');

		t.end();
	}, 10000);
});
