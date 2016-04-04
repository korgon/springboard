/**
* @module fspro
*/

'use strict';

var fs = require('fs');
var path = require('path');

/**
* copy file async
* @param {string} source
* @param {string} target
* @return {promise}
*/
var copyFile = function(source, target) {
	var targetFile = target;

	return exists(target).then(existence => {
		if (existence) {
			return lstat(target);
		} else {
			return new Promise.resolve();
		}
	}).then((stat) => {
		if (stat && stat.isDirectory()) {
			targetFile = path.join(target, path.basename(source));
		}
		return readFile(source);
	}).then(data => {
		return writeFile(targetFile, data);
	}).then(() => {
		return;
	}).catch(err => {
		if (err && err.message) err.message = 'copyFile: ' + err.message;
		throw err;
	});
}

/**
* copy directory recursively
* @param {string} source
* @param {string} target
* @return {promise}
*/
var copyDir = function(source, target) {
	var files = [];

	// check if folder needs to be created
	var targetFolder = path.join(target, path.basename(source));

	return exists(targetFolder).then(existence => {
		if (!existence) {
			return mkDir(targetFolder);
		} else {
			throw new Error('copyDir: ' + targetFolder + ' already exists!');
		}
	}).then(() => {
		return lstat(source);
	}).then(stat => {
		if (stat && stat.isDirectory()) {
			return readDir(source);
		} else {
			throw new Error('copyDir: ' + source + ' is not a directory!');
		}
	}).then(files => {
		files = files.map(file => {
			return path.join(source, file);
		});

		return lstat(files);
	}).then(file_stats => {
		var file_promises = [];

		file_stats.forEach(function(stats) {
			if (stats.isDirectory()) {
				// copy directory
				file_promises.push(copyDir(stats.path, targetFolder));
			} else {
				// copy file
				file_promises.push(copyFile(stats.path, targetFolder));
			}
		});

		return Promise.all(file_promises);
	}).then(() => {
		// all recursive shenanigans are resolved
		return;
	}).catch(err => {
		if (err && err.message) err.message = 'copyDir: ' + err.message;
		throw err;
	});
}

/**
* exists (alias for lstat)
* @param {string} directory
* @return {promise} existence
*/
var exists = function(directory) {
	return lstat(directory).then(stats => {
		// file or directory exists
		return stats;
	}).catch(err => {
		// file does not exist
		return false;
	});
}

/**
* lstat a file or directory (accepts array of files also)
* @param {string} directory
* @return {promise} stats
*/
var lstat = function(directory) {
	if (Array.isArray(directory)) {
		// array of files/folders
		var dirs = [];
		return directory.reduce((promises, dir) => {
			return promises.then(() => {
				return lstat(dir);
			}).then(stats => {
				// adding file path for convenience
				stats.path = dir;
				dirs.push(stats);
			});
		}, Promise.resolve()).then(() => {
			return dirs;
		});
	} else {
		// single directory or file
		return new Promise(function(resolve, reject) {
			fs.lstat(directory, (err, stats) => {
				if (err) {
					if (err.message) err.message = 'lstat: ' + err.message;
					return reject(err);
				} else {
					return resolve(stats);
				}
			});
		});
	}
}

/**
* make directory
* @param {string} directory
* @return {promise}
*/
var mkDir = function(directory) {
	return new Promise(function(resolve, reject) {
		fs.mkdir(directory, err => {
			if (err) {
				return reject(err);
			} else {
				return resolve();
			}
		});
	});
}

/**
* read directory
* @param {string} directory
* @return {promise} files
*/
var readDir = function(directory) {
	return new Promise(function(resolve, reject) {
		fs.readdir(directory, (err, files) => {
			if (err) {
				return reject(err);
			} else {
				return resolve(files);
			}
		});
	});
}



/**
* read file
* @param {string} file
* @param {string} target
* @return {promise} data
*/
var readFile = function(file) {
	return new Promise(function(resolve, reject) {
		fs.readFile(file, (err, data) => {
			if (err) {
				return reject(err);
			} else {
				return resolve(data);
			}
		});
	});
}


/**
* write file
* @param {string} file
* @param {string} data
* @return {promise}
*/
var writeFile = function(file, data) {
	return new Promise(function(resolve, reject) {
		fs.writeFile(file, data, err => {
			if (err) {
				return reject(err);
			} else {
				return resolve();
			}
		});
	});
}

module.exports = {
	copyFile: copyFile,
	copyDir: copyDir,
	exists: exists,
	lstat: lstat,
	mkDir: mkDir,
	readDir: readDir,
	readFile: readFile,
	writeFile: writeFile
}
