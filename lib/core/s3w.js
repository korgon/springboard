/**
* @module s3w
*/

/*
s3 wrapper
----------------------------------------------------
/a.cdn.searchspring.net/sites/sitename/
|- js/
		|- sitename.mockup.js
|- css/
		|- sitename.mockup.css

/a.cdn.searchspring.net/ajax_search/sites/xxxxxx/
|- js/
		|- xxxxxx.js
		|- sitename.js
|- css/
		|- xxxxxx.css
		|- xxxxxxxxxxxxxxxxxxxxxxxxxxx.css
		|- sitename.css

*/

// strictness!
"use strict";

// include packages
let fs = require('fs');
let AWS = require('aws-sdk');

let fspro = require('_/fspro');

/**
* Setup function for getting access to a s3
* @constructor
* @param {string} opts
* @param {string} path
*/
var s3w = function(opts, keys) {
	return new Connection(opts, keys);
};

/**
* Constructor function for all s3 commands
* @constructor
* @param {string} repo
*/
var Connection = function(opts, keys) {
	this.options = opts;
	this.s3options = {
		accessKeyId: keys.key_id,
		secretAccessKey: keys.key_secret,
		endpoint: 'https://s3.amazonaws.com',
		sslEnabled: true
	};

	this.s3 = new AWS.S3(this.s3options);
}

/**
* Test connection by getting ACL of bucket
* @return {promise}
*/
Connection.prototype.listFiles = function(prefix) {
	let self = this;

	return new Promise(function(resolve, reject) {
		let object_params = {
			Bucket: self.options.cdn_url,
			Prefix: prefix
		}

		self.s3.listObjects(object_params, function(err, data) {
			if (err) {
				reject(err);
			}
			// got results!
			resolve(data);
		});
	});
}

/**
* Returns a url of the uploaded file
* @return {promise}
*/
Connection.prototype.putFile = function(file, cdn_location) {
	let self = this;

	let file_url = self.options.cdn_url + '/' + cdn_location;

	return new Promise(function(resolve, reject) {
		fspro.exists(file).then(stats => {
			if (stats) {
				// it exists! proceed...
				return Promise.resolve();
			} else {
				throw new Error('File not found!');
			}
		}).then(() => {
			let file_stream = fs.createReadStream(file);

			// assign content type based on extension
			let mimetype = "text/plain";      // default type
			if (file.match(/\.js$/i)) mimetype = "text/javascript";
			if (file.match(/\.(css|sass|scss)$/i)) mimetype = "text/css";
			if (file.match(/\.(html|htm)$/i)) mimetype = "text/html";
			if (file.match(/\.md$/i)) mimetype = "text/x-markdown";
			if (file.match(/\.(jpg|jpeg)$/i)) mimetype = "image/jpeg";
			if (file.match(/\.gif$/i)) mimetype = "image/gif";
			if (file.match(/\.png$/i)) mimetype = "image/png";

			let object_params = {
				Bucket: self.options.cdn_url,
				Key: cdn_location,
				ACL: 'public-read',
				Body: file_stream,
				ContentType: mimetype
				// CacheControl: 'max-age=300'  // five minutes
			};

			file_stream.on('error', function(err) {
				reject(err);
			});

			file_stream.on('open', function() {
				self.s3.putObject(object_params, function(err) {
					if (err) {
						reject(err);
					}
					// file uploaded!
					resolve(file_url);
				});
			});
		});
	});
}

/**
* Export Contructor
* @constructor
* @type {object}
*/
module.exports = s3w;
