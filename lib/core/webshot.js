/***************/
//   Webshot   //
/***************/

// strictness!
'use strict';
const fspro = require('_/fspro');
const webshot = require('webshot');
const lwip = require('lwip');

const capture = (info) => {
	// promisified
	return new Promise(function(resolve, reject) {
		let options = {
			screenSize: { width: 1280, height: 720 },
			shotSize: { width: 1280, height: 720 },
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
					// after taking screen capture scale image to thumbnail size using lwip
					lwip.open(output_path, function(err, image) {
						if (err) return reject(err);

						// scale image
						image.scale(0.50, function(err, image) {
							if (err) return reject(err);

							image.writeFile(output_path, function(err) {
								if (err) return reject(err);
								return fspro.lstat(output_path).then(stats => {
									let data = [
										{
											name: info.thumb,
											url: info.host + info.thumb,
											size: (stats.size/1000).toFixed(2) + 'kB',
											path: output_path
										}
									]
									resolve(data);
								});
							});
						});
					});
				});
			} catch(err) {
				reject(err);
			}
		});
	});
}

module.exports = {
	capture: capture
}
