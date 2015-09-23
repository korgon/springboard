// autocomplete extensions
// object extension for module (mod.js)
// used to de-cluter the mod.js file
// separates out module specific functions

// required packages
var fs = require('fs-extra');

(function() {

  var install = function() {
    try {
      fs.copySync(this.template_dir + '/core', this.directory + '/core');
      fs.copySync(this.template_dir + '/themes/default', this.directory + '/themes/default');
      // rename the json config file for the module to the new name
      var config_file = this.template_dir + '/.' + this.type + '.json';
      var new_config_file = this.directory + '/.' + this.name + '.json';

      fs.copySync(config_file, new_config_file);
    } catch(error) {
      console.error(error);
    }
  }

  var compile = function() {
    console.log('compiling autocomplete from extension...');
  }

  module.exports = {
    install: install,
    compile: compile
  }
})();
