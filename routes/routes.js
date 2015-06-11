// springboard
// http service

var jade = require('jade');

var view_dir = __dirname + '/../views/';

// must pass in the springboard dependency
module.exports = function(springboard) {
  return {
    editor: function*() {
      var site = springboard.watching();
      var sites = springboard.getSites();
      // redirect if no sites
      if (Object.keys(sites).length == 0 || site === undefined) {
        this.status = 307;
        this.redirect('/sites');
        this.body = 'Redirecting to sites. There is no site to edit...';
        return;
      }
      this.body = jade.renderFile(view_dir + 'editor.jade', {pretty:true, sites: sites, site: site});
    },
    gallery: function*() {
      var site = springboard.watching();
      var sites = springboard.getSites();
      this.body = jade.renderFile(view_dir + 'gallery.jade', {pretty:true, sites: sites});
    }
  };
};
