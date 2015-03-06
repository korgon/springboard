// springboard
// restful api for mockups

/*
/api/v1/
------------------
GET   api/mockups/all
GET   api/mockups/{{ name }}
GET   api/mockups/watch/{{ name }}
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
    // runs the useSite function that triggers gulp watches of js/scss/html
    watch: function*(name) {
      try {
        var data = yield springboard.useSite(name);
        this.response.type = 'json';
        this.response.body = { site: data};
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = { error: name + ' not found', loaded: 'false'};
      }
    },
    create: function*() {
      // add new mockup
    }
  };
};
