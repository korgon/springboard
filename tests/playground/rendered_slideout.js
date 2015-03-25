// sssider v1.1.1 | 12/15/2014
//
// This script creates the slide out facet container for responsive designs
// v1.1.1 added an overlay to hide the sider when the user clicks anywhere that isn't the flyout
// See beadandreel.com/beadandreel.com.js for example usage of this module

// slideout module
(function($$) {
  $$.extend(SearchSpring.Modules, {

    // name of module
    slideout: {

      initOnce: function(init_options) {
        // pass in width to respond at
        // if no width it will always be active

        var options = {
          hideOnClick: false,
          width: 600
        }

        $$.extend(options, init_options);

        // create responsive slide out and buttons...
        var slideout_container = ' \
        <div id="searchspring-slideout_container"> \
          <div class="searchspring-slideout_button"> \
            <a></a> \
          </div> \
        </div> \
        <div class="searchspring-overlay"></div>')
        $$(container).appendTo($$('body'));

        var slideout_button = ' \
        <div class="searchspring-slideout_button"> \
          <span class="searchspring-slideout_button_icon"></span> \
          <span class="searchspring-slideout_button_text">Filter Options</span> \
        </div>';
        $$(slideout_button).prependTo($$('#searchspring-options'));

        $$('.searchspring-slideout_button, .searchspring-overlay').click(toggleSlider);

        if (options.hideOnClick) {
          $$('#searchspring-slideout_container .option_link, #searchspring-slideout_container #searchspring-summary li').click(sssider_toggleSider);
        }

        checkMobile();
        $$(window).resize(checkMobile);

        function checkMobile() {
          if ($$(window).width() <= options.width ) {
            $$('#searchspring-sidebar').detach().appendTo('#searchspring-slideout_container');
          } else {
            $$('#searchspring-sidebar').detach().appendTo('.searchspring-facets_container');
            $$('#searchspring-slideout_container, .searchspring-overlay').removeClass('show');
          }
        }

        function toggleSlider() {
          $$('#searchspring-slideout_container, .searchspring-overlay').toggleClass('show');
        }
      }
    }
  });
})(SearchSpring.jQuery);
