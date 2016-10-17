// user "class"
// to be used at some point?

// strictness!
"use strict";

/*
USER
email
name
update config()
switchSite()

*/
const MAX_NUMBER_OF_RECENTS = 12;

const USER_DEFAULTS = {
	"user": {
		"name": "",
		"email": "",
		"s3": {
			"key_id": "",
			"key_secret": ""
		}
	},
	"shortkeys": {

	},
	"settings": {
		"eslint": {
			"label": "enable linting",
			"value": true,
			"default": true,
			"type": "boolean",
			"description": "enable linting of JS files (eslint)"
		},
		"bscss": {
			"label": "browsersync css",
			"value": true,
			"default": true,
			"type": "boolean",
			"description": "when enabled browsersync will inject style changes on CSS file change"
		},
		"bshtml": {
			"label": "browsersync html",
			"value": true,
			"default": true,
			"type": "boolean",
			"description": "when enabled browsersync will refresh the browser on HTML file change"
		},
		"bsjs": {
			"label": "browsersync js",
			"value": true,
			"default": true,
			"type": "boolean",
			"description": "when enabled browsersync will refresh the browser on JS file change"
		}
	},
	"misc": {
		"recent_sites": []
	}
}


const fspro = require('_/fspro');
const library = require('./catalogs');

// user factory
const user = (json_file, data) => {
	let state = {
		json_file,
		current_site: data.misc.recent_sites[data.misc.recent_sites.length - 1] || '',
		data
	}

	return Object.assign(
		{},
		getCurrentSite(state),
		getData(state),
		getName(state),
		getEmail(state),
		getRecents(state),
		getS3(state),
		update(state),
		reload(state),
		switchSite(state)
	)
}

const getCurrentSite = (state) => ({
	getCurrentSite: () => {
		return state.current_site;
	}
});

const getData = (state) => ({
	getData: () => {
		return state.data;
	}
});

const getName = (state) => ({
	getName: () => {
		return state.data.user.name;
	}
});

const getEmail = (state) => ({
	getEmail: () => {
		return state.data.user.email;
	}
});

const getRecents = (state) => ({
	getRecents: () => {
		return state.data.misc.recent_sites;
	}
});

const getS3 = (state) => ({
	getS3: () => {
		return state.data.user.s3;
	}
});

const update = (state) => ({
	update: (details) => {
		if (details) {
			if (fspro.compareKeys(state.data, details)) {
				state.data = details;
				return save(state).then(() => {
					return state.data;
				}).catch(err => {
					if (err && err.message) err.message = 'user update(): ' + err.message;
					throw err;
				});
			} else {
				return Promise.reject(new Error('user update(): Object key mismatch!'));
			}
		} else {
			return Promise.reject(new Error('user update(): No details provided.'));
		}
	}
});

const reload = (state) => ({
	reload: () => {
		return fspro.getJSON(state.json_file).then(contents => {
			if (contents && contents.user.s3) {
				state.data = contents;
				state.current_site = state.data.misc.recent_sites[state.data.misc.recent_sites.length - 1]
				return;
			} else {
				throw new Error('Bad user data!')
			}
		}).catch(err => {
			if (err && err.message) err.message = 'user reload(): ' + err.message;
			throw err;
		})
	}
});

const switchSite = (state) => ({
	switchSite: (site_name) => {
		let recents = state.data.misc.recent_sites.indexOf(site_name);
		if (recents != -1) {
			state.data.misc.recent_sites.splice(recents, 1);
		}

		if (state.data.misc.recent_sites.push(site_name) > MAX_NUMBER_OF_RECENTS) {
			state.data.misc.recent_sites.shift();
		}
		state.current_site = site_name;

		return save(state);
	}
});

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


const save = (state) => {
	return fspro.putJSON(state.json_file, state.data);
}


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// module exports
module.exports = function(path) {
	let json_file = path;
	let json_data;

	// load user json if it exists
	return fspro.exists(json_file).then(stats => {
		if (stats) {
			// it exists! proceed...
			return Promise.resolve();
		} else {
			// create default user config when it doesn't exist
			return fspro.writeFile(json_file, JSON.stringify(USER_DEFAULTS, null, 2));
		}
	}).then(() => {
		// load user json
		return fspro.getJSON(json_file);
	}).then(data => {
		if (data && data.user.s3) {
			json_data = data;

			// proceed
			return Promise.resolve();
		} else {
			throw new Error('Bad user data!')
		}
	}).then(() => {
		return user(json_file, json_data);
	}).catch(err => {
		if (err && err.message) err.message = 'user load: ' + err.message;
		throw err;
	});
}
