// extend the mod objects with different functions
// currently extending these functions:
//              compile()


(function() {

  // include different modules
  var modules = {}
  modules.ajax_catalog = require('./ajax_catalog.js');
  modules.autocomplete = require('./autocomplete.js');

  var extend = function(mod) {
    if (modules[mod.type] && typeof(modules[mod.type].compile) === 'function') {
      mod.compile = modules[mod.type].compile;
    }
  }

  module.exports = {
    extend: extend
  }

})()
