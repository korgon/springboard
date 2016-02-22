// springboard
// api for mockups
// not restful... just whatever is needed is GETed and POSTed

/*
/api/v1/
------------------
/api/sites
/api/site
/api/site/edit
/api/site/commit
/api/site/push
/api/site/reset




*/

//var parse = require('co-body');

// must pass in the springboard dependency
module.exports = function(springboard) {
  return {

    // get every site in object notation
    sites: function*() {
      this.response.type = 'json';
      this.response.body = springboard.getSites();
    },

    // stop editing and load sites
    loadSites: function*() {
      var ignore = this.params.ignore;
      try {
        var data = yield springboard.loadSites((ignore) ? true : false);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = err;
      }
    },

    // get the current site or a specific one
    site: function*() {
      var data = springboard.getSite(this.params.site);
      this.response.type = 'json';
      this.response.body = data;
    },

    // determine which site to edit
    // runs the editSite function that triggers watches of js/scss/html
    edit: function*() {
      try {
        var site = springboard.getSite(this.params.site);
        if (site.error) {
          throw("Site is invalid");
        } else {
           var data = yield springboard.editSite(site.name);
           this.response.type = 'json';
           this.response.body = data;
         }
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = { error: true, message: 'could not edit ' + this.params.site };
      }
    },

    publishMockup: function*() {
      try {
        var data = yield springboard.publishSiteMockup();
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = { error: true, message: 'site could not be published' };
      }
    },

    publishLive: function*() {
      try {
        var data = yield springboard.publishSiteMockup();
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = { error: true, message: 'site could not be published' };
      }
    },

    status: function*() {
      try {
        var data = yield springboard.gitStatus();
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = { error: true, message: 'site git status undetermined' };
      }
    },

    // commit the current site
    commit: function*() {
      var message = this.request.body.fields.message || '';
      if (message.trim() == '') message = false;

      try {
        var data = yield springboard.commitSite(message);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = err;
      }
    },

    // push the current site
    push: function*() {
      try {
        var data = yield springboard.pushSite();
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = err;
      }
    },

    // reset the current site
    reset: function*() {
      try {
        var data = yield springboard.resetSite();
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = err;
      }
    },

    // pull: function*() {
    //   try {
    //     var data = yield springboard.pullSite();
    //     this.response.type = 'json';
    //     this.response.body = data;
    //   }
    //   catch(err) {
    //     console.log(err);
    //     this.response.type = 'json';
    //     this.response.body = { error: true, message: 'site could not be pushed' };
    //   }
    // },

    merge: function*() {
      try {
        // var data = yield springboard.mergeSite();
        var data = { error: false, message: 'not really merged dude...' };
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { error: true, message: 'site could not be merged' };
      }
    },

    // installModule: function*() {
    //   this.response.type = 'json';
    //   console.log('checking for valid module...');
    //   console.log(springboard.modules);
    //
    //   // check if module name is directory name friendly
    //   if (!newsite.module_name.match(/^[^\.][a-z0-9\-_\.]+$/i)) {
    //     this.response.status = 400;
    //     this.response.body = { error: true, message: 'invalid module name' };
    //     return;
    //   }
    // },

    // add new site
    create: function*() {
      this.response.type = 'json';
      var newsite = this.request.body.fields;
      if (!newsite.name || !newsite.siteid || !newsite.cart) {
        this.response.status = 400;
        this.response.body = { error: true, message: 'missing required fields' };
        return;
      }

      // purify all things
      newsite.name = newsite.name.toLowerCase();
      newsite.siteid = newsite.siteid.toLowerCase();
      newsite.cart = newsite.cart.toLowerCase();

      // check if domain name format (example.com)
      if (!newsite.name.match(/^[^\_\.]\w+\.\w{2,}$/i)) {
        this.response.status = 400;
        this.response.body = { error: true, message: 'invalid sitename' };
        return;
      }
      // check if exactly 6 characters, number or letter (siteid)
      if (!newsite.siteid.match(/^[a-z0-9]{6}$/i)) {
        this.response.status = 400;
        this.response.body = { error: true, message: 'invalid siteid' };
        return;
      }

      try {
        var site = yield springboard.addSite(newsite);
        //var site = { error: false, message: 'site created success!' };
      }
      catch(err) {
        this.response.status = 400;
        this.response.body = { error: true, message: err.message };
        return;
      }

      this.response.body = site;
    },

    update: function*() {
      this.response.type = 'json';
      var changes = this.request.body.fields;
      springboard.updateSite(changes);
      this.response.body = springboard.getSite();
    },


    // UIs, modules and themes
    uis: function*() {
      this.response.type = 'json';
      this.response.body = springboard.getUIs();
    },

    install: function*() {
      this.response.type = 'json';

      var info = this.request.body.fields;

      if (info.install == 'module') {
        var illegal_names = ['css', 'js', 'scss', 'sass', 'html', 'img', 'image', 'images', 'build', 'module', 'modules', 'theme', 'themes', 'plugin', 'plugins'];
        if (info.name) {
          info.name = info.name.toLowerCase();
          if (illegal_names.indexOf(info.name) >= 0 || !info.name.match(/^\w{3,}$/)) {
            this.response.body = { error: true, message: 'Invalid module name!' };
            return;
          }
        } else {
          this.response.body = { error: true, message: 'Module name is required!' };
          return;
        }
      } else if (info.install == 'plugin') {
        info.module = info.module.toLowerCase();
        info.plugin = info.plugin.toLowerCase();
      } else if (info.install == 'theme') {
        info.module = info.module.toLowerCase();
        info.theme = info.theme.toLowerCase();
      }
      var data = yield springboard.install(info);
      this.response.body = data;
    }

  };
};
