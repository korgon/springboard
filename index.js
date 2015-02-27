// manage searchspring mockups
// * include and merge js files
// * compile SASS
// * manage repository
// * manage mockups
// * create screenshots
// * restful api
// * bonus: start work of new ajax catalog

// strictness!
"use strict";

// include packages
var co = require('co');
var fs = require('mz/fs');
// local modules
var springboard = require(__dirname + "/lib/springboard.js");

// start your engines
co(function*() {
	// compress the springs
	yield springboard.init();
	// choose a site
	springboard.useSite('springdoge');
})
.then(function() {

	// do some other stuff here...

}, function(err) {
	// if anything fails
	console.log(err);
})
.catch(ssdeal)
.then(function() {
	console.log('this is the end...');
});

// error handler if co fails
function ssdeal(err) {
	consoel.error('derp!');
	console.error(err);
}
