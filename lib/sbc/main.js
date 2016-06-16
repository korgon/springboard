'use strict';

// markdown-it
global.markdownit = require('markdown-it');
// highlightjs
global.hljs = require('highlight.js');

// angular libraries
require('angular');
require('angular-route');
require('angular-animate');
require('angular-sanitize');
require('angular-markdown-it');

// springboard app files
require('./src/app.js');
require('./src/filters/filters.js');
require('./src/directives/directives.js');
require('./src/services/services.js');
require('./src/controllers/controllers.js');
