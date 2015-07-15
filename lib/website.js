// site "class"

// module/plugin management

// strictness!
"use strict";

/*
object prototype

{
  "name": "asite.com",
  "siteid": "xxxxxx",
	"backend": "saluki",		// sakuki, solr
	"status": "mockup",			// new, development, mockup, live
	"gitstatus": "merged",	// uncommited, commited, pushed, merged
	"cart": "none",
	"created": "date_created",
	"default_html": "file.html",
	"thumb": "image.png",
	"history": [ { history data } ],

	// not saved to file:
	"directory": location of site
	"modules" : object of module objects
}

functions:
rerender (allmodules)
installModule
installPlugin
installTheme
removeModule
removePlugin
removeTheme
updateModule
updatePlugin
updateTheme




*/

/*

s3 info
----------------------------------------------------
/a.cdn.searchspring.net/mockup/sitename/
|- js/
		|- sitename.mockup.js
|- css/
		|- sitename.mockup.css

/a.cdn.searchspring.net/ajax_search/sites/xxxxxx/
|- js/
    |- xxxxxx.js
		|- sitename.js
|- css/
    |- xxxxxx.css
    |- xxxxxxxxxxxxxxxxxxxxxxxxxxx.css
		|- sitename.css

*/

// include packages
var fs = require('fs-extra');
// screen capture image/resize
var webshot = require('webshot');
var lwip = require('lwip');
// templating
var nja = require('nunjucks');

// local modules
var mod = require('./mod.js');

// placeholders for passed in objects (dependency injection)
var user;

// the object properties that should be written to file (sitename.json)
var export_options = ['name', 'siteid', 'backend', 'status', 'gitstatus', 'cart', 'created', 'default_html', 'thumb', 'history'];

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

	// create empty modules object
	this.modules = {};
	// load modules
	this.loadModules();

	// check if new site creation if so saveConfig
	if (options.status != 'new') {
		this.getConfig();
	}
	else {
		this.default_html = this.name + '.html';
		this.saveConfig();
	}
}

// * * * * * * * * * * * */
//   public functions   */
// * * * * * * * * * * */

// reload website object
website.prototype.reload = function() {
	this.getConfig;
	delete this.modules;
	// create empty modules object
	this.modules = {};
	// load modules
	this.loadModules();
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
			// check for valid options
			// verify that modules are loaded and configured
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
	return;
}

// used to change the status of a site
// git status		uncommited, commited, pushed, merged
// site status	mockup	live
website.prototype.setStatus = function(newstatus) {
	if (newstatus.status) this.status = newstatus.status;
	if (newstatus.gitstatus) this.gitstatus = newstatus.gitstatus;
	this.saveConfig();
	this.appendHistory();
	return;
}

// use to push history object to history
website.prototype.appendHistory = function(username, message) {
	/*
	history object prototype
	{
		"time": timestamp,
		"user": username,
		"status": sitestatus
	}
	*/
	var time = new Date().getTime();
	//console.log('re-writing the books...');
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
				lwip.open(output_path, function(err, image) {
					if (err) return reject(err);

					// scale image
					image.scale(0.50, function(err, image) {
						if (err) return reject(err);

						image.writeFile(output_path, function(err) {
							if (err) return reject(err);
							self.thumb = output_file;
							self.saveConfig();
							return resolve(true);
						});
					});
				});
			});
		} catch(err) {
			console.error(err);
			return reject(err);
		}
	});
}

// install new module
website.prototype.installModule = function(new_mod) {
	// promisified but using sync inside for now...
	var self = this;
	return new Promise(function(resolve, reject) {
		// copy folder into site folder
		var template_dir = new_mod.directory;
		var module_dir = self.directory + '/' + new_mod.name;
		try {
			if (!fs.existsSync(module_dir)) {
				fs.copySync(template_dir + '/core', module_dir + '/core');
				// rename the json config file for the module to the new name
				var config_file = template_dir + '/.' + new_mod.type + '.json';
				var new_config_file = module_dir + '/.' + new_mod.name + '.json';

				fs.copySync(config_file, new_config_file);

				// create new module object
				self.modules[new_mod.name] = new mod({ name: new_mod.name, directory: module_dir });
				return resolve({ error: false, message: 'module installed' });

			} else {
				return reject({ error: true, message: 'directory exists...' });
			}
		} catch(err) {
			return reject({ error: true, message: err });
		}
	});
}

// TODO FINISH THIS
// load modules
website.prototype.loadModules = function() {
	var self = this;
	var modules_dir = this.directory;
	if (fs.existsSync(modules_dir)) {
		try {
			var folders = fs.readdirSync(modules_dir);
		}
		catch(err) {
			console.error(err);
		}
		// first empty plugins object (to start fresh)
		for (var del in this.modules) delete this.modules[del];

		// load up the modules
		for (var folder of folders) {
			// ignore non directories... or hidden folders (^.*)
			if (!fs.lstatSync(modules_dir + '/' + folder).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop
			var module_dir = modules_dir + '/' + folder;
			// read modules directories
			try {
				// check if json config exists within folder
				if (fs.existsSync(module_dir + '/.' + folder + '.json')) {
					// add the module to the site
					self.modules[folder] = new mod({ name: folder, directory: module_dir });
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
	for (var amod in this.modules) {
		console.log('compiling ' + amod);
		this.modules[amod].compile();
	}
}
