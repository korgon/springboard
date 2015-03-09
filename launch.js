// springboard
// manage searchspring mockups
// * include and merge js files
// * compile SASS
// * manage repository
// * manage mockups
// * create screenshots
// * restful api
// * bonus: start work of new ajax catalog

// strictness!
"use strict";

// include packages
var co = require('co');
var koa = require('koa');
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
app.use(logger());
app.use(favicon(__dirname + '/public/favicon.png'));
app.use(serve(__dirname + '/public/'));
app.use(serve(__dirname + '/searchspring-mockups'));

// route middleware
// ----------------
// general routes
var routes = require(__dirname + '/routes/routes.js')(springboard);
app.use(route.get('/', routes.index));
app.use(route.get('/sites', routes.gallery));
// api routes
var mockupsapi = require(__dirname + '/routes/mockupsv1.js')(springboard);
app.use(route.get(['/api/mockups', '/api/mockups/all'], mockupsapi.sites));
app.use(route.get('/api/mockups/sync', mockupsapi.sync));
app.use(route.get('/api/mockups/:site', mockupsapi.site));
app.use(route.get('/api/mockups/watch/:site', mockupsapi.watch));
app.use(route.get('/api/mockups/publish/:site', mockupsapi.publish));
app.use(route.get('/api/mockups/push/:site', mockupsapi.push));

// start your engines
app.listen(springboard.options.port + 1);
