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

var parse = require('co-body');

// must pass in the springboard dependency
module.exports = function(springboard) {
  return {

    sites: function*() {
      this.response.type = 'json';
      this.response.body = springboard.getSites();
    },

    site: function*(name) {
      var data = springboard.getSite(name);
      this.response.type = 'json';
      this.response.body = data;
    },

    watch: function*(name) {
    // runs the watchSite function that triggers gulp watches of js/scss/html
      try {
        var data = yield springboard.watchSite(name);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = { error: name + ' not found', loaded: 'false'};
      }
    },

    publish: function*(name) {
      try {
        var data = yield springboard.publishSite(name);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { site: name, error: name + ' not found', loaded: 'false'};
      }
    },

    push: function*(name) {
      try {
        var data = yield springboard.pushSite(name);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = { site: name, error: name + ' could not be pushed'};
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
        this.response.body = { error: 'failed to sync with repository', err: err, loaded: 'false'};
      }
    },

    create: function*() {
      // add new site
      console.log('in create');
      var newsite = this.request.body;
      console.log(this.request);
      if (!newsite.name) this.throw(400, 'name required');
      if (!newsite.siteid) this.throw(400, 'siteid required');
      if (!newsite.template) this.throw(400, 'template required');

      //var site = yield springboard.newSite(site);

      this.response.body = newsite;
    }
  };
};
