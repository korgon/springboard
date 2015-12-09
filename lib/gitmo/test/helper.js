/**
* @module gitmo/helper
*/

var fs = require('fs');

var helper = {};

/**
* Removes test repository directory if it exists
* @param {string} repository directory
*/
helper.setupClone = function(repo_dir) {
  // ensure that the repo dir does not exist
  try {
    var repo = fs.statSync(repo_dir);
    helper.deleteFolderRecursive(repo_dir);
  }
  catch (error) {
    // file does not exist, do nothing
  }
}

/**
* Removes test repository directory if it exists
* @param {string} repository directory
*/
helper.teardownClone = function(repo_dir) {
  // ensure that the repo dir does not exist
  try {
    var repo = fs.statSync(repo_dir);
    helper.deleteFolderRecursive(repo_dir);
  }
  catch (error) {
    // file does not exist, do nothing
  }
}

/**
* Removes files and directories recursively
* @param {string} path
*/
helper.deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file, index){
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) { // recurse
        helper.deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

module.exports = helper;
