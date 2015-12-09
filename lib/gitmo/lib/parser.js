/**
* @module gitmo/parser
*/
'use strict';
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
* @return {object}
*/
parsers.status = function(gitstatus) {

  var status = {};

  if (gitstatus) {
    var output = gitstatus.trim().split('\n');
    output.forEach(function(line) {
      if (line.match(/^## +(.*)/)) {
        if (line.match(/^## +(.*)\.\.\./)) {
          status.branch = (/^## +(.*)\.\.\./).exec(line)[1];
        } else {
          status.branch = (/^## +(.*)/).exec(line)[1];
        }
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
* Export Contructor
* @constructor
* @type {object}
*/
module.exports = parsers;
