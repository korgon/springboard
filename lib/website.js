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
// awshit s3
var AWS = require('aws-sdk');
// screen capture image/resize
var webshot = require('webshot');
var lwip = require('lwip');

// private configuration
var mockup_dir = "searchspring-mockups/";
var server_port = 1337;
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
		console.error('failed to write website config: ');
		console.error(err);
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
	// promisified
	var self = this;
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
	// promisified
	var self = this;
	return new Promise(function(resolve, reject) {
		if (message === undefined) {
			return reject('must have a commit message!');
		}
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

website.prototype.capture = function(url) {
	// promisified
	var self = this;
	return new Promise(function(resolve, reject) {
		var options = {
			screenSize: { width: 1280, height: 720 },
			shotSize: { width: 1280, height: 720 },
			renderDelay: 1200
		};
		var time = new Date().getTime();
		var output_dir = self.directory + '/captures/';
		var output_file = time + '_' + self.name + '.png';
		var url = 'http://localhost:' + server_port + '/sites/' + self.name + '/' + self.name + '.html';
		try {
			webshot(url, output_dir + output_file, options, function(err) {
				self.image = output_file;
				lwip.open(output_dir + output_file, function(err, image) {
					if (err) {
						return reject(err);
					}
					image.scale(0.25, function(err, image) {
						if (err) {
							return reject(err);
						}
						image.writeFile(output_dir + output_file, function(err) {
							if (err) {
								return reject(err);
							}
							self.saveConfig();
							return resolve(true);
						});
					});
				});
			});
		} catch(err) {
			return reject(err);
		}
	});
}



website.prototype.publish = function(message) {
	// promisified
	var self = this;
	return new Promise(function(resolve, reject) {
		self.capture().then(function() {
			console.log(message);
			return self.commit(message);
		}).then(function() {
			console.log('premerge');
			return self.repoMerge();
		}).catch(function(err) {
			return reject(err);
		}).then(function() {
			// omg that was rough...
			// success!!!

			// TBD
			// upload files to s3
			console.log('end publish');
			return resolve(true);
		});
	});
}

website.prototype.repoMerge = function() {
	// promisified
	var self = this;
	return new Promise(function(resolve, reject) {
		console.log('in merge');
		self.pushit()
		.then(function() {
			// checkout collection (develop)
			// pull collection
			// merge site
			// push collection
			// checkout site
			return resolve(true);
		})
		.catch(function(err) {
			return reject(err);
		})
	});
}
