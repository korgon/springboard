/**
* @module s3w
*/

/*
s3 wrapper
----------------------------------------------------
/a.cdn.searchspring.net/mockup/sitename/
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
var co = require('co');
var fs = require('fs');
var AWS = require('aws-sdk');
var dir = require('node-dir');

// privates
var s3;

// construction
module.exports = s3w;
function s3w(keys) {
  var options = {
    accessKeyId: keys.s3_key_id,
    secretAccessKey: keys.s3_key_secret,
    endpoint: 'https://s3.amazonaws.com',
    sslEnabled: true
  };
  s3 = new AWS.S3(options);
}

// * * * * * * * * * * * */
//   public functions   */
// * * * * * * * * * * */

s3w.prototype.putFile = function(file, prekey) {
  return new Promise(function(resolve, reject) {
    if (fs.existsSync(file)) {
      var file_stream = fs.createReadStream(file);

      // assign content type based on extension
      var mimetype = "text/plain";      // default type
      if (file.match(/\.js$/i)) mimetype = "text/javascript";
      if (file.match(/\.css$/i)) mimetype = "text/css";
      if (file.match(/\.(html|htm)$/i)) mimetype = "text/html";
      if (file.match(/\.md$/i)) mimetype = "text/x-markdown";
      if (file.match(/\.(jpg|jpeg)$/i)) mimetype = "image/jpeg";
      if (file.match(/\.gif$/i)) mimetype = "image/gif";
      if (file.match(/\.png$/i)) mimetype = "image/png";

      var object_params = {
        Bucket: 'a.cdn.searchspring.net',
        Key: prekey + file,
        ACL: 'public-read',
        Body: file_stream,
        ContentType: mimetype
        // CacheControl: 'max-age=300'  // five minutes
      };

      file_stream.on('error', function(err) {
        console.log(err);
        return reject(err);
      });

      file_stream.on('open', function() {
        s3.putObject(object_params, function(err) {
          if (err) {
            console.log(err);
            return reject(err);
          }
          // file uploaded
          return resolve(true);
        });
      });
    }
    else {
      console.log('File not found!');
      return reject(new Error('file not found!'));
    }
  });
}

// put entire directory (recursively TBD)
// using file streams
s3w.prototype.putDir = function(directory, prekey) {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (fs.existsSync(directory)) {
      try {
        // ignore all hidden files/folders, ignore .json files and .md files
        dir.readFiles(directory, { exclude: [/^\./, /\.json$/i, /\.md$/i] }, function(err, content, next) {
          if (err) return reject(err);
          next();
        }, function(err, files) {
          if (err) return reject(err);
          // async flow control forces upload of one object at a time...
          co(function *() {
            for (let file of files) {
              yield self.putFile(file, prekey);
            }
            // after all files have been uploaded
            return resolve(true);
          }).catch(function(err) {
            return reject(err);
          });
        });
      }
      catch(err) {
        return reject(err);
      }
    }
    else {
      return reject(new Error('directory not found!'));
    }
  });
}
