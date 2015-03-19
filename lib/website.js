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
	"stage": "mockup",			// mockup, live
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

// configuration
var site_dir = "searchspring-sites/";
var server_port = 1337;

// include packages
var fs = require('fs-extra');
// screen capture image/resize
var webshot = require('webshot');
var lwip = require('lwip');

// the object properties that should be written to file (sitename.json)
var export_options = ['name', 'siteid', 'status', 'stage', 'cart', 'image', 'template', 'modules'];

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
		fs.writeFileSync(this.directory + '/' + this.name + '.json', json_options);
	}
	catch(err) {
		console.error('failed to write website config: ');
		console.error(err);
	}
	return;
}

// take a screen shot of website
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
					if (err) return reject(err);
					image.scale(0.25, function(err, image) {
						if (err) return reject(err);
						image.writeFile(output_dir + output_file, function(err) {
							if (err) return reject(err);
							// create copy for use in all sites
							var thumb = site_dir + 'sites/.thumbs/' + self.name + '/' + self.name + '.png';
							fs.copy(output_dir + output_file, thumb, function(err) {
								if (err) return reject(err);
								self.saveConfig();
								return resolve(true);
							});
						});
					});
				});
			});
		} catch(err) {
			return reject(err);
		}
	});
}
