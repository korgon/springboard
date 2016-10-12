// used for proxy in springboard
'use strict';

var logit = require('_/logit');
var hoxy = require('hoxy');
var addShutdown = require('http-shutdown');

var hooke = function() {
	var self = this;
	self.resource_dir = __dirname + '/resources';

	self.init = function(opts) {
		self.options = opts;
	}

	self.start = function(site) {
		if (!site) return Promise.reject({ error: true, message: 'not editing a site...' });

		let site_state = site.getState();
		let proxy_settings = site_state.proxy;

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
				settings.script.siteid = site_state.settings.siteid.value;
				settings.script.context = proxy_settings.context.value;
			} else {
				if (!site.catalogs[catalog]) return Promise.reject({ error: true, message: 'hooke[start]: invalid site catalog' });

				let vars = site.catalogs[catalog].getVariables();
				settings.script.src = self.options.sites_base_dir + '/' + site.name + '/' + catalog + '/' + vars.COMPILE_DIR + '/' + vars.COMPILED_LOADER;
				settings.sitedir = site.directory;
			}

			return self.create(settings);
		} else {
			return Promise.resolve();
		}
	}

	self.create = function(settings) {
		return new Promise(function(resolve, reject) {
			return self.stop().then(() => {
				let url = settings.url;
				if (!url.match(/^http/)) {
					url = 'http://' + url;
				}
				self.url = url;

				settings.proxy_host = url.replace(/\/$/, '');
				settings.hostname = settings.proxy_host.replace(/^http(s)*:\/\//i, '').replace(/^www\./i, '');

				self.proxy = hoxy.createServer({
					reverse: settings.proxy_host
				}).listen(self.options.port, function() {
					attachIntercepts(settings);
					self.proxy._server = addShutdown(self.proxy._server);

					logit.log('Proxy Started', settings.proxy_host + ' @ ' + 'http://localhost:' + self.options.bs_port, 'cyan');
					resolve();
				});
			}).catch(err => {
				reject(err);
			});
		});
	}

	self.stop = function() {
		return new Promise(function(resolve, reject) {
			if (self.proxy && self.proxy.close) {
				self.proxy._server.shutdown(function() {
					if (self.url) logit.log('Proxy Stopped', self.url + ' @ ' + 'http://localhost:' + self.options.bs_port, 'cyan');

					self.url = '';
					resolve();
				});
			} else {
				resolve();
			}
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

			if (resp.statusCode == 301 || resp.statusCode == 302) {
				if(self.options.debug) logit.log('Proxy Redirect', 'Encountered a redirect... ', 'red');
				// prevent caching (solves issue of bad hostname)
				resp.headers['cache-control'] = 'max-age=1';

				// change location to error page
				resp.headers.location = '/badhooke?req=' + encodeURIComponent(settings.url) + '&resp=' + encodeURIComponent(resp.headers.location);
			}

			// modify things
			resp.$('title').text('Springboard Proxy');

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

		});

		// Serve up invalid.html
		self.proxy.intercept({
			phase: 'request',
			fullUrl: settings.proxy_host + '/badhooke'
		}, function(req, resp, cycle) {
			if(self.options.debug) logit.log('Proxy', 'serving invalid.html (' + self.resource_dir + '/invalid.html)', 'cyan');
			return cycle.serve({
				path: self.resource_dir + '/invalid.html'
			});
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
