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
var co = require('co');
var koa = require('koa');
var koaBody = require('koa-better-body');
var favicon = require('koa-favicon');
var logger = require('koa-logger');
var serve = require('koa-static');
var router = require('koa-router')();

// set some global variables needed in multiple modules
global.port = 1337;
global.site_dir = "searchspring-sites/";

// local modules
var springboard = require(__dirname + "/lib/springboard.js");

// start
var app = koa();
springboard.init().catch(function(err) {
  console.log('failed to initialize springboard!'.red);
  process.exit(1);
});

// handle things...
// app.use(function*(next) {
//   try {
//     // pass things downstream
//     yield next;
//   } catch(err) {
//     // catch any errors thrown upstream
//     this.status == err.status || 500
//   }
// });

// middleware

app.use(logger());
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(serve(__dirname + '/public/'));
app.use(serve(__dirname + '/' + global.site_dir));
app.use(serve(__dirname + '/.cache'));

// route middleware
// ----------------
// begin rout definitions
var routes = require(__dirname + '/routes/routes.js')(springboard);
router.get('/', routes.editor);
router.get('/sites', routes.gallery);
// api routes
var sitesapi = require(__dirname + '/routes/sitesv1.js')(springboard);
router.get(['/api/sites', '/api/sites/all'], sitesapi.sites);
router.get('/api/sites/use/:site', sitesapi.use);
router.get('/api/sites/sync', sitesapi.sync);
router.get('/api/sites/commit', sitesapi.commit);
router.get('/api/sites/publish', sitesapi.publish);
router.get('/api/sites/push', sitesapi.pushit);
router.get('/api/sites/merge', sitesapi.mergeit);
router.post('/api/sites/create', koaBody(), sitesapi.create);

router.get('/api/sites/:site', sitesapi.site);
// end route definitions

// router middleware
app.use(router.routes());

// start your engines
app.listen(global.port + 1);
// koa serves up at 1338, but browsersync creates a proxy at 1337 for css injection using socket.io
