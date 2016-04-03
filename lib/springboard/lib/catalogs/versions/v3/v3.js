// misc tools used for building v3 catalogs

'use strict';

// Constants
const COMPILE_DIR = "generated";
const MODULE_DIR = "modules";
const JS_DIR = "js";
const TEMPLATES_DIR = "templates";
const SASS_DIR = "scss";

// defaults
const DEFAULT_SASS =
`/* springboard generated styles for v3 */
@import "._variables.scss";
@import "._modules.scss";`;
const DEFAULT_TEMPLATE = '<script type="text/ss-template" target=""></script>';

const variables = {
	COMPILE_DIR,
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
