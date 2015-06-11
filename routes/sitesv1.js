// springboard
// api for mockups
// not restful... just whatever is needed is GETed and POSTed

/*
/api/v1/
------------------
GET   api/sites/all/
GET   api/sites/sync/
GET   api/sites/{{ name }}
GET   api/sites/{{ name }}/commit/
GET   api/sites/{{ name }}/push/
GET   api/sites/{{ name }}/publish/{{ live/mockup }}
GET   api/sites/{{ name }}/merge/

GET   api/springboard/watch/{{ name }}

POST  api/sites/create/
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

    use: function*() {
    // runs the watchSite function that triggers gulp watches of js/scss/html
      try {
        var data = yield springboard.watchSite(this.params.site);
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { error: true, message: 'could not switch to ' + this.params.site };
      }
    },

    publish: function*() {
      try {
        var data = yield springboard.publishSiteMockup();
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { error: true, message: 'site could not be published' };
      }
    },

    commit: function*() {
      try {
        var data = yield springboard.commitSite();
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        this.response.type = 'json';
        this.response.body = { error: true, message: 'site could not be commited' };
      }
    },

    push: function*() {
      try {
        var data = yield springboard.pushSite();
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { error: true, message: 'site could not be pushed' };
      }
    },

    mergeit: function*() {
      try {
        // var data = yield springboard.mergeSite();
        var data = { message: 'not really merged dude...' };
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { error: true, message: 'site could not be merged' };
      }
    },

    sync: function*() {
      try {
        var data = yield springboard.loadSites();
        this.response.type = 'json';
        this.response.body = data;
      }
      catch(err) {
        console.log(err);
        this.response.type = 'json';
        this.response.body = { error: true, message: 'failed to sync with repository: ' + err.message };
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
      if (!newsite.name || !newsite.siteid || !newsite.backend || !newsite.cart) {
        this.response.status = 400;
        this.response.body = { error: true, message: 'missing required fields' };
        return;
      }

      // TODO better verification of inputs
      // check to make sure inputs are valid

      // check if domain name format (example.com)
      if (!newsite.name.match(/^[^\_\.].+\..{2,}$/i)) {
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
        console.log('creating site...');
        var site = yield springboard.newSite(newsite);
        //var site = { error: false, message: 'site created success!' };
      }
      catch(err) {
        this.response.status = 400;
        this.response.body = { error: true, message: 'an error occured during site creation' + err.message };
        return;
      }

      this.response.body = site;
    }
  };
};
