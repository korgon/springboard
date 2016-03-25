// ajax v3 catalog theme methods

"use strict";

var fs = require('fs');
var common = require('./common.js');
const variables = common.variables;

// theme factory
var thm = (name, directory, data) => {
	let state = {
		name,
		directory,
		data
	}

	return Object.assign(
		{},
		install(state)
	)
}

var install = (state) => ({
  install: (details) => {
    if (details) {
      if (fs.existsSync(details.directory) && !fs.existsSync(details.directory + '/' + state.name )) {
        console.log('copying data from ' + state.directory + ' to ' + details.directory);
        common.copy(state.directory, details.directory);
      } else {
        // directory already exists...
        console.log('NOT GONNA INSTALL THEME!');
      }
    }
  }
})

module.exports = function(name, directory) {
	console.log('loading module from ', directory);

	let data = common.getObject(name, directory);

	if (data && data.type) {
		return thm(name, directory, data);
	} else {
		return;
	}
}
