// misc tools used for building v3 catalogs

'use strict';

// Directories
const COMPILE_DIR = 'generated';
const MODULE_DIR = 'modules';
const JS_DIR = 'js';
const SASS_DIR = 'scss';
const TEMPLATES_DIR = 'templates';

// Files
const COMPILED_JS = 'scripts.js';
const COMPILED_SASS = 'stylesheet.css';
const COMPILED_TEMPLATES = 'templates.html';


// defaults
const DEFAULT_SASS =
`/* springboard generated styles for v3 */
@import "._variables.scss";
@import "._modules.scss";`;
const DEFAULT_TEMPLATE = '<script type="text/ss-template" target=""></script>';

// used for generating catalog.js (similar to angular.js in SMC)
const DEFAULT_GENERATED_HEAD =
`// **NOT TO BE USED IN PRODUCTION**
// v3 catalog templates and js compiled by Springboard
// made to be used in conjuntion with Hooke

SearchSpring.Catalog.templates.useExternalTemplates = false;

SearchSpring.Hooke = SearchSpring.Hooke || {};
SearchSpring.Hooke.templateData = '`;
const DEFAULT_GENERATED_MID =
`';


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
	COMPILED_JS,
	COMPILED_SASS,
	COMPILED_TEMPLATES,
	MODULE_DIR,
	JS_DIR,
	TEMPLATES_DIR,
	SASS_DIR,
	DEFAULT_SASS,
	DEFAULT_TEMPLATE,
	DEFAULT_GENERATED_HEAD,
	DEFAULT_GENERATED_MID,
	DEFAULT_GENERATED_FOOT
}

module.exports = {
	variables: variables
}
