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
		installModuleTheme: installModuleTheme
	});

	// get current repo status
	function gitStatus() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/site/status'
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
			site = {};
			sites = data;
			promise.resolve(sites);
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

	// switch to a new site for editing
	function createSite(site) {
		var promise = $q.defer();

		$http({
			method: 'POST',
			data: site,
			url: '/api/site/create'
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
			url: '/api/site/update'
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
			url: '/api/site/edit/' + site
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

	// install a ui theme
	function installModuleTheme(info) {
		var promise = $q.defer();

		var install = {
			install: 'theme',
			module: info.module,
			theme: info.theme
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

}
