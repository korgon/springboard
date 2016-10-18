/**
* @module fspro
*/

'use strict';

var fs = require('fs');
var path = require('path');


/**
* compare two objects top level keys
* @param {object} thing1
* @param {object} thing2
* @return {boolean}
*/
const compareKeys = function(thing1, thing2) {
	let equality = true;
	// ensure objects have same top level keys
	let thing1_keys = Object.keys(thing1);
	let thing2_keys = Object.keys(thing2);

	// check that thing1 keys exist in thing2
	for (let key of thing1_keys) {
		if (typeof thing2[key] == 'undefined') {
			equality = false;
			break;
		}
	}

	// check thing2 keys in thing1 if thing1 keys were in thing2...
	if (equality) {
		// check that thing2 keys exist in thing1
		for (let key of thing2_keys) {
			if (typeof thing1[key] == 'undefined') {
				equality = false;
				break;
			}
		}
	}

	// check that the types are the same
	if (thing1.type != thing2.type) {
		equality = false;
	}

	return equality;
}


/**
* compare two objects
* @param {object} thing1
* @param {object} thing2
* @return {boolean}
*/
const compareObjects = function(thing1, thing2) {
	if (thing1 === null || thing1 === undefined || thing2 === null || thing2 === undefined) {
		return thing1 === thing2;
	}

	// after this just checking type of one would be enough
	if (thing1.constructor !== thing2.constructor) {
		return false;
	}

	// if they are functions, they should exactly refer to same one (because of closures)
	if (thing1 instanceof Function) {
		return thing1 === thing2;
	}

	// if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
	if (thing1 instanceof RegExp) {
		return thing1 === thing2;
	}

	if (thing1 === thing2 || thing1.valueOf() === thing2.valueOf()) {
		return true;
	}

	if (Array.isArray(thing1) && thing1.length !== thing2.length) {
		return false;
	}

	// if they are dates, they must had equal valueOf
	if (thing1 instanceof Date) {
		return false;
	}

	// if they are strictly equal, they both need to be object at least
	if (!(thing1 instanceof Object)) {
		return false;
	}

	if (!(thing2 instanceof Object)) {
		return false;
	}

	// recursive object equality check
	var p = Object.keys(thing1);

	return Object.keys(thing2).every(function(i) { return p.indexOf(i) !== -1; }) &&
		p.every(function(i) { return compareObjects(thing1[i], thing2[i]); });
}


/**
* concatenate all files in directory together
* @param {string} directory
* @param {string} output
* @param {string} match
* @return {promise}
*/
var concatDir = function(directory, output, match) {
	return getFiles(directory).then(files => {
		var read_promises = [];

		files.forEach(file => {
			if (match) {
				let regex_match = new RegExp(match);
				if (file.match(regex_match)) read_promises.push(readFile(file));
			} else {
				read_promises.push(readFile(file));
			}
		});
		return Promise.all(read_promises);
	}).then(contents => {
		return writeFile(output, contents.join('\n\n'));
	}).catch(err => {
		if (err && err.message) err.message = 'concatDir(): ' + err.message;
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
		if (err && err.message) err.message = 'copyFile(): ' + err.message;
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
		if (err && err.message) err.message = 'copyDir(): ' + err.message;
		throw err;
	});
}

/**
* exists uses lstat to determine if file exists or not
* @param {string} directory
* @return {promise} existence
*/
var exists = function(path) {
	return lstat(path).then(stats => {
		// file or directory exists
		stats.path = path;
		return stats;
	}).catch(err => {
		// file does not exist
		return false;
	});
}

