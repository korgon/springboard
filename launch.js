// springboard
// manage searchspring sites
// * include and merge js files
// * compile SASS
// * manage repository
// * manage sites
// * create screenshots
// * API/UI interface
// * bonus: start work of new ajax catalog

// strictness!
"use strict";

// include packages
var koa = require('koa');
var koaBody = require('koa-better-body');
var favicon = require('koa-favicon');
var logger = require('koa-logger');
var serve = require('koa-static');
var router = require('koa-router')();

// set some global variables needed in multiple modules
global.port = 1337;
global.dirname = __dirname;
global.site_repository_dirname = __dirname + "/searchspring-sites";

// local modules
var springboard = require(__dirname + "/src/springboard.js");

// start
var app = koa();
springboard.init().catch(function(err) {
  console.log('failed to initialize springboard!'.red);
  process.exit(1);
});
var log_http = false;

// handle things... sample middleware
// app.use(function*(next) {
//   try {
//     // pass things downstream
//     yield next;
//   } catch(err) {
//     // catch any errors thrown upstream
//     this.status == err.status || 500
//   }
// });


// optional middleware
if (log_http) {
  app.use(logger());
}

// middleware
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(serve(__dirname + '/public/'));
app.use(serve(global.site_repository_dirname));
app.use(serve(__dirname + '/.cache'));

// route middleware
// ----------------
// begin route definitions



// Old pre-angular implementation (using /routes/routes.js)

// var routes = require(__dirname + '/routes/routes.js')();
// router.get('/', routes.editor);
// router.get(['/sites', '/gallery'], routes.gallery);
// router.get('/sites/:site', routes.editSite);


// api routes
var sitesapi = require(__dirname + '/routes/sitesv1.js')(springboard);

// reload sites from file (trigger siteLoad)
router.get('/api/sites/load', sitesapi.loadSites);

// get sites or site json data
router.get('/api/sites', sitesapi.sites);

// choose site to begin watching
router.get('/api/site/edit/:site', sitesapi.edit);
// see which site is being watched
router.get('/api/site', sitesapi.site);

// create a new site
router.post('/api/site/create', koaBody(), sitesapi.create);

// git & s3
router.get('/api/site/status', sitesapi.status);
router.post('/api/site/commit', koaBody(), sitesapi.commit);
router.get('/api/site/push', sitesapi.push);
router.get('/api/site/merge', sitesapi.merge);
router.get('/api/site/publish/mockup', sitesapi.publishMockup);
router.get('/api/site/publish/live', sitesapi.publishLive);

// modules, plugins and themes
router.get('/api/modules', sitesapi.modules);

// install anything
router.post('/api/site/install', koaBody(), sitesapi.install);

// end route definitions

// router middleware
app.use(router.routes());

// start your engines
app.listen(global.port + 1);
// koa serves up at 1338 (1337+1), but browsersync creates a proxy at global.port (1337) for css injection using socket.io
