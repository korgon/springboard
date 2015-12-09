/**
* @module gitmo/parser
*/

var parsers = {};

/**
* Logger function
* @param {string} output
* @return {string}
*/
parsers.log = function(output) {
  var log = '[' + output.substring(0, output.length - 1) + ']';

  // this function cleans the commit log from any double quotes breaking the
  // JSON string

  var jsonValueRegex = /".*?":"(.*?)"[,}]/g;

  var h = log.match(jsonValueRegex);

  if (h) {
    for (var i = h.length - 1; i >= 0; i--) {
      var hh = h[i].replace(jsonValueRegex, '$1');
      var hhh = hh.replace(/\"/g, '\\"').replace(/\'/g, "");

      log = log.replace(hh, hhh);
    }
  }

  return JSON.parse(log);
};

/**
* Output Handler for GIT status
* @param {string} gitstatus
* @param {string} untracked
* @return {object}
*/
parsers.status = function(gitstatus) {

  var status = {};

  if (gitstatus) {
    var output = gitstatus.trim().split('\n');
    output.forEach(function(line) {
      if (line.match(/^## +(.*)\.\.\./)) {
        status.branch = (/^## +(.*)\.\.\./).exec(line)[1];
        if (line.match(/.*\[ahead +(\d)\]/)) {
          status.ahead = (/.*\[ahead +(\d)\]/).exec(line)[1];
        }
      } else {
        status.changes = status.changes || [];
        var changes = (/(^..) (.*$)/).exec(line);
        var state = changes[1].trim();
        var change = changes[2].trim();

        status.changes.push({ 'state': state, 'change': change });
      }
    });
  }

  return status;
};

/**
* Output handler for GIT commit
* @param {string} output
* @return {string}
*/
parsers.commit = function(output) {
  var commitFailed = (output.indexOf('nothing to commit') > -1 ||
                      output.indexOf('no changes added to commit') > -1);

  // if there is nothing to commit...
  if (commitFailed) {
    return {
      error: (function(output) {
        var lines = output.split('\n');
        for (var ln = 0; ln < lines.length; ln++) {
          if (lines[ln].indexOf('#') === -1) {
            return lines[ln];
          }
        }
      })(output)
    };
  }

  var splitOutput = output.split('\n');
  var branchAndHash = splitOutput[0].match(/\[([^\]]+)]/g)[0];
  var branch = branchAndHash.substring(1, branchAndHash.length - 1);
  var hash = branchAndHash.substring(1, branchAndHash.length - 1);
  var filesChanged = splitOutput[1].split(' ')[0];
  var operations = splitOutput.splice(2);

  return {
    branch: branch.split(' ')[0],
    commit: hash.split(' ')[1],
    changed: filesChanged,
    operations: operations
  };
};

/**
* Output handler for GIT branch command
* @param {string} output
* @return {string}
*/
parsers.branch = function(output) {
  var tree = { current: null, others: [] };
  var branches = output.split('\n');

  branches.forEach(function(val, key) {
    if (val.indexOf('*') > -1) {
      tree.current = val.replace('*', '').trim();
    }
    else if (val) {
      tree.others.push(val.trim());
    }
  });

  return tree;
};

/**
* Output handler for GIT tag command
* @param {string} output
* @return {string}
*/
parsers.tag = function(output) {
  var tags = output.split(/\r?\n/);

  for (var i = 0; i < tags.length; i++) {
    if (!tags[i].length) {
      tags.splice(i, 1);
    }
  }

  return tags;
};

/**
* Output handler for GIT errors from GIT push and pull commands
* @param {string} output
* @return {string}
*/
parsers.syncErr = function(output) {
  var result = output.split('\r\n');

  for (var i = 0; i < result.length; i++) {
    if (!result[i].length) {
      result.splice(i, 1);
    }
  }

  return result;
};

/**
* Output handler for GIT success messages from GIT push and pull commands
* @param {string} output
* @return {string}
*/
parsers.syncSuccess = function(output) {
  return output;
};

/**
* Export Contructor
* @constructor
* @type {object}
*/
module.exports = parsers;
