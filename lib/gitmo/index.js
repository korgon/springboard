'use strict';

/**
* @module gitmo
*/

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
* @param {object} creds
* @param {function} callback
*/
Gitmo.clone = function(path, url) {
  var self = this;
  var args = Array.prototype.slice.apply(arguments);
  var creds = args[2].username ? args[2] : {};
  var done = args.slice(-1).pop() || new Function();
  var clone = new Command('/', 'clone', [url, path]);
  var error = null;

  clone.exec(function(err, stdout, stderr) {
    done(err);
  });
};

/**
* Export Contructor
* @constructor
* @type {object}
*/
module.exports = Gitmo;
