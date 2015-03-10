// springboard
// api for mockups not restful... just whatever is needed

/*
/api/v1/
------------------
GET   api/mockups/all
GET   api/mockups/{{ name }}
GET   api/mockups/watch/{{ name }}
GET   api/mockups/publish/{{ name }}
GET   api/mockups/push/{{ name }}
GET   api/mockups/sync
POST  api/mockups/create
... add more ...
*/

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
    // runs the watchSite function that triggers gulp watches of js/scss/html
    watch: function*(name) {
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
      // add new mockup
    }
  };
};
