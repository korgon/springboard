// used for logging in springboard
// styled for easy reading and identification
// v1.0.0
/*
example:
log({
  color: 'green',
  alert: 'init',
  message: 'initializing the things'
});

alternaives:
log('alert', 'message', 'color');
log('alert', 'message');

*/

'use strict'

var colors = require('colors');

function logit() {
  var color_options = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray', 'grey'];
  var color_states = { pass: 'green', fail: 'red', warn: 'yellow' }

  return {
    log: function log(entry) {
      var args = Array.prototype.slice.call(arguments);

      if (entry === undefined) return;

      if (typeof entry === 'string') {
        if (args.length > 0) {
          var alert = args[0] || '';
          var message = args[1] || '';
          var color = args[2] || 'white';
        }

        entry = {
          color: color,
          alert: alert,
          message: message
        }
      }

      if (typeof entry === 'object' && entry.alert.length) {
        if (color_options.indexOf(entry.color) == -1) {
          if (color_states[entry.color]) {
            entry.color = color_states[entry.color];
          } else {
            entry.color = 'white';
          }
        }
        if (!entry.message) {
          entry.message = '';
        }
      } else {
        return;
      }

      entry.alert = ' ' + entry.alert + ' ';

      colors.setTheme({
        custom: [entry.color]
      })

      var boxtopper = '┌' + '─'.repeat(entry.alert.length) + '┐';
      var boxbottom = '└' + '─'.repeat(entry.alert.length) + '┘';

      console.log(boxtopper.custom);
      console.log('│'.custom + entry.alert.bold.custom + '│'.custom + ' ' + entry.message.custom);
      console.log(boxbottom.custom);
    }
  }
}

// returned object
module.exports = new logit();
