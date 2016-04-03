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
		console.log(files);
		var file_promises = [];

		console.log('!!!!');
		console.log(files);
		console.log('!!!!');

		files.forEach(function(file) {
			console.log(file);
			var currentSource = path.join(source, file);

			// TODO fix this async lstat for promise usage...

			// lstat(currentSource).then(stat => {
			// 	if (stat && stat.isDirectory()) {
			// 		console.log('copying directory');
			// 		var filePromise = copyDir(currentSource, targetFolder);
			// 	} else {
			// 		console.log('copying file');
			// 		var filePromise = copyFile(currentSource, targetFolder);
			// 	}
			// 	file_promises.push(filePromise);
			// 	console.log(file_promises);
			// }).catch(err => {
			// 	throw err;
			// });

			var stat = fs.lstatSync(currentSource)

			if (stat && stat.isDirectory()) {
				console.log('copying directory');
				file_promises.push(copyDir(currentSource, targetFolder));
			} else {
				console.log('copying file');
				file_promises.push(copyFile(currentSource, targetFolder));
			}
			console.log(file_promises);
		});

		console.log('done looping');
		return Promise.all(file_promises);
	}).then(() => {
		console.log('done');
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
* lstat
* @param {string} directory
* @return {promise} stats
*/
var lstat = function(directory) {
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
