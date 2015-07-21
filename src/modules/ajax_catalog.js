// ajax_catalog extensions
// object extension for module
// used to de-cluter the mod.js file
// separates out module specific functions

(function() {

  var compile = function() {
    console.log(this.script);
    console.log('compiling ajax_catalog from extension...');
  }

  module.exports = {
    compile: compile
  }
})()
