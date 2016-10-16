// springboard koa
// manage searchspring sites

// strictness!
"use strict";

// include packages
let fs = require('fs');
let path = require('path');
let koa = require('koa');
let koaBody = require('koa-better-body');
let favicon = require('koa-favicon');
let logger = require('koa-logger');
let serve = require('koa-static');

module.exports = function(springboard) {
	// start
	let options = springboard.getOptions();
	//console.log(options);

	let app = koa();

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

	// static content
	app.use(favicon(__dirname + '/public/images/favicon.png'));
	app.use(serve(__dirname + '/public/'));

	// route middleware
	// ----------------

	let sbrouter = require('./router/router.js')(springboard);

	// router middleware
	app.use(sbrouter.routes());

	app.use(function *error404(next) {
		yield next;

		if (404 != this.status) return;

		// explicitly set 404 here
		this.status = 404;
		let filename = __dirname + '/public/404.html';
		let stats = fs.statSync(filename);
		this.set('Last-Modified', stats.mtime.toUTCString());
		this.set('Content-Length', stats.size);
		this.set('Cache-Control', 'max-age=0');
		this.type = path.extname(filename);
		this.body = fs.createReadStream(filename);
	});

	// catch routes not defined
	app.use(function *(){
		// redirect to index only on angular routes...
		// this allows for the use of "pretty" urls without the hash
		// kinda hacky... but necessary to prevent odd behavior in editor
		let valid_routes = [
			'/gallery/ignore',
			'/gallery/offline',
			'/gallery',
			'/editor',
			'/editor/offline',
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
	if (options.debug) console.log('http server is listening on ' + options.koa_port);
}
