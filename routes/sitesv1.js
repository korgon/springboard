// springboard
// api for mockups not restful... just whatever is needed

/*
/api/v1/
------------------
GET   api/sites/all
GET   api/sites/{{ name }}
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
        this.response.type = 'json';
        this.response.body = { error: name + ' not found', loaded: 'false' };
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
        this.response.body = { site: name, error: name + ' not found', loaded: 'false' };
      }
    },

    push: function*() {
      try {
        var data = yield springboard.pushSite(this.params.site);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = { site: name, error: name + ' could not be pushed' };
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
      }

      // check to make sure inputs are valid
      if (!newsite.name.match(/.*\..+/i)) {
        this.response.status = 400;
        this.response.body = { error: 'invalid sitename' };
      }
      if (!newsite.siteid.match(/[a-z0-9]{6}/i)) {
        this.response.status = 400;
        this.response.body = { error: 'invalid siteid' };
      }

      try {
        var site = yield springboard.newSite(newsite);
        this.response.body = site;
      }
      catch(err) {
        console.log(err);
        this.response.status = 400;
        this.response.body = { error: 'an error occured during site creation' };
      }
    }
  };
};
