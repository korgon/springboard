'use strict';

var dir = __dirname + '/testing';

var lib = require('../index');


console.log('------------------------');
console.log('------------------------');
console.log('------------------------');


var testsite;
var library;

lib.load('/home/korgon/Work/springboard/springboard-library').then(l => {
	// load springboard library
	library = l;
	console.log(library);

}).catch(err => {
	console.log('errr!!!');
	console.log(err);
	console.log(library);
	console.log('------------------------');
	console.log(testsite);
});

// to give time to checkout memory usage
setTimeout(function() {
	console.log('done');
}, 100000)


// Next TODO
// figure out how to lower memory footprint?
// incorporate into springboard
// clean up springboard
// create watchers
