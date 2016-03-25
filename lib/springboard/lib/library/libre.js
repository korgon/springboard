'use strict';

var library = require('./index')('/home/korgon/Work/springboard/springboard-library');

console.log(library);


var dir = __dirname + '/testing';

library.catalogs.v3.install({ name: 'v3', directory: dir });
library.catalogs.v3.modules.slideout.install({ name: 'slideout', directory: dir + '/v3', theme: 'default' });
library.catalogs.v3.modules.slideout.themes.blocky.install({ directory: dir + '/v3/modules/slideout' });
