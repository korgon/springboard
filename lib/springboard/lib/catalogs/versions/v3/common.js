// misc tools used for building v3 catalogs

'use strict';

var fs = require('fs');
var path = require('path');

// Constants
const MODULE_DIR = "modules";
const COMPILE_DIR = "generated";
const JS_DIR = "js";
const TEMPLATES_DIR = "templates";
const SASS_DIR = "scss";

const variables = {
	MODULE_DIR,
	COMPILE_DIR,
	JS_DIR,
	TEMPLATES_DIR,
	SASS_DIR
}

var copyFileSync = function(source, target) {

	var targetFile = target;

	// if target is a directory a new file with the same name will be created
	if (fs.existsSync(target)) {
		if (fs.lstatSync(target).isDirectory()) {
			targetFile = path.join(target, path.basename(source));
		}
	}

	fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
	var files = [];

	// check if folder needs to be created or integrated
	var targetFolder = path.join(target, path.basename(source));
	if (!fs.existsSync(targetFolder)) {
		fs.mkdirSync(targetFolder);
	}

	// copy
	if (fs.lstatSync(source).isDirectory()) {
		files = fs.readdirSync(source);
		files.forEach(function (file) {
			var curSource = path.join(source, file);
			if (fs.lstatSync(curSource).isDirectory()) {
				copyFolderRecursiveSync(curSource, targetFolder);
			} else {
				copyFileSync(curSource, targetFolder);
			}
		});
	}
}

var getObject = function(name, directory) {
	// check for config file and read it
	if (fs.existsSync(directory + '/.' + name + '.json')) {
		try {
			var config = JSON.parse(fs.readFileSync(directory + '/.' + name + '.json'));
		} catch(err) {
			console.error(err);
		}
	}

	return config;
}

var putObject = function(name, directory, object) {
	// check for directory and write to it
	if (fs.existsSync(directory)) {
		try {
			var config = JSON.stringify(object, null, 4);
			fs.writeFileSync(directory + '/.' + name + '.json', config);
		} catch(err) {
			console.error(err);
		}
	}
}

var compareKeys = function(thing1, thing2) {
	// ensure objects have same top level keys
}

module.exports = {
	copy: copyFolderRecursiveSync,
	getObject: getObject,
	putObject: putObject,
	variables: variables
}
