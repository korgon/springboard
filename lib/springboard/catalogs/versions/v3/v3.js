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
	DEFAULT_TEMPLATE
}

module.exports = {
	variables: variables
}
