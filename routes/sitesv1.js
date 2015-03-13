// springboard
// api for mockups not restful... just whatever is needed

/*
/api/v1/
------------------
GET   api/sites/all
GET   api/sites/{{ name }}
GET   api/sites/commit/{{ name }}
GET   api/sites/watch/{{ name }}
GET   api/sites/publish/{{ name }}
GET   api/sites/push/{{ name }}
GET   api/sites/sync
POST  api/sites/create
... add more ...
*/

//var parse = require('co-body');

// must pass in the springboard dependency
module.exports = function(springboard) {
  return {

    sites: function*() {
      this.response.type = 'json';
      this.response.body = springboard.getSites();
    },

    site: function*() {
      var data = springboard.getSite(this.params.site);
      this.response.type = 'json';
      this.response.body = data;
    },

    watch: function*() {
    // runs the watchSite function that triggers gulp watches of js/scss/html
      try {
        var data = yield springboard.watchSite(this.params.site);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { error: this.params.site + ' not found', loaded: 'false' };
      }
    },

    publish: function*() {
      try {
        var data = yield springboard.publishSite(this.params.site);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { site: this.params.site, error: this.params.site + ' not found', loaded: 'false' };
      }
    },

    commit: function*() {
      try {
        var data = yield springboard.commitSite(this.params.site);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { site: this.params.site, error: this.params.site + ' could not be commited' };
      }
    },

    pushit: function*() {
      try {
        var data = yield springboard.pushSite(this.params.site);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { site: this.params.site, error: this.params.site + ' could not be pushed' };
      }
    },

    sync: function*() {
      try {
        var data = yield springboard.updateSites();
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { error: 'failed to sync with repository', err: err, loaded: 'false' };
      }
    },

    create: function*() {
      this.response.type = 'json';
      // add new site
      var newsite = this.request.body.fields;
      if (!newsite.name || !newsite.siteid || !newsite.template) {
        this.response.status = 400;
        this.response.body = { error: 'missing required fields' };
        return;
      }

      // check to make sure inputs are valid
      if (!newsite.name.match(/.*\..+/i)) {
        this.response.status = 400;
        this.response.body = { error: 'invalid sitename' };
        return;
      }
      if (!newsite.siteid.match(/[a-z0-9]{6}/i)) {
        this.response.status = 400;
        this.response.body = { error: 'invalid siteid' };
        return;
      }

      try {
        var site = yield springboard.newSite(newsite);
      }
      catch(err) {
        console.log(err);
        this.response.status = 400;
        this.response.body = { error: 'an error occured during site creation' };
        return;
      }

      this.response.body = site;
    }
  };
};
