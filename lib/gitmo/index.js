'use strict';

/**
* @module gitmo
*/

var fs = require('fs');
var Repository = require('./lib/repository');
var Command = require('./lib/command');

/**
* Setup function for getting access to a GIT repo
* @constructor
* @param {string} path
*/
var Gitmo = function(path) {
  return new Repository(path);
};

/**
* Wrapper for the GIT clone function
* @param {string} path
* @param {string} url
* @param {function} callback
*/
Gitmo.clone = function(path, url) {
  var self = this;

  var clone = new Command('/', 'clone', [url, path]);
  var error = null;

  return new Promise(function(resolve, reject) {
    try {
      var exists = fs.statSync(path + '/.git');
      clone.exec().then(res => {
        console.log('cloning...');
        resolve();
      }).catch(error => {
        console.log('caught error...');
        return reject(error.trim());
      });
    } catch (error) {
      console.log('really caught error...');
      return reject(error.trim());
    }
  });
};

/**
* Export Contructor
* @constructor
* @type {object}
*/
module.exports = Gitmo;
