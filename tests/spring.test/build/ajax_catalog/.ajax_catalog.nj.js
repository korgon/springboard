/*global SearchSpring */

// !!! WARNING !!!
// !!! THIS FILE WILL BE OVERWRITTEN AUTOMATICALLY !!!
// !!! DO NOT MODIFY
// automated by springboard
// modules prepended to this file
// init_options appended to this file

// default init options
if(typeof(SearchSpring.initDefaults) !== 'object') {
  SearchSpring.initDefaults = {
    results_per_page : '3',
    siteId : '{{ siteid }}',
    css : '{{ siteid }}',
  }
}

// integration functions for loading modules
if(typeof(SearchSpring.Integration) !== 'object') {
  SearchSpring.Integration = {
    loaded: false,
    css: function() {
      // insert css (not from SMC)
      var head = document.getElementsByTagName('head')[0];
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.type = 'text/css';
      css.href = '{{ css }}';
      head.appendChild(css);
    },
    once: function() {
      this.loaded = true;
      console.log('calling once...');
      // loop through modules; run their initOnce functions (if exist)
      this.doOnce();
    },
    doOnce: function() {
      // reserved for post-integration accessibility
    },
    always: function() {
      console.log('calling every time...');
      // loop through modules; run their initAlways functions (if exist)
      this.doAlways();
    },
    doAlways: function() {
      // reserved for post-integration accessibility
    },
  }
}

// get css
SearchSpring.Integration.css();
