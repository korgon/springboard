// springboard koa
// manage searchspring sites

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
	var options = springboard.getOptions();
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
	console.log(options);
	app.use(serve(options.sites_repo_dir));

	// route middleware
	// ----------------

	var sbrouter = require('./router/router.js')(springboard);

	// router middleware
	app.use(sbrouter.routes());

	// catch routes not defined
	app.use(function *(){
		// redirect to index only on angular routes...
		// this allows for the use of "pretty" urls without the hash
		// kinda hacky... but necessary to prevent odd behavior in editor
		var valid_routes = [
			'/gallery',
			'/editor',
			'/settings'
		]
		if (valid_routes.indexOf(this.request.url) != -1) {
			this.redirect('/');
		}
	});

	if (options.app_log_http) {
		app.use(logger());
	}

	// start your engines
	app.listen(options.koa_port);
	console.log('listening on ' + options.koa_port);
}
