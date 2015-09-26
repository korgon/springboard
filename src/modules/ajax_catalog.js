// ajax_catalog extensions
// object extension for module (mod.js)
// used to de-cluter the mod.js file
// separates out module specific functions

(function() {

  var install = function() {
    console.log('installing ajax_catalog from extension...');
  }

  var compile = function() {
    console.log('compiling ajax_catalog from extension...');
  }

  module.exports = {
    
    compile: compile
  }
})()
