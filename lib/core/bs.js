/***************/
// Browsersync //
/***************/

// strictness!
'use strict';

let browsersync = require('browser-sync');
let logit = require('_/logit');

const styles = {
	top: 'auto',
	bottom: '0',
	margin: '0',
	position: 'fixed',
	fontSize: '14px',
	width: '100%',
	zIndex: '9999999999',
	borderRadius: '0',
	textAlign: 'center',
	display: 'block',
	whiteSpace: 'pre-line',
	backgroundColor: 'rgba(0, 18, 30, 0.9)',
	borderTop: '2px solid rgba(153, 0, 0, 0.36)'
}

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
				notify: { styles: styles },								// show browser notifications?
				port: port_out,				// port number
				online: false,								// online features?
				open: false,									// open browser on start?
				logLevel: "silent",						// silencio!
				logFileChanges: false,				// mas silencio!
				online: false,
				localOnly: true,
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
