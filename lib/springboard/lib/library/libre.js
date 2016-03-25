'use strict';

var library = require('./index')('/home/korgon/Work/springboard/springboard-library');

console.log(library);

//library.catalogs.v3.install({ name: 'v3', directory: 'some place'});

var dir = __dirname

library.catalogs.v3.modules.slideout.themes.default.install({ name: 'v3', directory: dir});
