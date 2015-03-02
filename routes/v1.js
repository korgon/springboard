// springboard
// restful api for mockups

/*
/api/v1/
------------------
GET mockups/all
GET mockups/{{ name }}
POST mockups/create
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
      this.response.body = data;
      this.response.type = 'json';
    },
    create: function*() {
      // add new mockup
    }
  };
};
