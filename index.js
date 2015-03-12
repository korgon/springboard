// manage searchspring mockups
// this script was mostly used for testing purposes
// it has not been used since the installation of postman in chrome

// strictness!
"use strict";

// include packages
var co = require('co');

// local modules
var springboard = require(__dirname + "/lib/springboard.js");

// start your engines
co(function*() {
	// compress the springs
	yield springboard.init();
	// choose a site
	// springboard.useSite('springdoge');

	// create a site
	var site = {
		name: 'springcat',
		siteid: '654321',
		cart: 'unknown',
		template: 'skeleton'
	}
	// ['name', 'siteid', 'status', 'cart', 'template', 'modules']
	yield springboard.newSite(site);
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
