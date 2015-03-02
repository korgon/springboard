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
var mount = require('koa-mount');

// local modules
var springboard = require(__dirname + "/lib/springboard.js");

// start
var app = koa();
springboard.init();

// middleware
app.use(logger());
app.use(favicon(__dirname + '/public/favicon.png'));
app.use(serve(__dirname + '/public/'));
app.use(serve(__dirname + '/' + springboard.options.mockup_dir));

// route middleware
// ----------------
// general routes
var routes = require(__dirname + '/routes/routes.js')(springboard);
app.use(route.get('/', routes.index));
app.use(route.get('/sites', routes.gallery));
// api routes
var api = require(__dirname + '/routes/v1.js')(springboard);
app.use(route.get(['/mockups', '/mockups/all'], api.sites));
app.use(route.get('/mockups/:site', api.site));

// start your engines
app.listen(springboard.options.port);
setTimeout(function(){
  console.log();
  console.log('loaded @ http://localhost:' + springboard.options.port + '/');
}, 1337);
