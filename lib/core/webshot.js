/***************/
//   Webshot   //
/***************/

// strictness!
'use strict';
const fspro = require('_/fspro');
const webshot = require('webshot');

const capture = (info) => {
	// promisified
	return new Promise(function(resolve, reject) {
		let options = {
			screenSize: { width: 1280, height: 720 },
			shotSize: { width: 1280, height: 720 },
			defaultWhiteBackground: true,
			renderDelay: 3000
		};

		// variables for files'n'stuff
		let output_file = info.file_name || Date.now() + '.png';
		let output_path = info.thumb_dir + '/' + output_file;
		info.thumb += '/' + output_file;

		return fspro.exists(info.thumb_dir).then(exists => {
			if (!exists) {
				return fspro.mkDir(info.thumb_dir);
			} else {
				return Promise.resolve();
			}
		}).then(() => {
			try {
				webshot(info.url, output_path, options, function(err) {
					// return data object that is similar to s3publish returns for display
					fspro.exists(output_path).then(stats => {
						if (!stats) {
							reject(stats);
						}

						let data = [
							{
								name: info.thumb,
								url: info.host + info.thumb,
								size: (stats.size/1000).toFixed(2) + 'kB',
								path: output_path,
								image: true
							}
						]
						resolve(data);
					});
				});
			} catch(err) {
				reject(err);
			}
		}).catch(err => {
			reject(err);
		});
	});
}

module.exports = {
	capture: capture
}
