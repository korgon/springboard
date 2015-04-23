// equalize v1.0.1 | 3/25/2015
//
// for equalizing items in results

// slideout module
(function($$) {
  $$.extend(SearchSpring.Modules, {

    // name of module
    equalize: {

      init: function(init_options) {
        // add the function to jQuery
        $$.fn.equalizeHeights = function () {
      		return this.height(Math.max.apply(this, this.map(function () {
    				return $$(this).outerHeight(true);
      		})));
        };
      },

      run: function($$items, divs) {
        var top, rowcnt;
        // determine the number of products per row using the first row only.
        $$items.each(function() {
          if ($$(this).index() === 0)
            top = $$(this).offset().top;
          else {
            if ($$(this).offset().top != top) {
              rowcnt = $$(this).index();
              return false;
            }
          }
        });
        // equalize divs
        for (var i = 0; i < $$items.length; i = i + rowcnt) {
          for (var j = 0; j < divs.length; j++) {
            var sliceto = i + rowcnt;
            $$items.slice(i, sliceto).find(divs[j]).equalizeHeights();
          }
        }
      }
    }
  });
})(SearchSpring.jQuery);
