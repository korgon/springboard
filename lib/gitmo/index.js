'use strict';

var Command = require('./lib/command.js');
var parsers = require('./lib/parser.js');

var status = new Command(__dirname, 'status');
var lsFiles = new Command(__dirname, 'ls-files', ['-o','--exclude-standard']);


Promise.all([status.exec(), lsFiles.exec()]).then(res => {
  var status = parsers.status(res[0], res[1]);
  console.log(status);
})


// status.exec().then(output => {
//   console.log(output);
//   var status = parsers.status(output);
//   console.log(status);
//
// }).catch(error => {
//   console.error(error);
// });

// functionality needed for springboard
/*

clone
fetch
checkout
status
add with (-A)
push with (-u)
pull
commit
branch

clean -fd
reset

*/
