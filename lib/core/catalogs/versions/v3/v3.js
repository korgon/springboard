// misc tools used for building v3 catalogs

'use strict';

// Directories
const COMPILE_DIR = 'generated';
const MODULE_DIR = 'modules';
const JS_DIR = 'js';
const SASS_DIR = 'scss';
const TEMPLATES_DIR = 'templates';

// Files
const COMPILED_CATALOG = 'catalog.js';
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
const DEFAULT_GENERATED_HEAD =
`// **NOT TO BE USED IN PRODUCTION**
// v3 catalog templates and js compiled by Springboard
// made to be used in conjuntion with Hooke

var SearchSpring = SearchSpring || {};

SearchSpring.Hooke = `;
const DEFAULT_GENERATED_UPPERMID =
`;

(function() {
	var head = document.head || document.getElementsByTagName('head')[0]

	var location = '//';
	if (window.location.host.indexOf('localhost') != -1) {
		location += window.location.host + '/sites/';
	} else {
		location += SearchSpring.Hooke.cdn + '/'
	}
	location += SearchSpring.Hooke.site + '/' + SearchSpring.Hooke.catalog + '/';


	var style = document.createElement('link');
	style.type = 'text/css';
	style.rel = 'stylesheet';
	style.href = location + 'generated/stylesheet.css';

	head.appendChild(style);

	document.write(unescape('%3Cscript src="//cdn.searchspring.net/search/v3/js/searchspring.catalog.js?' + SearchSpring.Hooke.siteid + '" search="' + SearchSpring.Hooke.query + '" onLoad="SearchSpring.Hooke.hijackv3()"%3E%3C/script%3E'));
})();

SearchSpring.Hooke.hijackv3 = function() {
	// prevent use of external templates
	SearchSpring.Catalog.templates.useExternalTemplates = false;

	SearchSpring.Hooke.templateData = '`;
const DEFAULT_GENERATED_LOWERMID =
`';
}

// init functions
window.SearchSpringInit = function() {

	this.on('afterBootstrap', function() {
		SearchSpring.Catalog.templates.store().append(SearchSpring.Hooke.templateData);
		//SearchSpring.Catalog.fire('_templates/afterStore');
	});

	// begin custom init code
`;
const DEFAULT_GENERATED_FOOT =
`	// end custom init code

}`;

const variables = {
	COMPILE_DIR,
	COMPILED_CATALOG,
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
	DEFAULT_GENERATED_HEAD,
	DEFAULT_GENERATED_UPPERMID,
	DEFAULT_GENERATED_LOWERMID,
	DEFAULT_GENERATED_FOOT
}

module.exports = {
	variables: variables
}
