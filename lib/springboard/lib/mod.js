// module "class"
// manage modules
// each module is based on json object in filesystem
// modules compile uniquely, render/concat/build
// handle plugins and their rendering with templates
// render plugins and compile them by requirements

// strictness!
"use strict";

/*

new functions to write:
render js
render scss


build folder (for parts of final js file)
* hidden files used as templates !should not be edited
* json files also hidden, parts editable in springboard

* visible editable files for edit by IS
|-	ex: init_options.js


order of concat:
1. modules (modules/*.js)
	a. standalone modules
		i. module dependents

// files

js folder (for assembled js files)
* created by concat
* minified for live on s3, non-minified for mockup and local

//

install module:

install steps
* create module folder inside of build folder (if it does not exist) copy config file into modules folder
* copy js and/or scss files into respective site folders (build, scss)
* append scss include to module scss folder

*/

/*
json
object prototype example
{
  "name": "AJAX Catalog",
  "version": "1.0.0",
  "enabled": false,
  "description": "searchspring ajax catalog",
  "script": "ajax_catalog.js",
  "theme": "none",
  "variables": {
  }
}
additional attributes only used for springboard at runtime:
{
	"directory": "",			// location of module relative to springboard
	"valid": true					// used to validate module
}
*/

// the object properties that should be written to file (modname.json)
var export_options = ['name', 'siteid', 'version', 'enabled', 'description', 'script', 'variables', 'theme'];

// include packages
var fs = require('fs-extra');
// templating
var nja = require('nunjucks');

// sub classes (themes and plugins)
var plgn = require('./plgn');
var thm = require('./thm');

// module specific extensions
var types = require('./modules/');

// construction
// options initially only contain module folder name and directory (or new flag options.new)
// usually named modulename.json
module.exports = mod;
function mod(options) {
	this.valid = true;

	// add new properties from the options
	for (var key in options) {
		this[key] = options[key];
	}

	if (!this.new) {
		this.loadConfig();
	}

	// based on the module type, extend the object with new functions
	// module specific functions (install, compile)
	types.extend(this);

	// installaltion of new module using module specific function
	if (this.new) {
		this.install();
		this.loadConfig();
	}

	if (this.valid) {
		// create spaces
		this.themes = {};
		this.plugins = {};

		// install default theme
		if (this.new) {
			this.installTheme({ theme: 'default', template_dir: this.template_dir });
		}

		this.loadThemes();
		this.loadPlugins();
	}
}

/*	_________________	*\
//										\\
//	 public methods 	\\
//	_________________	\\
\*										*/

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

// get configuration from json
// eventually store all json files in database
mod.prototype.loadConfig = function() {

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
}

// load plugins
mod.prototype.loadPlugins = function() {
	var plugins_dir = this.directory + '/plugins';
	if (fs.existsSync(plugins_dir)	) {
		try {
			var folders = fs.readdirSync(plugins_dir);
		}
		catch(err) {
			console.error(err);
		}
		// first empty plugins object (to start fresh)
		for (var del in this.plugins) delete this.plugins[del];

		// load up the plugins
		for (var folder of folders) {
			// ignore non directories... or hidden folders (^.*)
			if (!fs.lstatSync(plugins_dir + '/' + folder).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop
			// read plugins directories
			try {
				var plugin_dir = plugins_dir + '/' + folder;
				this.plugins[folder] = new plgn({ id: folder, directory: plugin_dir });
			}
			catch(err) {
				console.error(err);
			}
		}
	}
}

// load themes
mod.prototype.loadThemes = function() {
	var themes_dir = this.directory + '/themes';
	if (fs.existsSync(themes_dir)	) {
		try {
			var folders = fs.readdirSync(themes_dir);
		}
		catch(err) {
			console.error(err);
		}
		// first empty plugins object (to start fresh)
		for (var del in this.themes) delete this.themes[del];

		// load up the plugins
		for (var folder of folders) {
			// ignore non directories... or hidden folders (^.*)
			if (!fs.lstatSync(themes_dir + '/' + folder).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop
			// read themes directories
			try {
				var theme_dir = themes_dir + '/' + folder;
				this.themes[folder] = new thm({ id: folder, directory: theme_dir });
			}
			catch(err) {
				console.error(err);
			}
		}
	}
}

// compile function for unknown module type
mod.prototype.install = function() {
	return { error: true, message: 'Module type is not supported!' };
}

// compile function for unknown module type
mod.prototype.compile = function() {
	return { error: true, message: 'Module type is not supported!' };
}

mod.prototype.installTheme = function(info) {
	var self = this;
	return new Promise(function(resolve, reject) {
		// check if theme already installed
		if (self.themes[info.theme]) {
			return reject({ error: true, message: 'Theme is already installed!' });
		} else {
			fs.copySync(info.template_dir + '/themes/' + info.theme, self.directory + '/themes/' + info.theme);
			var themes_dir = self.directory + '/themes';
			var theme_dir = themes_dir + '/' + info.theme;
			self.themes[info.theme] = new thm({ id: info.theme, directory: theme_dir });
			if (self.themes[info.theme].valid) {
				self.theme = info.theme;
				return resolve(true);
			} else {
				return reject({ error: true, message: 'Failed to install theme!' });
			}
		}
	});
}

mod.prototype.render = function (inputfile, outputfile, data) {
	// promisified
	return new Promise(function(resolve, reject) {
		if (fs.existsSync(inputfile)) {
			var filename = inputfile.replace(/^.*[\\\/]/, '');
			//console.log('rendering from ' + inputfile);
			var filestring = fs.readFileSync(inputfile).toString();
			nja.configure({ watch: false, autoescape: false });
			nja.renderString(filestring, data, function(err, result) {
				if (err) return reject(err);
				fs.writeFileSync(outputfile, result);
				return resolve(true);
			});
		} else {
			return reject(new Error(inputfile + ': file not found'));
		}
	});
}

// }
//
// function renderInitScript() {
// 	// site.css property determines live / mockup
// 	// promisified
// 		return new Promise(function(resolve, reject) {
// 			var build_dir = site.directory + '/build';
// 			var template_file = '.init.nj.js';
// 			var rendered_file = '.init.js';
// 			if (site.css === undefined) site.css = '/sites/' + site.name + '/css/' + site.name + '.css';
// 			var data = {
// 				siteid: site.siteid,
// 				css: site.css
// 			}
// 			// render init script
// 			render(build_dir + '/' + template_file, build_dir + '/' + rendered_file, data)
// 			.then(function() {
// 				return resolve(true);
// 			}).catch(function(err) {
// 				console.log(err);
// 				return reject(err);
// 			});
// 	});
// }
