// ajax v3 catalog module methods

"use strict";

var fs = require('fs');

var thm = require('./thm.js');

// module factory
var mod = (name, directory, data) => {
	let state = {
		name,
		directory,
		data,
		themes: {}
	}

	init(state);

	//types[state.type].init(state);

	return Object.assign(
		{},
    { themes: state.themes,
      directory: state.directory
    },
		install(state),
		loadThemes(state)
	)
}

// initialization
var init = (state) => {
  console.log('excellent!');

  // load themes
  loadThemes(state).loadThemes();
}

var getObject = (name, directory) => {
	// check for config file and read it
	if (fs.existsSync(directory + '/.' + name + '.json')) {
		try {
			var config = JSON.parse(fs.readFileSync(directory + '/.' + name + '.json'));
		} catch(err) {
			console.error(err);
		}
	}

	return config;
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
      state.themes[folder] = thm(folder, theme_dir);

      if (!state.themes[folder]) delete state.themes[folder];
    }
  }
});

var install = (state) => ({
  install: () => {

  }
})

module.exports = function(name, directory) {
	console.log('loading module from ', directory);

	let data = getObject(name, directory);

	if (data && data.type) {
		return mod(name, directory, data);
	} else {
		return;
	}
}
