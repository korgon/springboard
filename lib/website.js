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
	"default_html": "file.html"


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

// local modules
var mod = require('./mod.js');

// placeholders for passed in objects (dependency injection)
var user;

// the object properties that should be written to file (sitename.json)
var export_options = ['name', 'siteid', 'backend', 'status', 'gitstatus', 'cart', 'default_html'];

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

website.prototype.appendHistory = function(username, message) {
	console.log('re-writing the books...');
}

// take a screen shot of website THEN
// save files into .history folder
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
		var time = new Date().getTime();
		var output_file = self.name + '.png';
		var backup_dir = self.directory + '/.history/' + time + '/';
		var live_dir = self.directory + '/live/';
		var url = 'http://localhost:' + global.port + '/sites/' + self.name + '/' + self.name + '.html';

		try {
			webshot(url, backup_dir + output_file, options, function(err) {
				lwip.open(backup_dir + output_file, function(err, image) {
					if (err) return reject(err);
					image.scale(0.25, function(err, image) {
						if (err) return reject(err);
						image.writeFile(backup_dir + output_file, function(err) {
							if (err) return reject(err);
							// create copy for use in all sites
							var thumb = global.site_repository_dirname + '/sites/.thumbs/' + self.name + '/' + self.name + '.png';

							fs.copySync(backup_dir + output_file, thumb, {recursive: true}, function(err) {
								if (err) return reject(err);
							});

							// create a history folder for this moment
							if (fs.existsSync(live_dir)) {
								console.log('copying files for backups');
								fs.copySync(live_dir, backup_dir, {recursive: true}, function(err) {
									if (err) return reject(err);
								});
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

// install new module
website.prototype.installModule = function(new_mod) {
	// promisified
	var self = this;
	return new Promise(function(resolve, reject) {
		// copy folder into site folder
		var template_dir = new_mod.directory;
		var module_dir = self.directory + '/' + new_mod.name;
		try {
			if (!fs.existsSync(module_dir)) {
				fs.mkdirSync(module_dir);

				var files = fs.readdirSync(template_dir);
				for (var file of files) {
					if (fs.lstatSync(template_dir + '/' + file).isDirectory()) continue;
					if (file.match(/\.json/)) {
						fs.copySync(template_dir + '/' + file, module_dir + '/.' + new_mod.name + '.json');
					} else {
						fs.copySync(template_dir + '/' + file, module_dir + '/' + file);
					}
				}
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
	var modules_dir = this.directory;
	if (fs.existsSync(modules_dir)) {
		try {
			var folders = fs.readdirSync(plugins_dir);
		}
		catch(err) {
			console.error(err);
		}
		// first empty plugins object (to start fresh)
		for (var del in this.modules) delete this.modules[del];

		// load up the modules
		for (var folder of folders) {
			// ignore non directories... or hidden folders (^.*)
			if (!fs.lstatSync(plugins_dir + '/' + folder).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop
			// read modules directories
			try {
				var modules_dir = modules_dir + '/' + folder;
				this.modules[folder] = new mod({ name: folder, directory: modules_dir });
			}
			catch(err) {
				console.error(err);
			}
		}
	}
}

// "private" functions
