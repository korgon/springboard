/**
* @module gitmo/repository
*/

// functionality needed for springboard
/*

COMPLETE
status
checkout
pull

TODO
clone
fetch
add with (-A)
push with (-u)
commit
branch
clean -fd
reset

*/

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
    repoStats = fs.statSync(self.path + '/.git');
    self.initialized = true;
    self._ready = true;
  } catch (err) {

  }
};

/**
* Returns a GIT status object
* #status
* @return {promise}
*/
Repository.prototype.status = function() {
  var self = this;
  var status = new Command(self.path, 'status', ['--branch', '--porcelain']);

  return new Promise(function(resolve, reject) {
    if (self._ready) {
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
* #pull
* @param {string} branch
* @param {array} flags
* @return {promise}
*/
Repository.prototype.checkout = function(branch, flags) {
  var self = this;
  var status = new Command(self.path, 'checkout', flags, branch);

  return new Promise(function(resolve, reject) {
    if (self._ready) {
      status.exec().then(res => {
        return resolve();
      }).catch(error => {
        return reject(error.trim());
      });
    } else {
      throw new Error('Repo does not exist!');
    }
  });
};

/**
* Performs a GIT pull from remote with the given branch name
* #pull
* @param {string} remote
* @param {string} branch
* @param {array} flags
* @return {promise}
*/
Repository.prototype.pull = function(remote, branch, flags) {
  var self = this;
  var status = new Command(self.path, 'pull', flags, remote + ' ' + branch);

  return new Promise(function(resolve, reject) {
    if (self._ready) {
      status.exec().then(res => {
        resolve();
      }).catch(error => {
        return reject(error.trim());
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
