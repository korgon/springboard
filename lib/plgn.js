// plugin "class"
// manage plugins
// plugins are managed by the module that they belong to
// each plugin is based on json object in filesystem
// (within the module that they belong to)


// strictness!
"use strict";

/* ideas

load module tree library from springboard-modules directory
use json files to grow tree, use this object for reference (installation)

load module trees per site on site load (load plugins per module also)

/*

json
object prototype example
{
  "name": "slideout",
  "version": "1.1.1",
  "enabled": false,
  "requires_module": ["ajax_catalog"],
	"requires_plugin": [],
  "description": "slide out facet container for responsive sites",
  "script": "slideout.js",
  "scss": "_slideout.scss",
  "variables": {
    "hideOnClick": {
      "value": true,
      "type": "boolean",
      "description": "hide the slideout when a facet option is clicked"
    },
    "respondAt": {
      "value": 999999,
      "type": "integer",
      "description": "display slideout at this width (px)"
    },
    "speed": {
      "value": 666,
      "type": "integer",
      "description": "speed to hide slideout container (ms)"
    },
    "width": {
      "value": 333,
      "type": "integer",
      "description": "width of slideout container (px)"
    }
  }
}
additional attributes only used for springboard at runtime:
{
	"directory": "",			// location of plugin relative to springboard
	"valid": true					// used to validate module
}
*/

// the object properties that should be written to file (modname.json)
var export_options = ['name', 'version', 'enabled', 'requires_module', 'requires_plugin', 'description', 'script', 'scss', 'variables'];

// include packages
var fs = require('fs-extra');
// templating
var nja = require('nunjucks');

// construction
module.exports = plgn;
function plgn(options) {
	this.valid = true;

	for (var key in options) {
		this[key] = options[key];
	}

	if (this.id !== undefined) {
		this.loadConfig();
	}
	else {

	}
}

// * * * * * * * * * * * */
//   public functions   */
// * * * * * * * * * * */


// build plugin
// render variables template
// concat scss_variable with scss
// concat js_variables with js

plgn.prototype.build = function() {
}

// change variables
plgn.prototype.modifyVariables = function() {
}

// get configuration from json
// eventually store all json files in database
plgn.prototype.loadConfig = function() {
	//var thissite = this;
	// check for config file and read it
	if (fs.existsSync(this.directory + '/.' + this.id + '.json')) {
		try {
			// add config.json properties to site
			var config = JSON.parse(fs.readFileSync(this.directory + '/.' + this.id + '.json'));
			for (var key in config) {
				this[key] = config[key];
			}
			if (this.version === undefined) this.valid = false;
			// check for valid options
			// verify that modules are loaded and configured
			// TBD
		} catch(err) {
			this.valid = false;
			var msg = this.id + '@' + this.directory;
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
plgn.prototype.saveConfig = function() {
	var options = {};
	// fill options with each export option
	for (let i of export_options) {
		if (this[i] === undefined)
			continue;
		options[i] = this[i];
	}
	try {
		var json_options = JSON.stringify(options, null, 4);
		fs.writeFileSync(this.directory + '/.' + this.id + '.json', json_options);
	}
	catch(err) {
		console.error('failed to write module config: ');
		console.error(err);
	}
	return;
}
