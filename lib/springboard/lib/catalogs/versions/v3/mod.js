// ajax v3 catalog module methods

"use strict";

var fs = require('fs');

var thm = require('./thm.js');
var common = require('./common.js');
const variables = common.variables;

// module factory
var mod = (name, directory, data) => {
	let state = {
		name,
		directory,
		data,
		themes: {}
	}

	init(state);

	return Object.assign(
		{},
		{ themes: state.themes,
			directory: state.directory
		},
		getData(state),
		install(state),
		loadThemes(state),
		reloadThemes(state),
		setTheme(state),
		update(state)
	)
}

// initialization
var init = (state) => {
	// load themes
	loadThemes(state).loadThemes();
}

var reloadThemes = (state) => ({
	reloadThemes: () => {
		// empty module objects (to start fresh)
		for (var thm in state.themes) delete state.themes[thm];
		// load modules
		loadThemes(state).loadThemes();
	}
});

var loadThemes = (state) => ({
	loadThemes: () => {
		console.log()
		console.log('loading ' + state.name + ' themes from: ' + state.directory);

		try {
			var folders = fs.readdirSync(state.directory);
		}
		catch(err) {
			console.error(err);
		}

		for (var folder of folders) {
			// ignore non directories... or hidden folders (^.*)
			var theme_dir = state.directory + '/' + folder;

			if (!fs.lstatSync(theme_dir).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop

			console.log('found a theme: ', theme_dir);

			// add the theme if it does not already exist
			if (!state.themes[folder]) state.themes[folder] = thm(folder, theme_dir);

			// remove the theme if it is empty (bad config)
			if (!state.themes[folder]) delete state.themes[folder];
		}
	}
});

var getData = (state) => ({
	getData: () => {
		var themes = {};

		for (let thm in state.themes) {
			themes[thm] = state.themes[thm].getData();
		}
		return Object.assign(
			{},
			{ themes: themes },
			state.data
		);
	}
});

// install module!
var install = (state) => ({
	install: (details) => {
		if (details) {
			var modules_dir = details.directory + '/' + variables.MODULE_DIR;
			if (!fs.existsSync(modules_dir)) {
				fs.mkdirSync(modules_dir);
			}
			var install_dir = modules_dir + '/' + details.name;
			if (fs.existsSync(details.directory) && !fs.existsSync(install_dir)) {
				console.log('installing module to ' + details.directory);
				var config = common.getObject(state.name, state.directory);
				config.created = new Date().getTime();

				fs.mkdirSync(install_dir);

				// install theme
				if (config.theme === null && details.theme && state.themes[details.theme]) {
					state.themes[details.theme].install({ directory: install_dir });
					config.theme = details.theme;
				}

				// save data object
				common.putObject(details.name, install_dir, config);

			} else {
				// directory already exists...
				console.log('NOT GONNA INSTALL MODULE!');
			}
		}
	}
});

// change theme
var setTheme = (state) => ({
	setTheme: (name) => {
		if (state.themes[name]) {
			state.themes[name].makeDefault();
			state.data.theme = name;
			save(state);
		}
	}
});

var update = (state) => ({
	update: (details) => {
		if (details) {
			if (common.compareKeys(state.data, details)) {
				state.data = details;
				save(state);
			}
		}
	}
});

var save = (state) => {
	common.putObject(state.name, state.directory, state.data);
}

module.exports = function(name, directory) {
	console.log('loading module from ', directory);

	let data = common.getObject(name, directory);

	if (data && data.type) {
		return mod(name, directory, data);
	} else {
		return;
	}
}
