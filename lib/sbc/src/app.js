'use strict';

// main app
// version 1.1.0

angular
	.module('springboardApp', [
		'ngRoute',
		'hc.marked'
	])
	// markdown config
	.config(['markedProvider', function (markedProvider) {
		markedProvider.setOptions({
			gfm: true,
			tables: true,
			highlight: function (code, lang) {
				if (lang) {
					return hljs.highlight(lang, code, true).value;
				} else {
					return hljs.highlightAuto(code).value;
				}
			}
		});
	}])
	// routerprovider config
	.config(['$routeProvider', '$locationProvider',
		function($routeProvider, $locationProvider) {
			$locationProvider.html5Mode({
				enabled: true,
				requireBase: false
			});

			$routeProvider.
				// TODO make some sort of dashboard
			when('/', {
				title: 'Springboard',
				templateUrl: '/partials/dashboard.html',
				controller: 'DashboardCtrl',
				controllerAs: 'vm'
			}).
			when('/settings', {
				title: 'Settings',
				templateUrl: '/partials/settings.html',
				controller: 'SettingsCtrl',
				controllerAs: 'vm'
			}).
			when('/editor', {
				title: 'Site Editor',
				templateUrl: '/partials/editor.html',
				controller: 'EditorCtrl',
				controllerAs: 'vm'
			}).
			when('/gallery', gallery()).
			when('/gallery/ignore', gallery(true)).
			when('/gallery/offline', gallery(true)).
			otherwise({
				redirectTo: '/'
			});
		}
	])
	.run(runMe);

function runMe($rootScope, $route, $location) {
	console.warn('springboard client initializing...');

	// add Object.keys to rootscope keyLength
	// usage: keyLength(object)
	$rootScope.keyLength = function(obj) {
		return Object.keys(obj).length;
	}

	// modify the page title
	$rootScope.$on('$routeChangeSuccess', function() {
		document.title = $route.current.title;
	});

	// modify location.path to allow non-reloading path change
	var original = $location.path;
	$location.path = function(path, reload) {
		if (reload === false) {
			var lastRoute = $route.current;
			var un = $rootScope.$on('$locationChangeSuccess', function() {
				$route.current = lastRoute;
				un();
			});
		}
		return original.apply($location, [path]);
	};

}

function gallery(ignore) {
	return {
		title: 'Site Gallery',
		templateUrl: '/partials/gallery.html',
		controller: 'GalleryCtrl',
		controllerAs: 'vm',
		resolve: {
			checkSite: function($q, $location, sitemanager, usermanager) {
				return usermanager.status().then(function(status) {
					if (!status.setup) {
						return $q.reject({ error: true, action: 'setup' });
					} else {
						return sitemanager.loadSites(ignore)
					}
				}).catch(function(err) {
					if (err.error && err.action == 'commit') {
						return $q.reject('uncommitted');
					} else if (err.error && err.action =='push') {
						return $q.reject('unpushed');
					} else if (err.error && err.action == 'setup') {
						return $q.reject('setup');
					} else if (err.error && err.action == 'connect') {
						return $q.reject('connection');
					}
				});
			}
		}
	}
}
