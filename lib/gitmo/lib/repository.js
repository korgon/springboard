/**
* @module gitmo/repository
*/
'use strict';

var fs = require('fs');
var path = require('path');
var Command = require('./command.js');
var parsers = require('./parser.js');

/**
* Constructor function for all repository commands
* @constructor
* @param {string} repo
*/
var Repository = function(repo) {
  var self = this;

  self.path = path.normalize(repo);
  self._ready = false;
  self.name = path.basename(self.path);

  try {
    fs.statSync(self.path + '/.git');
    self.initialized = true;
    self._ready = true;
  } catch (error) {
    // do nothing
  }
};

/**
* Returns a GIT status object
* @return {promise}
*/
Repository.prototype.status = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self._ready) {
      var status = new Command(self.path, 'status', ['--branch', '--porcelain']);
      status.exec().then(res => {
        var status = parsers.status(res);
        resolve(status);
      }).catch(error => {
        return reject(error);
      });
    } else {
      throw new Error('Repo does not exist!');
    }
  });
};


/**
* Performs a GIT checkout on given branch name
* @param {string} branch
* @param {array} flags
* @return {promise}
*/
Repository.prototype.checkout = function(branch, flags) {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self._ready) {
      var checkout = new Command(self.path, 'checkout', flags, branch);
      checkout.exec().then(res => {
        return resolve();
      }).catch(error => {
        return reject(error);
      });
    } else {
      throw new Error('Repo does not exist!');
    }
  });
};

/**
* Performs a GIT push from remote with the given branch name
* @param {string} remote
* @param {string} branch
* @param {array} flags
* @return {promise}
*/
Repository.prototype.push = function(remote, branch, flags) {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self._ready) {
      var push = new Command(self.path, 'push', flags, remote + ' ' + branch);
      push.exec().then(() => {
        resolve();
      }).catch(error => {
        return reject(error);
      });
    } else {
      throw new Error('Repo does not exist!');
    }
  });
};

/**
* Performs a GIT pull from remote with the given branch name
* @param {string} remote
* @param {string} branch
* @param {array} flags
* @return {promise}
*/
Repository.prototype.pull = function(remote, branch, flags) {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self._ready) {
      var pull = new Command(self.path, 'pull', flags, remote + ' ' + branch);
      pull.exec().then(() => {
        resolve();
      }).catch(error => {
        return reject(error);
      });
    } else {
      throw new Error('Repo does not exist!');
    }
  });
};

/**
* Performs a GIT add
* @param {array} files
* @param {array} flags
* @return {promise}
*/
Repository.prototype.add = function(files, flags) {
  var self = this;
  files = files || [];

  return new Promise(function(resolve, reject) {
    if (self._ready) {
      var add = new Command(self.path, 'add', flags, files.join(' '));
      add.exec().then(() => {
        resolve();
      }).catch(error => {
        return reject(error);
      });
    } else {
      throw new Error('Repo does not exist!');
    }
  });
};

/**
* Performs a GIT commit
* @param {string} message
* @param {array} flags
* @return {promise}
*/
Repository.prototype.commit = function(message, flags) {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self._ready) {
      flags = Array.isArray(flags) ? flags.push('-m') : ['-m'];

      var commit = new Command(self.path, 'commit', flags, '"' + message + '"');
      commit.exec().then(() => {
        resolve();
      }).catch(error => {
        return reject(error);
      });
    } else {
      throw new Error('Repo does not exist!');
    }
  });
};

/**
* Performs a GIT merge
* @param {string} branch
* @param {array} flags
* @return {promise}
*/
Repository.prototype.merge = function(branch, flags) {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self._ready) {

      var merge = new Command(self.path, 'merge', flags, branch);
      merge.exec().then(() => {
        resolve();
      }).catch(error => {
        return reject(error);
      });
    } else {
      throw new Error('Repo does not exist!');
    }
  });
};

/**
* Performs a GIT clean
* @param {array} flags
* @return {promise}
*/
Repository.prototype.clean = function(flags) {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self._ready) {

      var clean = new Command(self.path, 'clean', flags);
      clean.exec().then(() => {
        resolve();
      }).catch(error => {
        return reject(error);
      });
    } else {
      throw new Error('Repo does not exist!');
    }
  });
};

/**
* Performs a GIT reset
* @param {array} flags
* @return {promise}
*/
Repository.prototype.reset = function(flags) {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self._ready) {

      var reset = new Command(self.path, 'reset', flags);
      reset.exec().then(() => {
        resolve();
      }).catch(error => {
        return reject(error);
      });
    } else {
      throw new Error('Repo does not exist!');
    }
  });
};

/**
 * Export Constructor
 * @type {object}
 */
module.exports = Repository;
