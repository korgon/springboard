/***************/
// Browsersync //
/***************/

// strictness!
'use strict';

let browsersync = require('browser-sync');
let logit = require('_/logit');

module.exports = {
	instantiate: startBrowserSync
}

function startBrowserSync(port_in, port_out) {
	// promisified
	logit.log('initialization', 'beginning browersersyncification');
	let bsinstance = browsersync.create('springboard');

	return new Promise(function(resolve, reject) {
		try {
			bsinstance.init({
				ui: false,										// start with ui?
				notify: false,								// show browser notifications?
				port: port_out,				// port number
				online: false,								// online features?
				open: false,									// open browser on start?
				logLevel: "silent",						// silencio!
				logFileChanges: false,				// mas silencio!
				proxy: "localhost:" + port_in,
				scriptPath: function (path, port, options) {	// allows to use bs w/base tag
					return options.get("absolute");
				}
			}, function() {
				// callback function after browsersync loads
				resolve(bsinstance);
			});
		}
		catch(err) {
			logit.log('server fail', 'failed to start browsersync', 'fail');
			reject(err);
		}
	});
}
