/**
* @module springboard/core
*/

var fs = require('fs');

var core = {};

/**
* Checks if file/directory exists
* @param {string} file
*/
core.exists = function(path) {
  return new Promise(function(resolve, reject) {
    fs.stat(path, (err, stats) => {
      if (err) {
        return reject(new Error(path + ' does not exists!'));
      } else {
        return resolve();
      }
    });
  });
}

module.exports = core;
