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
var bodyParser = require('koa-bodyparser');
var favicon = require('koa-favicon');
var logger = require('koa-logger');
var serve = require('koa-static');
var route = require('koa-route');

// local modules
var springboard = require(__dirname + "/lib/springboard.js");

// start
var app = koa();
springboard.init();

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
app.use(bodyParser());
app.use(logger());
app.use(favicon(__dirname + '/public/favicon.png'));
app.use(serve(__dirname + '/public/'));
app.use(serve(__dirname + '/searchspring-sites'));

// route middleware
// ----------------
// general routes
var routes = require(__dirname + '/routes/routes.js')(springboard);
app.use(route.get('/', routes.index));
app.use(route.get('/sites', routes.gallery));
// api routes
var sitesapi = require(__dirname + '/routes/sitesv1.js')(springboard);
app.use(route.get(['/api/sites', '/api/sites/all'], sitesapi.sites));
app.use(route.post('/api/sites/create', sitesapi.create));
app.use(route.get('/api/sites/sync', sitesapi.sync));
app.use(route.get('/api/sites/:site', sitesapi.site));
app.use(route.get('/api/sites/watch/:site', sitesapi.watch));
app.use(route.get('/api/sites/publish/:site', sitesapi.publish));
app.use(route.get('/api/sites/push/:site', sitesapi.push));

// start your engines
app.listen(1338);
