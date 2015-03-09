// site "class"
// * compile sass
// * compile js
// * update browser
// * upload to s3
// * module addition

// strictness!
"use strict";

/*
object prototype

{
  "name": "asite.com",
  "siteid": "xxxxxx",
	"status": "mockup",
	"cart": "netsuite",
	"image": "",
	"template": "ragequit",
	"modules": [
  	{
  		"name": "slideout",
  		"version": "1.0.1"
  	}
  ]
}

*/

// include packages
var fs = require('fs');
var git = require('gulp-git');

// private configuration
var mockup_dir = "searchspring-mockups/";
// the object properties that should be written to file (sitename.json)
var export_options = ['name', 'siteid', 'status', 'cart', 'image', 'template', 'modules'];

// construction
module.exports = website;
function website(options) {
	this.valid = true;

	for (var key in options) {
		this[key] = options[key];
	}
	this.branch = 'site/' + this.name;

	// check if new site creation if so saveConfig
	if (options.siteid === undefined) {
		this.getConfig();
	}
	else {
		this.saveConfig();
	}
}

// * * * * * * * * * * * */
//   public functions   */
// * * * * * * * * * * */

// get configuration from json
website.prototype.getConfig = function() {
	//var thissite = this;
	// check for config file and read it
	if (fs.existsSync(this.directory + '/' + this.name + '.json')) {
		try {
			// add config.json properties to site
			var config = JSON.parse(fs.readFileSync(this.directory + '/' + this.name + '.json'));
			for (var key in config) {
				this[key] = config[key];
			}
			// check for valid options
			// verify that modules are loaded and configured
			// TBD
		} catch(err) {
			console.error(err);
		}
	}
	else {
		console.error('Config file for ' + this.name + ' does not exist!'.red);
		this.valid = false;
	}
	return;
}

website.prototype.saveConfig = function() {
	var options = {};
	// fill options with each export option
	for (let i of export_options) {
		if (this[i] === undefined)
			continue;
		options[i] = this[i];
	}
	try {
		var json_options = JSON.stringify(options, null, 4);
		fs.writeFileSync(this.directory + '/' + this.name + '.json', json_options);
	}
	catch(err) {
		console.error('failed to write website config: ', err);
	}
	return;
}

website.prototype.checkout = function() {
	// promisified
	var self = this;
	return new Promise(function(resolve, reject) {
		//checkout git branch
		try {
			git.exec({args: 'checkout site/' + self.name, log: true, cwd: mockup_dir}, function (err) {
				if (err) {
					return reject(err);
				}
				return resolve(self);
			});
		}
		catch(err) {
			return reject(err)
		}
	});
}

website.prototype.pullit = function() {
	// promisified
	var self = this;
	return new Promise(function(resolve, reject) {
		// pulls down branch
		try {
			git.pull('origin', self.branch, {cwd: mockup_dir}, function (err) {
				if (err) {
					return reject(err);
				}
				return resolve(true);
			});
		}
		catch(err) {
			return reject(err);
		}
	});
}

website.prototype.pushit = function() {
	var self = this;
	// promisified
	return new Promise(function(resolve, reject) {
		try {
			git.push('origin', 'site/' + self.name, {cwd: mockup_dir}, function (err) {
				if (err) {
					return reject(err);
				}
				return resolve(true);
			});
		}
		catch(err) {
			return reject(err);
		}
	});
}

website.prototype.commit = function(message) {
	var self = this;
	// promisified
	if (message === undefined) {
		return reject('must have a commit message!');
	}

	return new Promise(function(resolve, reject) {
		try {
			git.exec({args: 'add -v sites/' + self.name, log: true, cwd: mockup_dir}, function (err) {
				if (err) {
					return reject(err);
				}
				try {
					git.exec({args: 'commit -m "' + message + '"', log: true, cwd: mockup_dir}, function (err) {
						if (err) {
							return reject(err);
						}
						return resolve(true);
					});
				}
				catch(err) {
					return reject(err);
				}
			});
		}
		catch(err) {
			return reject(err)
		}
	});
}

website.prototype.publish = function() {
	var self = this;
	// promisified
	console.log('...publishing a site...'.bold.blue);

	return new Promise(function(resolve, reject) {
		console.log('published ' + self.name + '\n');

		// repoAdd()
		// .then(function() {
		// 	repoCommit('Springboard: initial commit')
		// 	.then(function() {
		// 		repoPush()
		// 		.then(function() {
		// 			console.log('created '.bold.red + details.name.bold.red);
		// 			self.useSite(site.name).then(function() {
		//				// merge into common
		// 				return resolve(true);
		// 			});
		// 		}, function() {
		// 			return reject('Failed to push files to the repo...');
		// 		});
		// 	}, function() {
		// 		return reject('Failed to commit files to the repo...');
		// 	});
		// }, function() {
		// 	return reject('Failed to add files to the repo...');
		// });
	});
}

function repoMerge() {
	// promisified
	// return new Promise(function(resolve, reject) {
	// 	try {
	// 		// push site
	// 		// pull develop
	// 		// switch to develop then merge site/site.name
	// 		// then switch back to site/site.name
	// 		git.merge('site/' + site.name, {cwd: mockup_dir}, function (err) {
	// 			if (err) {
	// 				return reject(err);
	// 			}
	// 			return resolve(true);
	// 		});
	// 	}
	// 	catch(err) {
	// 		return reject(err);
	// 	}
	// });
}
