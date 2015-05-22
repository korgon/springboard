// slideout plugin [ajax_catalog]
// facet container slide out for mobile

// v1.1.0 | 05/21/2015
// altered to import varialbe sheet
// modified for springboard

(function($$) {
  $$.extend(SearchSpring.Catalog.Plugins, {

    // name of module
    Slideout: {

      initOnce: function(init_options) {
        // pass in width to respond at
        // if no width it will always be active (999999)

        var options = {
          hideOnClick: true,
          respondAt: 999999
        }

        $$.extend(options, init_options);

        // create responsive slide out and buttons...
        var slideout_container = ' \
        <div id="searchspring-slideout_container"> \
          <div class="searchspring-slideout_button"> \
            <a></a> \
          </div> \
        </div> \
        <div class="searchspring-overlay"></div>';
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
          if ($$(window).width() <= options.respondAt ) {
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
