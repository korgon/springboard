// misc tools used for building v3 catalogs

'use strict';

// Directories
const COMPILE_DIR = 'generated';
const MODULE_DIR = 'modules';
const JS_DIR = 'js';
const SASS_DIR = 'scss';
const TEMPLATES_DIR = 'templates';

// Files
const COMPILED_LOADER = 'loader.js';
const COMPILED_JS = 'scripts.js';
const COMPILED_JS_VARIABLES = '._variables.js';
const COMPILED_SASS = 'stylesheet.css';
const COMPILED_SASS_VARIABLES = '._variables.scss';
const COMPILED_SASS_MODULES = '._modules.scss';
const COMPILED_TEMPLATES = 'templates.html';


// defaults
const DEFAULT_SASS =
`// springboard generated styles for v3
@import "${ COMPILED_SASS_VARIABLES }";
@import "${ COMPILED_SASS_MODULES }";`;
const DEFAULT_TEMPLATE = '<script type="text/ss-template" target=""></script>';

// used for generating catalog.js (similar to angular.js in SMC)
const CATALOG_GENERATED_HEAD =
`// **NOT TO BE USED IN PRODUCTION**
// v3 catalog templates and js compiled by Springboard
// created for Springboard use only

// v3 init
window.SearchSpringInit = function() {`;

const CATALOG_GENERATED_MID =
`};

SearchSpring.Catalog.templates.promises.receive.resolve('`;

const CATALOG_GENERATED_FOOT =
`');`;

const LOADER_GENERATED_HEAD =
`// **NOT TO BE USED IN PRODUCTION**
// v3 loader compiled by Springboard
// created for Springboard use only

var SearchSpring = SearchSpring || {};

SearchSpring.Hooke = `;

const LOADER_GENERATED_FOOT =
`;

(function() {
	var head = document.head || document.getElementsByTagName('head')[0]

	var location;
	if (window.location.port) {
		location = '//' + window.location.host + '/sites/';
	} else {
		location = '//' + SearchSpring.Hooke.cdn + '/'
	}
	location += SearchSpring.Hooke.site + '/' + SearchSpring.Hooke.catalog + '/';

	var style = document.createElement('link');
	style.type = 'text/css';
	style.rel = 'stylesheet';
	style.href = location + 'generated/stylesheet.css';

	head.appendChild(style);

	var context = SearchSpring.Hooke.context ? (' ' + SearchSpring.Hooke.context) : '';

	if (SearchSpring.Hooke.proxy && SearchSpring.Hooke.proxy.catalog && SearchSpring.Hooke.proxy.catalog == 'smc') {
		context += SearchSpring.Hooke.proxy.context ? (' ' + SearchSpring.Hooke.proxy.context) : '';
		document.write(unescape('%3Cscript src="//cdn.searchspring.net/search/v3/js/searchspring.catalog.js?' + SearchSpring.Hooke.siteid + '"' + context + '%3E%3C/script%3E'));
	} else {
		context += ' external="' + location + 'generated/' + SearchSpring.Hooke.catalog + '.js"';
		document.write(unescape('%3Cscript src="//cdn.searchspring.net/search/v3/js/searchspring.catalog.springboard.js?' + SearchSpring.Hooke.siteid + '"' + context + '%3E%3C/script%3E'));
	}
})();`;

const variables = {
	COMPILE_DIR,
	COMPILED_LOADER,
	COMPILED_JS,
	COMPILED_JS_VARIABLES,
	COMPILED_SASS,
	COMPILED_SASS_MODULES,
	COMPILED_SASS_VARIABLES,
	COMPILED_TEMPLATES,
	MODULE_DIR,
	JS_DIR,
	TEMPLATES_DIR,
	SASS_DIR,
	DEFAULT_SASS,
	DEFAULT_TEMPLATE,
	CATALOG_GENERATED_HEAD,
	CATALOG_GENERATED_MID,
	CATALOG_GENERATED_FOOT,
	LOADER_GENERATED_HEAD,
	LOADER_GENERATED_FOOT
}

module.exports = {
	variables: variables
}
