// springboard
// http service

jade = require('jade');

var view_dir = __dirname + '/../views/';

// must pass in the springboard dependency
module.exports = function(springboard) {
  return {
    index: function*() {
      var sites = springboard.getSites();
      var site = springboard.getSite();

      if (site.valid != true) {
        site = { name: "error", siteid: "000000"};
      }
      this.body = jade.renderFile(view_dir + 'index.jade', {pretty:true, sites: sites, site: site});
    },
    gallery: function*() {
      var sites = springboard.getSites();
      this.body = jade.renderFile(view_dir + 'gallery.jade', {pretty:true, sites: sites});
    }
  };
};
