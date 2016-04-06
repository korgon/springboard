/**
* @module fspro
*/

'use strict';

var fs = require('fs');
var path = require('path');

/**
* concatenate files together
* @param {string} directory
* @param {string} output
* @return {promise}
*/
var concatFiles = function(directory, output) {
	return getFiles(directory).then(files => {
		var read_promises = [];
		
		files.forEach(file => {
			read_promises.push(readFile(file));
		});
		return Promise.all(read_promises);
	}).then(contents => {
		return writeFile(output, contents.join('\n\n'));
	}).catch(err => {
		if (err && err.message) err.message = 'concatFiles: ' + err.message;
		throw err;
	});
}

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
* exists uses lstat to determine if file exists or not
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
* recursively get files in a directory
* @param {string} directory
* @return {promise} array of files
*/
var getFiles = function(directory) {
	return lstat(directory).then(stat => {
		if (stat && stat.isDirectory()) {
			return readDir(directory);
		} else {
			throw new Error('getFiles: ' + directory + ' is not a directory!');
		}
	}).then(contents => {
		contents = contents.map(file => {
			return path.join(directory, file);
		});

		return lstat(contents);
	}).then(file_stats => {
		var file_promises = [];

		file_stats.forEach(function(stats) {
			// if symbolic link must check if links to dir or file
			if (stats.isSymbolicLink()) {
				var linkpath;
				file_promises.push(getLink(stats.path).then(link => {
					linkpath = link;
					return lstat(link);
				}).then(stats => {
					if (stats.isDirectory()) {
						// get directory contents
						return getFiles(linkpath);
					} else {
						// copy file
						return Promise.resolve(linkpath);
					}
				}));
			} else if (stats.isDirectory()) {
				// get directory contents
				file_promises.push(getFiles(stats.path));
			} else {
				// copy file
				file_promises.push(Promise.resolve(stats.path));
			}
		});

		return Promise.all(file_promises);
	}).then((promises) => {
		// flatten array
		return [].concat.apply([],promises);
	}).catch(err => {
		if (err && err.message) err.message = 'copyDir: ' + err.message;
		throw err;
	});
}

/**
* get symbolic link
* @param {string} path
* @return {promise} link string
*/
var getLink = function(path) {
	return new Promise(function(resolve, reject) {
		fs.readlink(path, (err, linkstring) => {
			if (err) {
				return reject(err);
			} else {
				return resolve(linkstring);
			}
		});
	});
}

/**
* create symbolic link
* @param {string} target
* @param {string} directory
* @return {promise}
*/
var linkUp = function(target, directory) {
	return new Promise(function(resolve, reject) {
		fs.symlink(target, directory, err => {
			if (err) {
				return reject(err);
			} else {
				return resolve();
			}
		});
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
* remove symbolic link
* @param {string} path
* @return {promise}
*/
var unLink = function(path) {
	return new Promise(function(resolve, reject) {
		// check for existence first
		try {
			fs.lstat(path, (err, stats) => {
				if (err) {
					// ignore 'no such file or directory'
					if (err.errno != -2) {
						err.message = 'lstat: ' + err.message;
						return reject(err);
					}
				}

				try {
					fs.unlink(path, err => {
						if (err) {
							// ignore 'no such file or directory'
							if (err.errno != -2) {
								err.message = 'lstat: ' + err.message;
								return reject(err);
							} else {
								return resolve();
							}
						} else {
							return resolve();
						}
					});
				} catch(err) {
					return reject(err);
				}
			});
		} catch(err) {
			return reject(err);
		}
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
	concatFiles: concatFiles,
	copyFile: copyFile,
	copyDir: copyDir,
	exists: exists,
	getFiles: getFiles,
	getLink: getLink,
	linkUp: linkUp,
	lstat: lstat,
	mkDir: mkDir,
	readDir: readDir,
	readFile: readFile,
	unLink, unLink,
	writeFile: writeFile
}
