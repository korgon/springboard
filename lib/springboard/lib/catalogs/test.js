'use strict';

var fs = require('fs');
var path = require('path');
var fspro = require('_/fspro');

var dir = __dirname + '/testing/v3/js/slide';

fs.readlink(dir, (err, link) => {
	console.log(link);
})
