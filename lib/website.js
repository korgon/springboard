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
	"type": normal,					// normal, responsive, mobile
	"status": "merged",			// uncommited, commited, pushed, merged
	"stage": "mockup",			// development, mockup, live
	"cart": "netsuite",
	"template": "ragequit",
}

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

// the object properties that should be written to file (sitename.json)
var export_options = ['name', 'siteid', , 'status', 'gitstatus', 'stage', 'cart', 'template'];

// construction
module.exports = website;
function website(options) {
	this.valid = true;

	for (var key in options) {
		this[key] = options[key];
	}
	this.branch = 'site/' + this.name;

	// check if new site creation if so saveConfig
	if (options.status != 'new') {
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

website.prototype.setStatus = function(newstatus) {
	if (newstatus.status) this.status = newstatus.status;
	if (newstatus.gitstatus) this.gitstatus = newstatus.gitstatus;
	this.saveConfig();
	this.appendHistory();
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
