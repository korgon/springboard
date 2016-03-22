// ajax v3 extensions
// object extension for module (mod.js)
// used to de-cluter the mod.js file
// separates out module specific functions

(function() {

  var install = function() {
    console.log('installing v3 catalog from extension...');
  }

  var compile = function() {
    console.log('compiling v3 catalog from extension...');
  }

  module.exports = {
    install: install,
    compile: compile
  }
})();
