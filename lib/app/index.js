// springboard koa
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

module.exports = function(springboard) {
  // start
  var app = koa();

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


  // middleware
  app.use(favicon(__dirname + '/public/images/favicon.png'));
  app.use(serve(__dirname + '/public/'));

  // route middleware
  // ----------------

  var sbrouter = require('./router/router.js')(router);

  // router middleware
  app.use(sbrouter.routes());

  return app;
}
