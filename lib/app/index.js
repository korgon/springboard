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
  console.log(springboard.getoptions());
  app.use(serve(springboard.getOptions().sites_repo_dir));

  // route middleware
  // ----------------

  var sbrouter = require('./router/router.js')(springboard);

  // router middleware
  app.use(sbrouter.routes());

  if (springboard.options.app_log_http) {
    app.use(logger());
  }

  // start your engines
  app.listen(springboard.options.port + 1);
  console.log('eh?');
}
