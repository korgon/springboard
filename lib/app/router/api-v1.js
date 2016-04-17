// springboard
// api for mockups
// not restful... just whatever is needed is GETed and POSTed

/*
/api/v1/
------------------
/api/sites
/api/site
/api/site/edit
/api/site/commit
/api/site/push
/api/site/reset




*/

'use strict';

const ILLEGAL_NAMES = ['build', 'catalog', 'catalogs', 'css', 'generate', 'generated', 'html', 'img', 'image', 'images', 'js', 'javascript', 'module', 'modules', 'plugin', 'plugins', 'scss', 'sass', 'theme', 'themes', 'template'];

// must pass in the springboard dependency
module.exports = function(springboard) {
	return {

		// get every site in object notation
		sites: function*() {
			this.response.type = 'json';
			this.response.body = springboard.getSites();
		},

		// stop editing and load sites
		loadSites: function*() {
			let ignore = this.params.ignore;
			try {
				let data = yield springboard.loadSites((ignore) ? true : false);
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = err;
			}
		},

		// get the current site or a specific one
		site: function*() {
			let data = springboard.getSite(this.params.site);
			this.response.type = 'json';
			this.response.body = data;
		},

		// determine which site to edit
		// runs the editSite function that triggers watches of js/scss/html
		edit: function*() {
			try {
				let site = springboard.getSite(this.params.site);
				if (site.error) {
					throw("Site is invalid");
				} else {
					 let data = yield springboard.editSite(site.name);
					 this.response.type = 'json';
					 this.response.body = data;
				 }
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = { error: true, message: 'could not edit ' + this.params.site };
			}
		},

		publishMockup: function*() {
			try {
				let data = yield springboard.publishSiteMockup();
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = { error: true, message: 'site could not be published' };
			}
		},

		publishLive: function*() {
			try {
				let data = yield springboard.publishSiteMockup();
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = { error: true, message: 'site could not be published' };
			}
		},

		status: function*() {
			try {
				let data = yield springboard.gitStatus();
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = { error: true, message: 'site git status undetermined' };
			}
		},

		// commit the current site
		commit: function*() {
			let message = this.request.body.fields.message || '';
			if (message.trim() == '') message = false;

			try {
				let data = yield springboard.commitSite(message);
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = err;
			}
		},

		// push the current site
		push: function*() {
			try {
				let data = yield springboard.pushSite();
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = err;
			}
		},

		// reload the current site
		reload: function*() {
			try {
				let data = yield springboard.reloadSite();
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = err;
			}
		},

		// reset the current site
		reset: function*() {
			try {
				let data = yield springboard.resetSite();
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = err;
			}
		},

		merge: function*() {
			try {
				// let data = yield springboard.mergeSite();
				let data = { error: false, message: 'not really merged dude...' };
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				console.log(err);
				this.response.type = 'json';
				this.response.body = { error: true, message: 'site could not be merged' };
			}
		},

		// add new site
		create: function*() {
			this.response.type = 'json';
			let newsite = this.request.body.fields;
			let site;

			if (!newsite.name || !newsite.siteid || !newsite.cart) {
				this.response.status = 400;
				this.response.body = { error: true, message: 'missing required fields' };
				return;
			}

			// purify all things
			newsite.name = newsite.name.toLowerCase();
			newsite.siteid = newsite.siteid.toLowerCase();
			newsite.cart = newsite.cart.toLowerCase();

			// check if domain name format (example.com)
			if (!newsite.name.match(/^[^\_\.]\w+\.\w{2,}$/i)) {
				this.response.status = 400;
				this.response.body = { error: true, message: 'invalid sitename' };
				return;
			}
			// check if exactly 6 characters, number or letter (siteid)
			if (!newsite.siteid.match(/^[a-z0-9]{6}$/i)) {
				this.response.status = 400;
				this.response.body = { error: true, message: 'invalid siteid' };
				return;
			}

			try {
				site = yield springboard.addSite(newsite);
				//let site = { error: false, message: 'site created success!' };
			}
			catch(err) {
				this.response.status = 400;
				this.response.body = { error: true, message: err.message };
				return;
			}

			this.response.body = site;
		},

		update: function*() {
			this.response.type = 'json';
			let changes = this.request.body.fields;
			springboard.updateSite(changes);
			this.response.body = springboard.getSite();
		},


		// UIs, modules and themes
		library: function*() {
			let response;
			if (this.params.catalog) {
				response = springboard.getCatalog(this.params.catalog);
			} else {
				response = springboard.getLibrary();
			}
			this.response.type = 'json';
			this.response.body = response;
		},

		install: function*() {
			this.response.type = 'json';

			let response;
			let info = this.request.body.fields;

			try {
				if (info.install == 'ui') {
					if (info.name) {
						info.name = info.name.toLowerCase();
						if (ILLEGAL_NAMES.indexOf(info.name) >= 0 || !info.name.match(/^\w{2,}$/)) {
							this.response.body = { error: true, message: 'Invalid module name!' };
							return;
						}
					} else {
						this.response.body = { error: true, message: 'Module name is required!' };
						return;
					}
					// install UI
					response = yield springboard.installCatalog(info);
				} else if (info.install == 'module') {
					info.catalog = info.catalog.toLowerCase();
					info.module = info.module.toLowerCase();
					// install module
					response = yield springboard.installModule(info);
				} else if (info.install == 'theme') {
					info.catalog = info.catalog.toLowerCase();
					info.module = info.module.toLowerCase();
					info.theme = info.theme.toLowerCase();
					// install theme
					response = yield springboard.installTheme(info);
				} else {
					this.response.body = { error: true, message: 'Invalid install type!' };
					return;
				}

				this.response.body = response;
			} catch (err) {
				this.response.body = err;
			}

		}

	};
};
