// module "class"
// various compile functions

// strictness!
"use strict";

module.exports = {
  ajax_catalog: function () {
    console.log('ajax compile yo!');
		console.log(this.plugins);
  },
  autocomplete: function () {
    console.log('autocomplete compile yo!');
  }
};
