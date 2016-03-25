// site "class"

// catalog/module management

// strictness!
"use strict";

/*
object prototype

{
  "name": "asite.com",
  "siteid": "xxxxxx",
	"cart": "none",
	"created": "date_created",
	"proxy": false,
	"proxy_url": '',
	"default_html": "file.html",
	"thumb": "image.png",
	"history": [ { history data } ]
}

additional attributes only used for springboard at runtime:
{
	"directory": "",			// location of site relative to springboard
}

*/

// the object properties that should be written to file (sitename.json)
var export_options = ['name', 'siteid', 'cart', 'created', 'proxy', 'proxy_url', 'default_html', 'thumb', 'history'];

/*

functions:
installCatalog

these should be ui (catalog version) specific
installCatalog
compileCatalog
installModule
removeModule

*/

// include packages
var fs = require('fs');
// screen capture image/resize
var webshot = require('webshot');
var lwip = require('lwip');

// local modules
var Catalog = require('./Catalog.js');

// placeholders for passed in objects (dependency injection)
var user;

// construction
module.exports = website;
// pass in options object, user object
function website(options, louser) {
	user = louser;

	this.valid = true;

	for (var key in options) {
		this[key] = options[key];
	}
	this.branch = 'site/' + this.name;

	// create empty catalogs object
	this.catalogs = {};
	// load catalogs
	this.loadCatalogs();

	// check if new site creation if so saveConfig
	if (options.status != 'new') {
		this.getConfig();
	}
	else {
		// new site defaults
		this.created = new Date().getTime();
		this.proxy = this.proxy || false;
		this.proxy_url = this.proxy_url || '';
		this.default_html = this.name + '.html';
		this.thumb = '/images/working.png';
		this.history = [];
		this.saveConfig();
	}
}

// * * * * * * * * * * * */
//   public functions   */
// * * * * * * * * * * */

// reload website object
website.prototype.reload = function() {
	this.getConfig();
	delete this.catalogs;
	// create empty modules object
	this.catalogs = {};
	// load modules
	this.loadCatalogs();
}

// get configuration from json for object properties
website.prototype.getConfig = function() {
	//var thissite = this;
	// check for config file and read it
	if (fs.existsSync(this.directory + '/.' + this.name + '.json')) {
		try {
			// add config.json properties to site
			var config = JSON.parse(fs.readFileSync(this.directory + '/.' + this.name + '.json'));
			for (var key in config) {
				this[key] = config[key];
			}

			// for older sites with no history
			this.history = this.history || []

			// check for valid options
			// verify that catalogs are loaded and configured
			// TBD
		} catch(err) {
			console.error(err);
		}
	}
	else {
		this.valid = false;
	}
	return;
}

// save configuration to json
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
		fs.writeFileSync(this.directory + '/.' + this.name + '.json', json_options);
	}
	catch(err) {
		console.error('failed to write website config: ');
		console.error(err);
	}
	// modules save

	return;
}

// take a screen shot of website
// TODO make mobile friendly
website.prototype.capture = function(url) {
	// promisified
	var self = this;
	return new Promise(function(resolve, reject) {
		var options = {
			screenSize: { width: 1280, height: 720 },
			shotSize: { width: 1280, height: 720 },
			renderDelay: 1200
		};

		// variables for files'n'stuff
		var thumb_dir = self.directory + '/.thumbs/';
		var output_file = self.name + '.png';
		var output_path = thumb_dir + output_file;
		var url = 'http://localhost:' + global.port + '/sites/' + self.name + '/' + self.default_html;

		try {
			webshot(url, output_path, options, function(err) {
				// after taking screen capture scale image to thumbnail size using lwip
				// lwip.open(output_path, function(err, image) {
				// 	if (err) return reject(err);
				//
				// 	// scale image
				// 	image.scale(0.50, function(err, image) {
				// 		if (err) return reject(err);
				//
				// 		image.writeFile(output_path, function(err) {
				// 			if (err) return reject(err);
				// 			self.thumb = '/sites/' + self.name + '/' + '.thumbs/' + output_file;
				// 			self.saveConfig();
				// 			return resolve(true);
				// 		});
				// 	});
				// });
			});
		} catch(err) {
			console.error(err);
			return reject(err);
		}
	});
}

// install new catalog (UI)
website.prototype.installCatalog = function(new_cat) {
	// promisified but using sync inside for now...
	var self = this;
	return new Promise(function(resolve, reject) {
		// copy folder into site folder
		var template_dir = new_cat.directory;
		var catalog_dir = self.directory + '/' + new_cat.name;
		try {
			// ensure module name (directory) not in use
			if (!fs.existsSync(catalog_dir)) {
				// create new module object
				self.catalogs[new_cat.name] = new Catalog({ siteid: self.siteid, name: new_cat.name, type: new_cat.type, directory: catalog_dir, template_dir: new_cat.template_dir, new: true });

				if (self.catalogs[new_cat.name].valid)
					return resolve({ error: false, message: 'Catalog installed!' });
				else
					throw('Catalog install failed!');

			} else {
				throw ('Directory exists...');
			}
		} catch(err) {
			console.log(err);
			return reject({ error: true, message: err });
		}
	});
}

// // install module theme
// website.prototype.installTheme = function(info) {
// 	var self = this;
// 	return new Promise(function(resolve, reject) {
// 		// check if module installed in site
// 		if (!self.modules[info.module]) return reject({ error: true, message: 'Parent module not installed!' });
// 		else {
// 			self.modules[info.module].installTheme(info).then(function() {
// 				return resolve();
// 			}).catch(function(err) {
// 				return reject(err);
// 			})
// 		}
// 	});
// }

// TODO FINISH THIS
// load modules
website.prototype.loadCatalogs = function() {
	var self = this;
	var catalogs_dir = this.directory;
	if (fs.existsSync(catalogs_dir)) {
		try {
			var folders = fs.readdirSync(catalogs_dir);
		}
		catch(err) {
			console.error(err);
		}
		// first empty plugins object (to start fresh)
		for (var del in this.catalogs) delete this.catalogs[del];

		// load up the modules
		for (var folder of folders) {
			// ignore non directories... or hidden folders (^.*)
			if (!fs.lstatSync(catalogs_dir + '/' + folder).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop
			var catalog_dir = catalogs_dir + '/' + folder;
			// read modules directories
			try {
				// check if json config exists within folder
				if (fs.existsSync(catalog_dir + '/.' + folder + '.json')) {
					// add the module to the site
					self.catalogs[folder] = new Catalog({ name: folder, directory: catalog_dir });
				}
			}
			catch(err) {
				console.error(err);
			}
		}
	}
}

// compile modules
website.prototype.compile = function() {
	// loop through modules and compile them all!
	for (var amod in this.catalogs) {
		console.log('compiling ' + amod);
		this.catalogs[amod].compile();
	}
}
