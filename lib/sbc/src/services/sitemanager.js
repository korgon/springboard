'use strict';

// services...

// sitemanager
// manages site data

angular
	.module('springboardApp')
	.factory('sitemanager', sitemanager);

sitemanager.$inject = ['$http', '$q', '$timeout'];

function sitemanager($http, $q, $timeout) {
	// object containing every site object
	var sites = {};
	// object containing the current (editing) site
	var site = {};

	// service api
	return({
		// reloadSites: function() { return reloadSites(); },
		gitStatus: gitStatus,
		loadSites: loadSites,
		getSites: getSites,
		getSite: getSite,
		getSiteFiles: getSiteFiles,
		createSite: createSite,
		updateSite: updateSite,
		editSite: editSite,
		commitSite: commitSite,
		reloadSite: reloadSite,
		resetSite: resetSite,
		pushSite: pushSite,
		publishSiteMockup: publishSiteMockup,
		getUIs: getUIs,
		installUI: installUI,
		updateUI: updateUI,
		compileUI: compileUI,
		installModule: installModule,
		updateModule: updateModule,
		installModuleTheme: installModuleTheme,
		updateModuleTheme: updateModuleTheme
	});

	// get current repo status
	function gitStatus() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/git'
		}).success(function(data, status, headers) {
			promise.resolve(data);
		}).error(promise.reject);

		return promise.promise;
	}

	// triggers complete reload of sites (including pull)
	// return sites objects
	function loadSites(ignore) {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: (ignore) ? '/api/sites/load/ignore' : '/api/sites/load'
		}).success(function(data, status, headers) {
			// empty site object
			if (data.error) {
				promise.reject(data);
			} else {
				site = {};
				sites = data;
				promise.resolve(sites);
			}
		}).error(promise.reject);

		return promise.promise;
	}

	// return sites objects
	function getSites() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/sites'
		}).success(function(data, status, headers) {
			// empty site object
			site = {};
			sites = data;
			promise.resolve(sites);
		}).error(promise.reject);

		return promise.promise;
	}

	// get current details of site under edit
	function getSite() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/site'
		}).success(function(data, status, headers) {
			if (data.error) {
				promise.reject(data.message);
			}
			site = data;
			promise.resolve(site);
		}).error(promise.reject);

		return promise.promise;
	}

	// get current file structure of site under edit
	function getSiteFiles() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/site/files'
		}).success(function(data, status, headers) {
			if (data.error) {
				promise.reject(data.message);
			}
			promise.resolve(data);
		}).error(promise.reject);

		return promise.promise;
	}

	// switch to a new site for editing
	function createSite(site) {
		var promise = $q.defer();

		$http({
			method: 'POST',
			data: site,
			url: '/api/create'
		}).success(function(data, status, headers) {
			if (data.error) {
				promise.reject(data.message);
			}
			getSites().then(function(sites) {
				promise.resolve(sites);
			}).catch(function(err) {
				promise.reject();
			});
		}).error(promise.reject);

		return promise.promise;
	}

	// update site
	function updateSite(updatedsite) {
		var promise = $q.defer();

		$http({
			method: 'POST',
			data: updatedsite,
			url: '/api/site'
		}).success(function(data, status, headers) {
			if (data.error) {
				promise.reject(data.message);
			}
			site = data;
			promise.resolve(site);
		}).error(promise.reject);

		return promise.promise;
	}

	// switch to a new site for editing
	function editSite(site) {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/edit/' + site
		}).success(function(data, status, headers) {
			if (data.error) {
				promise.reject(data);
			}
			// empty the sites object
			sites = {}
			site = data;
			promise.resolve(site);
		}).error(promise.reject);

		return promise.promise;
	}

	// (save) commit the site locally
	function commitSite(commit_message) {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'POST',
				data: { message: commit_message },
				url: '/api/site/commit'
			}).success(function(data, status, headers) {
				if (data.error) {
					promise.reject(data.message);
				} else {
					promise.resolve(data);
				}
			}).error(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	// reset the changes made to the site
	function resetSite() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/site/reset'
		}).success(function(data, status, headers) {
			if (data.error) {
				promise.reject(data.message);
			} else {
				promise.resolve(data);
			}
		}).error(promise.reject);

		return promise.promise;
	}

	// reload the site
	function reloadSite() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/site/reload'
		}).success(function(data, status, headers) {
			if (data.error) {
				promise.reject(data.message);
			} else {
				site = data;
				promise.resolve(data);
			}
		}).error(promise.reject);

		return promise.promise;
	}

	// (save) commit the site locally
	function pushSite() {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'GET',
				url: '/api/site/push'
			}).success(function(data, status, headers) {
				if (data.error) {
					promise.reject(data.message);
				} else {
					promise.resolve(data);
				}
			}).error(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	function publishSiteMockup() {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'GET',
				url: '/api/site/publish/mockup'
			}).success(function(data, status, headers) {
				if (data.error) {
					promise.reject(data.message);
				} else {
					promise.resolve(data);
				}
			}).error(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	// get a listing of available UIs
	function getUIs() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/library'
		}).success(function(data, status, headers) {
			if (data.error) {
				promise.reject(data.message);
			} else {
				promise.resolve(data);
			}
		}).error(promise.reject);

		return promise.promise;
	}

	// install a UI (catalog)
	function installUI(ui) {
		var promise = $q.defer();

		var install = {
			install: 'ui',
			name: ui.name,
			type: ui.type
		};

		if (site.name) {
			$http({
				method: 'POST',
				data: install,
				url: '/api/site/install'
			}).success(function(data, status, headers) {
				if (data.error) {
					promise.reject(data);
				} else {
					site = data;
					promise.resolve(data);
				}
			}).error(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	// install a UI (catalog)
	function updateUI(ui) {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'POST',
				data: ui,
				url: '/api/site/' + ui.name
			}).success(function(data, status, headers) {
				if (data.error) {
					promise.reject(data);
				} else {
					site = data;
					promise.resolve(data);
				}
			}).error(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	// force compile a ui (catalog)
	function compileUI(name) {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'POST',
				data: { name: name },
				url: '/api/site/compile'
			}).success(function(data, status, headers) {
				if (data.error) {
					promise.reject(data.message);
				} else {
					promise.resolve();
				}
			}).error(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	// install module
	function installModule(catalog_name, info) {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'POST',
				data: info,
				url: '/api/site/' + catalog_name + '/install'
			}).success(function(data, status, headers) {
				if (data.error) {
					promise.reject(data);
				} else {
					site = data;
					promise.resolve(data);
				}
			}).error(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	// update module
	// used for selecting theme and disabling/enabling
	function updateModule(catalog_name, mod) {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'POST',
				data: mod,
				url: '/api/site/' + catalog_name + '/' + mod.name
			}).success(function(data, status, headers) {
				if (data.error) {
					promise.reject(data);
				} else {
					site = data;
					promise.resolve(site);
				}
			}).error(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	// install module theme
	function installModuleTheme(catalog_name, mod_name, theme_name) {
		var promise = $q.defer();

		var install = {
			theme: theme_name
		};

		if (site.name) {
			$http({
				method: 'POST',
				data: install,
				url: '/api/site/' + catalog_name + '/' + mod_name + '/install'
			}).success(function(data, status, headers) {
				if (data.error) {
					promise.reject(data);
				} else {
					site = data;
					promise.resolve(data);
				}
			}).error(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	// update module theme
	function updateModuleTheme(catalog_name, mod_name, theme) {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'POST',
				data: theme,
				url: '/api/site/' + catalog_name + '/' + mod_name + '/' + theme.name
			}).success(function(data, status, headers) {
				if (data.error) {
					promise.reject(data);
				} else {
					site = data;
					promise.resolve(site);
				}
			}).error(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

}
