//
var head = document.getElementsByTagName('head')[0];
var css = document.createElement('link');
css.rel = 'stylesheet';
css.type = 'text/css';
css.href = '{{ css }}';
head.appendChild(css);

// initialize autocomplete
SearchSpring.Autocomplete.init({
  siteId: '{{ siteid }}',
  queryClass: 'searchspring-query',
  modifyDisplay: function() {
    jQuery('#searchspring-autocomplete_results').css('width', jQuery('#SearchForm').width());
  }
});
