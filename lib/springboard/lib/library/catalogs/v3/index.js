// ajax v3 catalog methods

var fs = require('fs');

var mod = require('./mod.js');


// initialization
var init = (state) => {
  console.log('excellent!');

  // load modules
  loadModules(state).loadModules();
}

// extensions
var compile = (state) => ({
	compile: () => {
    console.log('compiling ' + state.name);
  }
});

var install = (state) => ({
	install: (details) => {
    console.log('installing ' + state.name + ' to ' + details.directory);
  }
});

var loadModules = (state) => ({
	loadModules: () => {
    console.log()
    console.log('loading ' + state.name + ' modules from: ' + state.module_directory);

    try {
      var folders = fs.readdirSync(state.module_directory);
    }
    catch(err) {
      console.error(err);
    }

    for (var folder of folders) {
      // ignore non directories... or hidden folders (^.*)
      var module_dir = state.module_directory + '/' + folder;

      if (!fs.lstatSync(module_dir).isDirectory() || folder.match(/^\./)) continue;	// drop out of loop

      console.log('found a module: ', module_dir);
      state.modules[folder] = mod(folder, module_dir);

      if (!state.modules[folder]) delete state.modules[folder];

    }
  }
});

module.exports = {
  compile: compile,
  init: init,
  install: install,
  loadModules: loadModules
}