/**
* recursively get directory structure
* @param {string} directory
* @return {promise} array of files
*/
var getDirStruct = function(directory, structure) {
	// used to track current directory
	let current_struct;

	return lstat(directory).then(stat => {
		if (stat && stat.isDirectory()) {
			if (!structure) {
				let dir_name = path.basename(directory);
				structure = {};
				structure.root = { path: directory, type: 'directory', name: dir_name, contents: {} };
				current_struct = structure.root;
			} else {
				// sub-directory: add to structure
				let relative_path = directory.replace(structure.root.path + '/', '');

				let structure_location = structure.root;

				for (let sub of relative_path.split('/')) {
					if (!sub) continue;
					if (structure_location.contents[sub]) {
						// sub parent directory exists
						structure_location = structure_location.contents[sub];
					} else {
						// new directory (should be last entry)
						structure_location.contents[sub] = { type: 'directory', name: sub, path: relative_path, contents: {} };
						structure_location = structure_location.contents[sub];
					}

				}
				current_struct = structure_location;
			}
			return readDir(directory);
		} else {
			throw new Error('getFiles: ' + directory + ' is not a directory!');
		}
	}).then(contents => {
		// ignore hidden files and make paths absolute
		contents = contents.filter(file => !file.match(/^\./)).map(file => {
			return path.join(directory, file);
		});

		return lstat(contents);
	}).then(file_stats => {
		var struct_promises = [];

		file_stats.forEach(function(stats) {
			// if symbolic link must check if links to dir or file
			if (stats.isSymbolicLink()) {
				// ignore!
				//struct_promises.push(Promise.resolve());
			} else if (stats.isDirectory()) {
				// get directory contents
				struct_promises.push(getDirStruct(stats.path, structure));
			} else {
				// regular file
				let file_name = path.basename(stats.path.replace(directory, ''));
				let file_path = stats.path.replace(structure.root.path + '/', '');
				current_struct.contents[file_name] = {
					type: 'file',
					name: file_name,
					path: file_path,
					size: (stats.size/1000).toFixed(2) + 'kB',
					modified: stats.mtime.getTime(),
					extension: path.extname(file_name).replace('.', '')
				};

				//struct_promises.push(Promise.resolve());
			}
		});

		return Promise.all(struct_promises);
	}).then((structs) => {
		return structure;
	}).catch(err => {
		if (err && err.message) err.message = 'getDirStruct(): ' + err.message;
		throw err;
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
					// check for relative link (starts with ../ or ./)
					if (link.match(/^\.\.\/|^\.\//)) {
						linkpath = directory + '/' + link;
					} else {
						linkpath = link;
					}
					return exists(linkpath);
				}).then(exists => {
					if (exists) {
						// ensure that the linked path exists
						return lstat(linkpath);
					} else {
						// linked path does not exist, return 'undefined'
						return Promise.resolve();
					}
				}).then(stats => {
					if (stats) {
						if (stats.isDirectory()) {
							// get directory contents
							return getFiles(linkpath);
						} else {
							// copy file
							return Promise.resolve(linkpath);
						}
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
		let listing = [].concat.apply([],promises);
		// ignore undfined (invalid) entries
		listing = listing.filter(item => item != undefined);
		return listing;
	}).catch(err => {
		if (err && err.message) err.message = 'getFiles(): ' + err.message;
		throw err;
	});
}


/**
* get JSON file, parse it and return it
* @param {string} path
* @return {promise} object
*/
var getJSON = function(file) {
	// check for config file and read it
	return exists(file).then(stats => {
		if (!stats) {
			throw new Error('getObject: ' + file + ' does not exist.');
		} else {
			return readFile(file);
		}
	}).then(contents => {
		return JSON.parse(contents);
	}).catch(err => {
		if (err && err.message) err.message = 'getJSON(): ' + err.message;
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
* get symbolic links in directory
* @param {string} directory
* @return {promise} array of symbolic link paths
*/
var getLinks = function(directory) {
	return lstat(directory).then(stat => {
		if (stat && stat.isDirectory()) {
			return readDir(directory);
		} else {
			throw new Error('getLinks: ' + directory + ' is not a directory!');
		}
	}).then(contents => {
		contents = contents.map(file => {
			return path.join(directory, file);
		});

		return lstat(contents);
	}).then(file_stats => {
		var files = [];

		file_stats.forEach(function(stats) {
			// if symbolic link must check if links to dir or file
			if (stats.isSymbolicLink()) {
				files.push(stats.path);
			}
		});

		return files;
	}).catch(err => {
		if (err && err.message) err.message = 'getLinks(): ' + err.message;
		throw err;
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
* put JSON, JSONify it and write it to file
* @param {string} path
* @return {promise}
*/
const putJSON = function(file, object) {
	let directory = path.dirname(file);
	// check for directory and write to it
	return exists(directory).then(stats => {
		if (!stats) {
			throw new Error('putJSON: ' + directory + ' does not exist.');
		} else {
			var config = JSON.stringify(object, null, 4);
			return writeFile(file, config);
		}
	}).then(() => {
		return;
	}).catch(err => {
		if (err && err.message) err.message = 'putJSON(): ' + err.message;
		throw err;
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
* @return {promise} data
*/
var readFile = function(file) {
	return new Promise(function(resolve, reject) {
		fs.readFile(file, 'utf8', (err, data) => {
			if (err) {
				return reject(err);
			} else {
				return resolve(data);
			}
		});
	});
}


/**
* rename
* @param {string} oldpath
* @param {string} newpath
* @return {promise}
*/
var rename = function(oldpath, newpath) {
	return new Promise(function(resolve, reject) {
		fs.rename(oldpath, newpath, (err) => {
			if (err) {
				return reject(err);
			} else {
				return resolve();
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
	compareKeys: compareKeys,
	compareObjects: compareObjects,
	concatDir: concatDir,
	copyFile: copyFile,
	copyDir: copyDir,
	exists: exists,
	getDirStruct: getDirStruct,
	getFiles: getFiles,
	getJSON: getJSON,
	getLink: getLink,
	getLinks: getLinks,
	linkUp: linkUp,
	lstat: lstat,
	mkDir: mkDir,
	putJSON: putJSON,
	readDir: readDir,
	readFile: readFile,
	rename: rename,
	unLink, unLink,
	writeFile: writeFile
}
