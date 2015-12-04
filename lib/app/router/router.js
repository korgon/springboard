var router = require('koa-router')();
var koaBody = require('koa-better-body');

module.exports = function(springboard) {
  // begin route definitions



  // Old pre-angular implementation (using /routes/routes.js)

  // var routes = require(__dirname + '/routes/routes.js')();
  // router.get('/', routes.editor);
  // router.get(['/sites', '/gallery'], routes.gallery);
  // router.get('/sites/:site', routes.editSite);


  // api routes
  var sitesapi = require('./api-v1.js')(springboard);

  // reload sites from file (trigger siteLoad)
  router.get('/api/sites/load', sitesapi.loadSites);
  router.get('/api/sites/load/:ignore', sitesapi.loadSites);

  // get sites or site json data
  router.get('/api/sites', sitesapi.sites);

  // choose site to begin watching
  router.get('/api/site/edit/:site', sitesapi.edit);
  // see which site is being watched
  router.get('/api/site', sitesapi.site);

  // create/update a new site
  router.post('/api/site/create', koaBody(), sitesapi.create);
  router.post('/api/site/update', koaBody(), sitesapi.update);

  // git & s3
  router.get('/api/site/status', sitesapi.status);
  router.post('/api/site/commit', koaBody(), sitesapi.commit);
  router.get('/api/site/push', sitesapi.push);
  router.get('/api/site/merge', sitesapi.merge);
  router.get('/api/site/reset', sitesapi.reset);
  router.get('/api/site/publish/mockup', sitesapi.publishMockup);
  router.get('/api/site/publish/live', sitesapi.publishLive);

  // modules, plugins and themes
  router.get('/api/modules', sitesapi.modules);

  // install anything
  router.post('/api/site/install', koaBody(), sitesapi.install);

  // end route definitions
  return router;
}
