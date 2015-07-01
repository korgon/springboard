// module "class"
// various compile functions

// strictness!
"use strict";

module.exports = {
  ajax_catalog: function () {
    console.log('ajax compile yo!');
  },
  autocomplete: function () {
    console.log('autocomplete compile yo!');
		this.render();
  }
};
