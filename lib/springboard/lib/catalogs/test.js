'use strict';

var fspro = require('_/fspro');

var dir = __dirname + '/testing';

fspro.copyFolder(dir + '/v3', dir + '/copy').then(() => {
	console.log('done copying...');
}).catch(err => {
	console.log(err);
});

console.log('copying...');
