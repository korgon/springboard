"use strict";

var conf = require('_/config')(__dirname);
var springboard = require('_/springboard');

springboard.init(conf).then(function() {
  var app = require('_/app')(springboard);
  console.log('success!');
}).catch(function(err) {
  console.log('failed to initialize the springboard!');
  console.log(err);
  process.exit(1);
});
