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

const ILLEGAL_NAMES = ['build', 'catalog', 'catalogs', 'css', 'generate', 'generated', 'html', 'img', 'image', 'images', 'js', 'javascript', 'module', 'modules', 'plugin', 'plugins', 'scss', 'sass', 'theme', 'themes', 'thumbs', 'template'];

// must pass in the springboard dependency
module.exports = function(springboard) {
	return {

		// springboard status
		status: function*() {
			this.response.type = 'json';
			this.response.body = springboard.getStatus();
		},

		// get user data
		getUser: function*() {
			this.response.type = 'json';
			this.response.body = springboard.getUser();
		},

		// put user data
		putUser: function*() {
			this.response.type = 'json';
			let userdata = this.request.body.fields;

			userdata.email = userdata.email.toLowerCase();

			// check if username is valid
			if (!userdata.name.match(/^[\ |\w]{3,}$/)) {
				this.response.status = 400;
				this.response.body = { error: true, message: 'invalid username' };
				return;
			}

			// check if email is valid
			if (!userdata.email.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)) {
				this.response.status = 400;
				this.response.body = { error: true, message: 'invalid email' };
				return;
			}

			// check if s3 id is valid
			if (!userdata.s3.key_id.match(/^\w{20}$/)) {
				this.response.status = 400;
				this.response.body = { error: true, message: 'invalid s3 id' };
				return;
			}

			// check if s3 id is valid
			if (!userdata.s3.key_secret.match(/^[\W|\w]{40}$/)) {
				this.response.status = 400;
				this.response.body = { error: true, message: 'invalid s3 secret' };
				return;
			}

			this.response.body = springboard.updateUser(userdata);
		},

		// get every site in object notation
		sites: function*() {
			this.response.type = 'json';
			this.response.body = springboard.getSites();
		},

		// stop editing and load sites
		loadSites: function*() {
			let ignore = (this.params.ignore ? true : false);
			try {
				let data = yield springboard.loadSites(ignore);
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = err;
			}
		},

		// get the current site or a specific one
		getSite: function*() {
			let data = springboard.getSite(this.params.site);
			this.response.type = 'json';
			this.response.body = data;
		},

		// determine which site to edit
		// runs the editSite function that triggers watches of js/scss/html
		editSite: function*() {
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

		publishSite: function*() {
			try {
				let data = yield springboard.publishSite();
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				this.response.type = 'json';
				this.response.body = { error: true, message: 'site could not be published' };
			}
		},

		gitStatus: function*() {
			try {
				let data = yield springboard.gitStatus();
				this.response.type = 'json';
				this.response.body = data;
			}
			catch(err) {
				console.log(err);
				this.response.type = 'json';
				this.response.body = { error: true, message: 'site git status undetermined' };
			}
		},

		// commit the current site
		commitSite: function*() {
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
		pushSite: function*() {
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
		reloadSite: function*() {
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
		resetSite: function*() {
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

		// add new site
		addSite: function*() {
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

		updateSite: function*() {
			this.response.type = 'json';
			let changes = this.request.body.fields;
			springboard.updateSite(changes);
			this.response.body = springboard.getSite();
		},


		// UIs, modules and themes
		getLibrary: function*() {
			let response;
			if (this.params.catalog) {
				response = springboard.getCatalog(this.params.catalog);
			} else {
				response = springboard.getLibrary();
			}
			this.response.type = 'json';
			this.response.body = response;
		},

		installCatalog: function*() {
			this.response.type = 'json';

			let info = this.request.body.fields;

			try {
				// install UI
				if (info.name) {
					info.name = info.name.toLowerCase().trim();
					if (ILLEGAL_NAMES.indexOf(info.name) >= 0 || !info.name.match(/^\w{2,}$/)) {
						this.response.body = { error: true, message: 'Invalid (reserved) name!' };
						return;
					}
				} else {
					this.response.body = { error: true, message: 'Name is required!' };
					return;
				}

				this.response.body = yield springboard.installCatalog(info);
			} catch (err) {
				this.response.body = err;
			}
		},

		// update ui
		updateCatalog: function*() {
			this.response.type = 'json';

			// going to trust that this data is sanitary for now...
			let info = this.request.body.fields;
			let catalog = this.params.catalog.toLowerCase().trim();

			try {
				if (catalog && info) {
					this.response.body = yield springboard.updateCatalog(catalog, info);
					return;
				} else {
					this.response.body = { error: true, message: 'Catalog!' };
					return;
				}
			} catch (err) {
				this.response.body = err;
			}
		},

		// install module
		installModule: function*() {
			this.response.type = 'json';

			// going to trust that this data is sanitary for now...
			let info = this.request.body.fields;
			let catalog = this.params.catalog.toLowerCase().trim();

			if (catalog) {
				//this.response.body = springboard.updateCatalog(catalog, info);
				this.response.body = { error: true, message: catalog + ' install module' };
				return;
			} else {
				this.response.body = { error: true, message: 'Catalog!' };
				return;
			}
		},

		// update module
		updateModule: function*() {
			this.response.type = 'json';

			// going to trust that this data is sanitary for now...
			let info = this.request.body.fields;
			let catalog = this.params.catalog.toLowerCase().trim();
			let mod = this.params.module.toLowerCase().trim();

			try {
				if (catalog && mod) {
					this.response.body = yield springboard.updateModule(catalog, mod, info);
					return;
				} else {
					this.response.body = { error: true, message: 'Catalog and module required!' };
					return;
				}
			} catch (err) {
				this.response.body = err;
			}
		},

		// install theme
		installTheme: function*() {
			this.response.type = 'json';

			// going to trust that this data is sanitary for now...
			let info = this.request.body.fields;
			let catalog = this.params.catalog.toLowerCase().trim();
			let mod = this.params.module.toLowerCase().trim();

			try {
				if (catalog && mod) {
					// install theme
					info.catalog = catalog;
					info.module = mod;
					info.theme = info.theme.toLowerCase();

					this.response.body = yield springboard.installTheme(info);
					return;
				} else {
					this.response.body = { error: true, message: 'Catalog and module required!' };
					return;
				}
			} catch (err) {
				this.response.body = err;
			}
		},

		// update theme
		updateTheme: function*() {
			this.response.type = 'json';

			// going to trust that this data is sanitary for now...
			let info = this.request.body.fields;
			let catalog = this.params.catalog.toLowerCase().trim();
			let mod = this.params.module.toLowerCase().trim();
			let theme = this.params.theme.toLowerCase().trim();

			try {
				if (catalog && mod && theme) {
					this.response.body = yield springboard.updateModuleTheme(catalog, mod, theme, info);
					return;
				} else {
					this.response.body = { error: true, message: 'Catalog, module and theme required!' };
					return;
				}
			} catch (err) {
				this.response.body = err;
			}
		}

	};
};
