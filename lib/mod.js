// module "class"
// manage module folder in CORE branch
// modules are version specific
// each module is based on json object in filesystem

// strictness!
"use strict";

/*
json
object prototype example
{
  "name": "slideout",
  "version": "1.1.1",
  "description": "slide out facet container for responsive sites",
  "script": "slideout.js",
  "scss": "_slideout.scss",
  "variables": [
    "hideOnClick": {
      "type": "boolean",
      "for": "js",
      "description": "hide the slideout when a facet option is clicked"
    },
    "respondAt": {
      "type": "integer",
      "for": "both",
      "description": "display slideout at this width (px)"
    },
    "speed": {
      "type": "integer",
      "for": "scss",
      "description": "speed to hide slideout container (ms)"
    },
    "width": {
      "type": "integer",
      "for": "scss",
      "description": "width of slideout container (px)"
    }
  ]
}
additional attributes only used for springboard at runtime:
{
	"directory": "",			// location of module relative to springboard
	"valid": true					// used to validate module
}
*/

// the object properties that should be written to file (modname.json)
var export_options = ['name', 'version', 'description', 'script', 'scss', 'variables'];

// include packages
var fs = require('fs-extra');

// construction
module.exports = mod;
function mod(options) {
	this.valid = true;

	for (var key in options) {
		this[key] = options[key];
	}

	// check if new module creation if so saveConfig
	if (this.version === undefined) {
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
mod.prototype.getConfig = function() {
	//var thissite = this;
	// check for config file and read it
	if (fs.existsSync(this.directory + '/.' + this.name + '.json')) {
		try {
			// add config.json properties to site
			var config = JSON.parse(fs.readFileSync(this.directory + '/.' + this.name + '.json'));
			for (var key in config) {
				this[key] = config[key];
			}
			if (this.version === undefined) this.valid = false;
			// check for valid options
			// verify that modules are loaded and configured
			// TBD
		} catch(err) {
			this.valid = false;
			var msg = this.name + '@' + this.directory;
			var errmsg = 'invalid json: ' + err.message;
			console.log(msg.red)
			console.error(errmsg.red);
		}
	}
	else {
		this.valid = false;
	}
	return;
}

// save configuration to json
mod.prototype.saveConfig = function() {
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
		console.error('failed to write module config: ');
		console.error(err);
	}
	return;
}
