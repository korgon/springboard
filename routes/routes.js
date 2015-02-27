// springboard
// http service

var view_dir = __dirname + '/views/';

// must pass in the springboard dependency
module.exports = function(springboard) {
  return {
    index: function*() {
      var sites = springboard.getSites();
      var site = springboard.getSite();
      if (site.valid != true)
        site = '';
      this.body = 'awwyiss' + site;
    }
  };
};
