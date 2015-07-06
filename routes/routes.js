// springboard
// http service

jade = require('jade');

var view_dir = __dirname + '/../views/';

// must pass in the springboard dependency
module.exports = function(springboard) {
  return {
    editor: function*() {
      var sites = springboard.getSites();
      var site = springboard.watching();
      // redirect if no sites
      if (Object.keys(sites).length == 0 || site.name === undefined) {
        this.status = 307;
        this.redirect('/sites');
        this.body = 'Redirecting to sites. There is no site to edit...';
        return;
      }
      this.body = jade.renderFile(view_dir + 'editor.jade', {pretty:true, sites: sites, site: site});
    },
    editSite: function*() {
      var site = springboard.watching();
      if (site.default_html) {
        this.redirect('/sites/' + site.name + '/' + site.default_html);
      } else {
        this.body = jade.renderFile(view_dir + 'edit_site.jade', {pretty:true, site: site});
      }
    },
    gallery: function*() {
      var sites = springboard.getSites();
      this.body = jade.renderFile(view_dir + 'gallery.jade', {pretty:true, sites: sites});
    },
    angular: function*() {
      this.body = jade.renderFile(view_dir + 'angular.jade');
    }
  };
};
