// init options

SearchSpring.initOptions = SearchSpring.jQuery.extend(true, {}, SearchSpring.initDefaults, {
  results_per_page: '12',
  // insert common init options here
  afterResultsChange: function() {
    var $$ = SearchSpring.jQuery;
    if (!SearchSpring.Integration.loaded) {
      SearchSpring.Integration.once();
      // insert do once code here
    }
  },
});

// do things prior to catalog initialization
(function($$) {
  // for example build/add background filters
  // or modify DOM of site in some way (inject containers?)

  // ex:
  // if ($$('.searchspring.results_container').hasClass('category')) {
  //   SearchSpring.initOptions['backgroundFilter'] = { category: 'coding' };
  // }
})(SearchSpring.jQuery);
