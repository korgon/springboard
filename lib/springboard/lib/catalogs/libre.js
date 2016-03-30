'use strict';

var dir = __dirname + '/testing';

var library = require('./index')('/home/korgon/Work/springboard/springboard-library');
// console.log(library.jsonify());
//
// console.log(library);
//
// library.catalogs.v3.install({ name: 'v3', directory: dir });
// library.catalogs.v3.modules.slideout.install({ name: 'slidie', directory: dir + '/v3', theme: 'blocky' });
// library.catalogs.v3.modules.slideout.themes.blocky.install({ directory: dir + '/v3/modules/slideout' });

console.log('------------------------');
console.log('------------------------');
console.log('------------------------');

library.catalogs.v3.install({ name: 'v3', directory: dir });

var testsite = require('./index')(dir);

library.catalogs.v3.modules.slideout.install({ name: 'slideout', directory: testsite.catalogs.v3.directory, theme: 'default' });
// library.catalogs.v3.modules.slideout.themes.blocky.install({ directory: testsite.catalogs.v3.modules.slidey.directory });
// testsite.catalogs.v3.modules.slidie.setTheme('default');

// console.log(testsite.catalogs.v3.modules);
// console.log(JSON.stringify(testsite.getData()));

console.log(library.catalogs);
console.log(testsite.catalogs);

console.log(JSON.stringify(library.getData()));
console.log(JSON.stringify(testsite.getData()));


// Next TODO
// make entire module PROMISIFIED
// Determine theme installation by using linkup
// Finish update functions
// write compile functions
