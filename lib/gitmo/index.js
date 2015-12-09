/**
* @module gitmo
*/
'use strict';
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
* @return {promise}
*/
Gitmo.clone = function(path, url) {
  var self = this;

  return new Promise(function(resolve, reject) {
    _verifyRepo(path).then(() => {
      return reject(new Error('Repository @ ' + path + ' already exists!'));
    }).catch(error => {
      var clone = new Command('/', 'clone', [url, path]);

      clone.exec().then(res => {
        return resolve();
      }).catch(error => {
        return reject(error);
      });
    });
  });
};

/**
* Handles the local GIT configuration
* @param {string} path
* @return {promise}
*/
Gitmo.getConfig = function(path, key) {
  var self = this;

  return new Promise(function(resolve, reject) {
    _verifyRepo(path).then(() => {
      var cmd = new Command(path, 'config', [key]);

      cmd.exec().then(res => {
        return resolve(res.trim());
      }).catch(error => {
        return reject(new Error('Key ' + key + ' does not exist!'));
      });
    }).catch(error => {
      return reject(error);
    });
  });
}

/**
* Handles the local GIT configuration
* @param {string} path
* @param {string} key
* @param {string} val
* @return {promise}
*/
Gitmo.setConfig = function(path, key, val) {
  var self = this;

  return new Promise(function(resolve, reject) {
    _verifyRepo(path).then(() => {
      var cmd = new Command(path, 'config', [key], '"' + val + '"');

      cmd.exec().then(() => {
        return resolve();
      }).catch(error => {
        return reject(error);
      });
    }).catch(error => {
      return reject(error);
    });
  });
};

/**
* Checks if GIT repo exists
* @param {string} path
* @return {promise}
*/
var _verifyRepo = function(path) {
  var self = this;

  return new Promise(function(resolve, reject) {
    fs.stat(path + '/.git', (err, stats) => {
      if (err) {
        return reject(new Error('Repository @ ' + path + ' does not exists!'));
      } else {
        return resolve();
      }
    });
  });
}

/**
* Export Contructor
* @constructor
* @type {object}
*/
module.exports = Gitmo;
