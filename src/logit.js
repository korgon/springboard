// used for loging in springboard
// styled for easy reading and identification

(function() {

  var colors = require('colors');

  var log = function(alert, message, type) {
    alert = ' ' + alert + ' ';
    var boxtopper = '┌' + '─'.repeat(alert.length) + '┐';
    var boxbottom = '└' + '─'.repeat(alert.length) + '┘';
    switch (type) {
      case 'blue':
        console.log(boxtopper.blue);
        console.log('│'.blue + alert.bold.blue + '│'.blue + ' ' + message.blue);
        console.log(boxbottom.blue);
        break;
      case 'pass':
      case 'green':
        console.log(boxtopper.green);
        console.log('│'.green + alert.bold.green + '│'.green + ' ' + message.green);
        console.log(boxbottom.green);
        break;
      case 'fail':
      case 'red':
        console.log(boxtopper.red);
        console.log('│'.red + alert.bold.red + '│'.red + ' ' + message.red);
        console.log(boxbottom.red);
        break;
      case 'warn':
      case 'yellow':
        console.log(boxtopper.yellow);
        console.log('│'.yellow + alert.bold.yellow + '│'.yellow + ' ' + message.yellow);
        console.log(boxbottom.yellow);
        break;
      case 'white':
      default:
        console.log(boxtopper.white);
        console.log('│'.white + alert.bold.white + '│'.white + ' ' + message.white);
        console.log(boxbottom.white);
        break;
    }
  }

  // returned object
  module.exports = {
    log: log
  }

})();
