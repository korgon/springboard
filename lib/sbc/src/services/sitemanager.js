'use strict';

// sitemanager
// manages site data

// not really doing it properly at the moment...
// the service could be storing things and preventing extra api requests

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
		gitStatus: gitStatus,
		loadSites: loadSites,
		fetchSites: fetchSites,
		getSites: getSites,
		getSite: getSite,
		getSiteFiles: getSiteFiles,
		getSiteS3: getSiteS3,
		captureSite: captureSite,
		createSite: createSite,
		updateSite: updateSite,
		editSite: editSite,
		commitSite: commitSite,
		reloadSite: reloadSite,
		resetSite: resetSite,
		pushSite: pushSite,
		publishFile: publishFile,
		publishSite: publishSite,
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
		}).then(function(response, status, headers) {
			promise.resolve(response.data);
		}).catch(function(err) {
			promise.reject(err.data);
		});

		return promise.promise;
	}

	// triggers complete reload of sites (including pull)
	// return sites objects
	function fetchSites() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/sites/fetch'
		}).then(function(response, status, headers) {
			// empty site object
			if (response.data.error) {
				promise.reject(response.data);
			} else {
				site = {};
				sites = response.data;
				promise.resolve(sites);
			}
		}).catch(promise.reject);

		return promise.promise;
	}

	// triggers reload of sites
	// return sites objects
	function loadSites(ignore) {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: (ignore) ? '/api/sites/load/ignore' : '/api/sites/load'
		}).then(function(response, status, headers) {
			// empty site object
			if (response.data.error) {
				promise.reject(response.data);
			} else {
				site = {};
				sites = response.data;
				promise.resolve(sites);
			}
		}).catch(promise.reject);

		return promise.promise;
	}

	// return sites objects
	function getSites() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/sites'
		}).then(function(response, status, headers) {
			// empty site object
			site = {};
			sites = response.data;
			promise.resolve(sites);
		}).catch(promise.reject);

		return promise.promise;
	}

	// get current details of site under edit
	function getSite() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/site'
		}).then(function(response, status, headers) {
			if (response.data.error) {
				promise.reject(response.data.message);
			}
			site = response.data;
			promise.resolve(site);
		}).catch(promise.reject);

		return promise.promise;
	}

	// get current file structure of site under edit
	function getSiteFiles() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/site/files'
		}).then(function(response, status, headers) {
			if (response.data.error) {
				promise.reject(response.data);
			}
			promise.resolve(response.data);
		}).catch(promise.reject);

		return promise.promise;
	}

	// get current file structure of s3
	function getSiteS3() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/site/s3'
		}).then(function(response, status, headers) {
			if (response.data.error) {
				promise.reject(response.data);
			}
			promise.resolve(response.data);
		}).catch(promise.reject);

		return promise.promise;
	}

	// update site
	function captureSite(info) {
		var promise = $q.defer();

		$http({
			method: 'POST',
			data: info,
			url: '/api/site/capture'
		}).then(function(response, status, headers) {
			if (response.data.error) {
				promise.reject(response.data);
			}
			promise.resolve(response.data);
		}).catch(promise.reject);

		return promise.promise;
	}

	// switch to a new site for editing
	function createSite(site) {
		var promise = $q.defer();

		$http({
			method: 'POST',
			data: site,
			url: '/api/create'
		}).then(function(response, status, headers) {
			if (response.data.error) {
				promise.reject(response.data);
			}
			return getSites();
		}).then(function(sites) {
			promise.resolve(sites);
		}).catch(function(err) {
			promise.reject(err.data);
		});

		return promise.promise;
	}

	// update site
	function updateSite(updatedsite) {
		var promise = $q.defer();

		$http({
			method: 'POST',
			data: updatedsite,
			url: '/api/site'
		}).then(function(response, status, headers) {
			if (response.data.error) {
				promise.reject(response.data);
			}
			site = response.data;
			promise.resolve(site);
		}).catch(promise.reject);

		return promise.promise;
	}

	// switch to a new site for editing
	function editSite(site, ignore) {
		var promise = $q.defer();

		var url = '/api/edit/' + site;;
		if (ignore) url += '/offline';

		$http({
			method: 'GET',
			url: url
		}).then(function(response, status, headers) {
			if (response.data.error) {
				promise.reject(response.data);
			}
			// empty the sites object
			sites = {}
			site = response.data;
			promise.resolve(site);
		}).catch(function(err) {
			promise.reject(err.data);
		});

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
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data);
				} else {
					promise.resolve(response.data);
				}
			}).catch(promise.reject);
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
		}).then(function(response, status, headers) {
			if (response.data.error) {
				promise.reject(response.data.message);
			} else {
				promise.resolve(response.data);
			}
		}).catch(function(err) {
			promise.reject(err.data);
		});

		return promise.promise;
	}

	// reload the site
	function reloadSite() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/site/reload'
		}).then(function(response, status, headers) {
			if (response.data.error) {
				promise.reject(response.data.message);
			} else {
				site = response.data;
				promise.resolve(response.data);
			}
		}).catch(promise.reject);

		return promise.promise;
	}

	// (save) commit the site locally
	function pushSite() {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'GET',
				url: '/api/site/push'
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data);
				} else {
					promise.resolve(response.data);
				}
			}).catch(function(err) {
				return promise.reject(err.data);
			});
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	function publishFile(info) {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'POST',
				data: info,
				url: '/api/site/publish'
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data);
				} else {
					promise.resolve(response.data);
				}
			}).catch(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	function publishSite() {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'GET',
				url: '/api/site/publish'
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data);
				} else {
					promise.resolve(response.data);
				}
			}).catch(promise.reject);
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
		}).then(function(response, status, headers) {
			if (response.data.error) {
				promise.reject(response.data.message);
			} else {
				promise.resolve(response.data);
			}
		}).catch(promise.reject);

		return promise.promise;
	}

	// install a UI (catalog)
	function installUI(ui) {
		var promise = $q.defer();

		var install = {
			install: 'ui',
			name: ui.name,
			type: ui.type,
			cart: ui.cart
		};

		if (site.name) {
			$http({
				method: 'POST',
				data: install,
				url: '/api/site/install'
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data);
				} else {
					site = response.data;
					promise.resolve(response.data);
				}
			}).catch(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

	// update UI (catalog)
	function updateUI(ui) {
		var promise = $q.defer();

		if (site.name) {
			$http({
				method: 'POST',
				data: ui,
				url: '/api/site/' + ui.name
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data);
				} else {
					site = response.data;
					promise.resolve(response.data);
				}
			}).catch(promise.reject);
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
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data.message);
				} else {
					promise.resolve();
				}
			}).catch(promise.reject);
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
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data);
				} else {
					site = response.data;
					promise.resolve(response.data);
				}
			}).catch(promise.reject);
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
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data);
				} else {
					site = response.data;
					promise.resolve(site);
				}
			}).catch(promise.reject);
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
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data);
				} else {
					site = response.data;
					promise.resolve(response.data);
				}
			}).catch(promise.reject);
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
			}).then(function(response, status, headers) {
				if (response.data.error) {
					promise.reject(response.data);
				} else {
					site = response.data;
					promise.resolve(response.site);
				}
			}).catch(promise.reject);
		} else {
			promise.reject({ error: true, message: 'Not editing any site!'});
		}

		return promise.promise;
	}

}
