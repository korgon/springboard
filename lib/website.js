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
	"cart": "bigcommerce",
	"is": "adria",
  "html_files":
  [
  	{
  		"label": "mockup",
  		"file": "mockup.html"
  	}
  ],
	"modules":     [
  	{
  		"name": "sssider",
  		"version": "1.0.1"
  	}
  ]
}

*/

// include packages
var co = require('co');
var fs = require('mz/fs');

// privates
var config_file = 'config.json';


// construction
module.exports = website;
function website(site_location) {
	this.valid = true;
	this.folder = site_location;
	this.getConfig();
}

// * * * * * * * * * * * */
//   public functions   */
// * * * * * * * * * * */

// get configuration from json
website.prototype.getConfig = function() {
	//var thissite = this;
	// check for config file and read it
	if (fs.existsSync(this.folder + config_file)) {
		try {
			// add config.json properties to site
			var config = JSON.parse(fs.readFileSync(this.folder + config_file));
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
	/* TBD
	console.log(this.folder);
	// check for config file and read it
	if (fs.existsSync(this.folder + config_file)) {
		console.log('config file exists!');
		try {
			this.options = JSON.parse(fs.readFileSync(this.folder + config_file));
			// check for valid options
			// TBD
		} catch(err) {
			console.error(err);
		}
	}
	else {
		ssdeal(new Error('boom'));
	}
	return;
	*/
}
