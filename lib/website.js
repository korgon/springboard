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
	"modules":     [
  	{
  		"name": "sssider",
  		"version": "1.0.1"
  	}
  ]
}

*/

// privates
var config_file = 'website.json';
var exportoptions = ['name', 'siteid', 'status', 'cart', 'modules']

// construction
module.exports = website;
function website(options) {
	this.valid = true;
	this.getConfig();
	for (var key in options) {
		this[key] = options[key];	
	}
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
	var options = {};
	// fill options with each exportoption
	for (let i of arr) {
		options[i] = this[i];
	}
	try {
		var json_options = JSON.stringify(options, null, 4);
		fs.writeFileSync(this.folder + config_file, json_options);
	}
	catch(err) {
		console.error('failed to write website config: ', err);
	}
	return;
}
