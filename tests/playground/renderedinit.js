// init options
SearchSpring.initOptions = {
  results_per_page : '33',
  siteId : 'ninjah',
  css : 'ninjah',
  afterResultsChange: function() {
    var $$ = SearchSpring.jQuery;
    if (!SearchSpring.Integration.loaded) {
      //  //
      SearchSpring.Integration.loaded = true;
      SearchSpring.Integration.once();

      // insert do once code here
    }
    //  //
    SearchSpring.Integration.always();

    // insert code to run on every results change here
  }
};
