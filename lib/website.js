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
  "name": "3wishes.com",
  "siteid": "y9nzmp",
	"status": "mockup",
	"cart": "bigcommerce",
	"image": "",
	"template": "",
	"modules":     [
  	{
  		"name": "slideout",
  		"version": "1.0.1"
  	}
  ]
}

*/

// include packages
var fs = require('fs');

// privates
var config_file = 'website.json';
var export_options = ['name', 'siteid', 'status', 'cart', 'image', 'template', 'modules'];

// construction
module.exports = website;
function website(options) {
	this.valid = true;
	for (var key in options) {
		this[key] = options[key];
	}
	// check if new site creation if so saveConfig
	if (options.name === undefined)
		this.getConfig();
	else
		this.saveConfig();
}

// * * * * * * * * * * * */
//   public functions   */
// * * * * * * * * * * */

// get configuration from json
website.prototype.getConfig = function() {
	//var thissite = this;
	// check for config file and read it
	if (fs.existsSync(this.folder + '/' + config_file)) {
		try {
			// add config.json properties to site
			var config = JSON.parse(fs.readFileSync(this.folder + '/' + config_file));
			for (var key in config) {
				this[key] = config[key];
			}
			// check for valid options
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
		fs.writeFileSync(this.folder + '/' + config_file, json_options);
	}
	catch(err) {
		console.error('failed to write website config: ', err);
	}
	return;
}
