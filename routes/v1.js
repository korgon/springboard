// springboard
// restful api for mockups

/*
/api/v1/
------------------
GET mockups/all
POST mockups/create
GET mockups/{{ name }}
GET mockups/{{ name }}/files
GET mockups/{{ name }}/modules
GET mockups/{{ name }}/publish
GET mockups/{{ name }}/destroy
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
    }
  };
};
