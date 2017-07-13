"use strict";

// note that "_" is a clever way for including modules without typing full path
// "_" is a symbolic link inside of the root node_modules folder
// _ -> ../lib

var conf = require('_/config')(__dirname);
var springboard = require('_/core');

springboard.init(conf).then(function() {
	var app = require('_/app')(springboard);
}).catch(function(err) {
	console.log('failed to initialize the springboard!');
	console.log(err);
	process.exit(1);
});
