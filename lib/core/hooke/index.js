// used for proxy in springboard
'use strict';

let logit = require('_/logit');
let fspro = require('_/fspro');

let hoxy = require('hoxy');
let addShutdown = require('http-shutdown');
let http = require('http');
let url = require('url');
let path = require('path');
let fs = require('fs');

let hooke = function() {
	let self = this;
	self.resource_dir = __dirname + '/resources';

	self.init = function(opts) {
		self.options = opts;
		self.await();
	}

	self.start = function(site) {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		let site_data = site.getData();
		let proxy_settings = site_data.proxy;

		if (!proxy_settings.enable.value) return self.stop();

		if (proxy_settings && proxy_settings.enable && proxy_settings.enable.value) {
			let catalog = proxy_settings.catalog.value;
			let settings = {
				site: site.name,
				catalog: catalog,
				url: proxy_settings.url.value,
				script: {}
			}

			if (catalog == 'smc') {
				settings.script.version = 'v3';
				settings.script.siteid = site_data.settings.siteid.value;
				settings.script.context = proxy_settings.context.value;
			} else {
				if (!site.catalogs[catalog]) return Promise.reject({ error: true, message: 'hooke[start]: invalid site catalog' });

				let vars = site.catalogs[catalog].getVariables();
				settings.script.src = '/' + self.options.sites_base_dir + '/' + site.name + '/' + catalog + '/' + vars.COMPILE_DIR + '/' + vars.COMPILED_LOADER;
				settings.sitedir = site.directory;
			}

			return self.create(settings).catch(err => {
				throw { error: true, message: 'hooke[create]: ' + err.message || 'unknown' };
			});
		} else {
			return Promise.resolve();
		}
	}

	self.create = function(settings) {
		return new Promise(function(resolve, reject) {
			return self.stop(true).then(() => {
				let clean_url = settings.url;
				if (!clean_url.match(/^http/)) {
					clean_url = 'http://' + clean_url;
				}
				self.url = clean_url;

				settings.proxy_host = clean_url.replace(/\/$/, '');
				settings.hostname = settings.proxy_host.replace(/^http(s)*:\/\//i, '').replace(/^www\./i, '');

				self.proxy = hoxy.createServer({
					reverse: settings.proxy_host
				}).listen(self.options.port, function() {
					attachIntercepts(settings);
					addShutdown(self.proxy._server);

					logit.log('Proxy Started', settings.proxy_host + ' @ ' + 'http://localhost:' + self.options.bs_port, 'cyan');
					resolve();
				});
			}).catch(err => {
				reject(err);
			});
		});
	}

	self.stop = function(create_flag) {
		return new Promise(function(resolve, reject) {
			if (self.proxy && self.proxy.close) {
				let reference;

				if (self.proxy._server) {
					reference = self.proxy._server;
				} else {
					reference = self.proxy;
				}

				reference.shutdown(function() {
					if (self.url) logit.log('Proxy Stopped', self.url + ' @ ' + 'http://localhost:' + self.options.bs_port, 'cyan');

					self.url = '';
					if (create_flag) {
						resolve();
					} else {
						return self.await().then(resolve);
					}
				});
			} else {
				if (create_flag) {
					resolve();
				} else {
					return self.await().then(resolve);
				}
			}
		});
	}

	// setup a basic webserver to show that there is no current proxy
	self.await = function() {
		return new Promise(function(resolve, reject) {
			if(self.options.debug) logit.log('Proxy Idle', 'http://localhost:' + self.options.bs_port, 'cyan');

			self.proxy = http.createServer(function(req, res) {
				if(self.options.debug) console.log(`${req.method} ${req.url}`);
				// parse URL
				let parsed_req = url.parse(req.url);
				// extract URL path
				let pathname = __dirname + '/resources' + parsed_req.pathname;
				if(self.options.debug) console.log(pathname);
				// based on the URL path, extract the file extention. e.g. .js, .doc, ...
				let ext = path.parse(pathname).ext;
				// maps file extention to MIME types
				const mimeType = {
					'.ico': 'image/x-icon',
					'.html': 'text/html',
					'.js': 'text/javascript',
					'.json': 'application/json',
					'.css': 'text/css',
					'.png': 'image/png',
					'.jpg': 'image/jpeg',
					'.svg': 'image/svg+xml'
				};
				fs.exists(pathname, function (exist) {
					if(!exist) {
						// if the file is not found, return 404
						res.statusCode = 404;
						pathname = __dirname + '/resources/404.html';
						ext = path.parse(pathname).ext;
					}
					// if is a directory, then look for index.html
					if (fs.statSync(pathname).isDirectory()) {
						pathname += '/index.html';
						ext = path.parse(pathname).ext;
					}
					// read file from file system
					fs.readFile(pathname, function(err, data){
						if(err) {
							res.statusCode = 500;
							res.end(`Error getting the file: ${err}.`);
						} else {
							// if the file is found, set Content-type and send data
							res.setHeader('Content-type', mimeType[ext] || 'text/plain' );
							res.end(data);
						}
					});
				});
			}).listen(self.options.port, function() {
				addShutdown(self.proxy);
				resolve();
			});
		});
	}

	function attachIntercepts(settings) {
		self.proxy.log('error warn', function(event) {
			logit.log('Error', '', 'fail');
			console.error(event.level + ': ' + event.message);
			if (event.error) console.error(event.error.stack);
		});

		// Intercept Response
		self.proxy.intercept({
			phase: 'response',
			mimeType: 'text/html',
			as: '$'
		}, function(req, resp, cycle) {

			if(self.options.debug) logit.log('Response Intercept', '', 'warn');
			if(self.options.debug) logit.log('Request', '', 'none');
			if(self.options.debug) console.log(req);

			if(self.options.debug) logit.log('Original Response', '', 'none');
			if(self.options.debug) console.log(resp);

			// modify frame header to allow framing
			delete resp.headers['x-frame-options']

			if (resp.statusCode == 301 || resp.statusCode == 302 || resp.statusCode == 307) {
				if(self.options.debug) logit.log('Proxy Redirect', 'Encountered a redirect... ', 'red');
				// prevent caching (solves issue of bad hostname)
				resp.headers['cache-control'] = 'max-age=1';

				let parsed_url = url.parse(resp.headers.location);
				let redirect_url = parsed_url.protocol + (parsed_url.slashes ? '//' : '') + (parsed_url.auth ? (parsed_url.auth + '@') : '') + parsed_url.host;

				// change location to error page
				resp.headers.location = '/hooke/invalid.html?req=' + encodeURIComponent(settings.url) + '&resp=' + encodeURIComponent(redirect_url);

				// remove troublesome headers
				delete resp.headers['transfer-encoding'];
				delete resp.headers['p3p'];
			}

			if (!req.url.match(/^\/hooke\/invalid\.html/)) {
				// modify things
				resp.$('title').text('Springboard Proxy');

				// add no cache meta tags (for iframe caching issue)
				// resp.$('head').prepend('<meta http-Equiv="Cache-Control" Content="no-cache" />');
				// resp.$('head').prepend('<meta http-Equiv="Pragma" Content="no-cache" />');
				// resp.$('head').prepend('<meta http-Equiv="Expires" Content="0" />');


				// make hrefs proxy friendly
				resp.$('a').each(function(i, anchor) {
					let regex = new RegExp('^.*' + settings.hostname, 'g');
					let href = resp.$(anchor).attr('href');
					if (href) {
						href = href.replace(regex, '');
						resp.$(anchor).attr('href', href);
					}
				});
				// do the same for forms
				resp.$('form').each(function(i, form) {
					let regex = new RegExp('^.*' + settings.hostname, 'g');
					let action = resp.$(form).attr('action');
					if (action) {
						action = action.replace(regex, '');
						resp.$(form).attr('action', action);
					}
				});

				// remove any searchspring script tags
				resp.$('script').each(function(i, script) {
					let src = resp.$(script).attr('src');
					if (src && src.match(/searchspring\.net/i)) {
						resp.$(script).remove();
					}
				});

				// add script based on site options
				if (settings.script.src) {
					resp.$('head').prepend('<script type="text/javascript" src="' + settings.script.src + '"></script>');
				}

				if (settings.script.version == 'v3') {
					resp.$('head').prepend('<script type="text/javascript" src="//cdn.searchspring.net/search/v3/js/searchspring.catalog.js?' + settings.script.siteid + '"' + (settings.script.context ? (' ' + settings.script.context) : '') + '></script>');
				}

				// view the response
				if(self.options.debug) logit.log('Modified Response', '', 'cyan');
				if(self.options.debug) console.log(resp);
			}
		});

		// Serve up hooke resources
		self.proxy.intercept({
			phase: 'request',
			fullUrl: '*/hooke/*'
		}, function(req, resp, cycle) {
			if(self.options.debug) logit.log('Proxy', req.url, 'cyan');
			return cycle.serve({
				path: __dirname + req.url.replace('/hooke/', '/resources/')
			});
		});

		// Intercept favicon to set cache time
		self.proxy.intercept({
			phase: 'response',
			fullUrl: '/favicon.*'
		}, function(req, resp, cycle) {
			resp.headers['cache-control'] = 'max-age=1';
		});

		if (settings.script.src) {
			// Serve up local files
			self.proxy.intercept({
				phase: 'request',
				fullUrl: '*/' + self.options.sites_base_dir + '/' + settings.site + '/*'
			}, function(req, resp, cycle) {
				let sitematch = new RegExp('^/sites/' + settings.site);
				if(self.options.debug) logit.log('Proxy', req.url, 'cyan');

				return cycle.serve({
					path: settings.sitedir + req.url.replace(sitematch, '')
				});
			});
		}
	}
};

module.exports = new hooke;
