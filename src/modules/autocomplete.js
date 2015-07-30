// autocomplete extensions
// object extension for module (mod.js)
// used to de-cluter the mod.js file
// separates out module specific functions

(function() {

  var compile = function() {
    console.log('compiling autocomplete from extension...');
  }

  module.exports = {
    compile: compile
  }
})()
