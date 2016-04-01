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
		throw err;
	});
}

/**
* copy folder recursively
* @param {string} source
* @param {string} target
* @return {promise}
*/
var copyFolder = function(source, target) {
	var files = [];

	// check if folder needs to be created
	var targetFolder = path.join(target, path.basename(source));
	return exists(targetFolder).then(existence => {
		if (!existence) {
			return mkdir(targetFolder);
		} else {
			throw new Error(targetFolder + ' already exists!');
		}
	}).then(() => {
		return lstat(source);
	}).then(stat => {
		if (stat && stat.isDirectory()) {
			return readDir(source);
		} else {
			throw new Error(source + ' is not a directory!');
		}
	}).then(files => {
		var filePromises = [];
		files.forEach(function(file) {
			console.log(file);
			var currentSource = path.join(source, file);

			// TODO fix this async lstat for promise usage...

			// lstat(currentSource).then(stat => {
			// 	if (stat && stat.isDirectory()) {
			// 		console.log('copying directory');
			// 		var filePromise = copyFolder(currentSource, targetFolder);
			// 	} else {
			// 		console.log('copying file');
			// 		var filePromise = copyFile(currentSource, targetFolder);
			// 	}
			// 	filePromises.push(filePromise);
			// 	console.log(filePromises);
			// }).catch(err => {
			// 	throw err;
			// });

			var stat = fs.lstatSync(currentSource)

			if (stat && stat.isDirectory()) {
				console.log('copying directory');
				filePromises.push(copyFolder(currentSource, targetFolder));
			} else {
				console.log('copying file');
				filePromises.push(copyFile(currentSource, targetFolder));
			}
			console.log(filePromises);
		});

		console.log('done looping');
		return Promise.all(filePromises);
	}).then(() => {
		console.log('done');
		// all recursive shenanigans are resolved
		return;
	}).catch(err => {
		throw err;
	});
}

/**
* exists
* @param {string} directory
* @return {promise} existence
*/
var exists = function(directory) {
	return new Promise(function(resolve, reject) {
		fs.exists(directory, existence => {
			return resolve(existence);
		});
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
				return reject(err);
			} else {
				return resolve(stats);
			}
		});
	});
}

/**
* mkdir
* @param {string} directory
* @return {promise}
*/
var mkdir = function(directory) {
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
	copyFolder: copyFolder,
	exists: exists,
	lstat: lstat,
	mkdir: mkdir,
	readDir: readDir,
	readFile: readFile,
	writeFile: writeFile
}
