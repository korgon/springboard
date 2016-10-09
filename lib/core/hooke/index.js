// used for proxy in springboard
'use strict';

var logit = require('_/logit.js');
var hoxy = require('hoxy');
var http = require('http');

var proxy;
var options;

var hooke = function() {
	var self = this;

	self.init = function(opts) {
		options = opts;
	}

	self.proxy = function(url) {
		options.url = url;
		return new Promise(function(resolve, reject) {
			return self.stop().then(() => {
				createNewProxy(url, function() {
					resolve();
				});
			}).catch(err => {
				reject(err);
			});
		});
	}

	self.stop = function() {
		return new Promise(function(resolve, reject) {
			if (proxy && proxy.close) {
				proxy.close(function() {
					logit.log('Proxy Stopped', options.proxy_host + ' @ ' + 'http://localhost:' + options.port, 'gray');
					resolve();
				});
			} else {
				resolve();
			}
		});
	}
};

function createNewProxy(url, callback) {
	options.proxy_host = url.replace(/\/$/, '');
	options.hostname = options.proxy_host.replace(/^http(s)*:\/\//i, '').replace(/^www\./i, '');
	logit.log('Proxy Started', options.proxy_host + ' @ ' + 'http://localhost:' + options.port, 'gray');

	proxy = hoxy.createServer({
		reverse: options.proxy_host
	}).listen(options.port, function() {
		attachIntercepts();

		callback();
	});
}

function attachIntercepts() {
	proxy.log('error warn', function(event) {
		logit.log('Error', '', 'fail');
		console.error(event.level + ': ' + event.message);
		if (event.error) console.error(event.error.stack);
	});

	// Intercept Response
	proxy.intercept({
		phase: 'response',
		mimeType: 'text/html',
		as: '$'
	}, function(req, resp, cycle) {

		if(options.debug) logit.log('Response Intercept', '', 'warn');
		if(options.debug) logit.log('Request', '', 'none');
		if(options.debug) console.log(req);

		if(options.debug) logit.log('Original Response', '', 'none');
		if(options.debug) console.log(resp);

		resp.headers['cache-control'] = 'max-age=1';

		if (resp.statusCode == 301 || resp.statusCode == 302) {
			if(options.debug) logit.log('Proxy Redirect', 'Encountered a redirect... ', 'red');

			resp.headers.location = '/badhooke?req=' + encodeURIComponent(options.url) + '&resp=' + encodeURIComponent(resp.headers.location);
		}

		// modify things
		resp.$('title').text('Hooke Proxy');
		resp.$('head').prepend('<script type="text/javascript" src="' + options.script_location + '">');

		// make hrefs proxy friendly
		resp.$('a').each(function(i, anchor) {
			let regex = new RegExp('^.*' + options.hostname, 'g');
			let href = resp.$(anchor).attr('href');
			if (href) {
				href = href.replace(regex, '');
				resp.$(anchor).attr('href', href);
			}
		});
		// do the same for forms
		resp.$('form').each(function(i, form) {
			let regex = new RegExp('^.*' + options.hostname, 'g');
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

		// view the response
		if(options.debug) logit.log('Modified Response', '', 'none');
		if(options.debug) console.log(resp);

	});

	// Serve up invalid.html
	proxy.intercept({
		phase: 'request',
		fullUrl: options.proxy_host + '/badhooke'
	}, function(req, resp, cycle) {
		if(options.debug) logit.log('Hooke', 'serving invalid.html (' + options.koa_path + '/resources/invalid.html)', 'green');
		return cycle.serve({
			path: options.koa_path + '/resources/invalid.html'
		});
	});

	// Serve up hooke.js
	proxy.intercept({
		phase: 'request',
		fullUrl: options.proxy_host + '/hooke/hooke.js'
	}, function(req, resp, cycle) {
		if(options.debug) logit.log('Hooke', 'serving hooke.js (' + options.loader_path + '/resources/hooke.js)', 'green');
		return cycle.serve({
			path: options.loader_path + '/resources/hooke.js'
		});
	});

	// Serve up hooke.css
	proxy.intercept({
		phase: 'request',
		fullUrl: options.proxy_host + '/hooke/hooke.css'
	}, function(req, resp, cycle) {
		if(options.debug) logit.log('Hooke', 'serving hooke.css', 'green');
		if(options.debug) console.log(rootdir + '/resources/hooke.css');
		return cycle.serve({
			path: rootdir + '/resources/hooke.css'
		});
	});
}

module.exports = new hooke;
