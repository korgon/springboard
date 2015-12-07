/**
* @module gitmo/repository
*/

// functionality needed for springboard
/*

COMPLETE
status

TODO
clone
fetch
checkout
add with (-A)
push with (-u)
pull
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
        throw new Error(error);
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
