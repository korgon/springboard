/**
 * @module gitmo/helper
 */

var fs = require('fs');

var helper = {};

/**
 * Removes test repository directory if it exists
 * @param {string} directory
 */
helper.setupTest = function(dir) {
	// ensure that the testing dir does not exist
	try {
		var directory = fs.statSync(dir);

		if (directory) {
			console.log('removing directory');
			helper.deleteFolderRecursive(dir);
		}
	} catch (error) {
		console.log(error);
		// file does not exist, do nothing
	}

	// create test directory
	fs.mkdirSync(dir);
}

/**
 * Removes test directory if it exists
 * @param {string} directory
 */
helper.teardownTest = function(dir) {
	// ensure that the testing dir does not exist
	try {
		var directory = fs.statSync(dir);
		helper.deleteFolderRecursive(dir);
	} catch (error) {
		// file does not exist, do nothing
	}
}

/**
 * Removes files and directories recursively
 * @param {string} path
 */
helper.deleteFolderRecursive = function(path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function(file, index) {
			var curPath = path + "/" + file;
			var stats = fs.lstatSync(curPath);
			if (stats.isDirectory()) {
				// recurse
				helper.deleteFolderRecursive(curPath);
			} else {
				// delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
}

module.exports = helper;
