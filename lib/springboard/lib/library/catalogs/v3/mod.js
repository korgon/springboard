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
		install(state),
		loadThemes(state),
    changeTheme(state)
	)
}

// initialization
var init = (state) => {
  console.log('excellent!');

  // load themes
  loadThemes(state).loadThemes();
}

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
        var source_config_file = state.directory + '/.' + state.name + '.json'
        var new_config_file = install_dir + '/.' + details.name + '.json';

        fs.mkdirSync(install_dir);
        fs.writeFileSync(new_config_file, fs.readFileSync(source_config_file));

        // install theme
        if (details.theme && state.themes[details.theme]) {
          state.themes[details.theme].install({ directory: install_dir });
        }
      } else {
        // directory already exists...
        console.log('NOT GONNA INSTALL MODULE!');
      }
    }
  }
});

// change theme
var changeTheme = (state) => ({
  changeTheme: (name) => {
    if (state.themes[name]) {

    }
  }
})

module.exports = function(name, directory) {
	console.log('loading module from ', directory);

	let data = common.getObject(name, directory);

	if (data && data.type) {
		return mod(name, directory, data);
	} else {
		return;
	}
}
