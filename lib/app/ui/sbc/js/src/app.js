'use strict';

// main app
// version 1.1.0

angular
	.module('springboardApp', [
		'ngRoute',
		'ngAnimate'
	])
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
			when('/editor', {
				title: 'Site Editor',
				templateUrl: '/partials/editor.html',
				controller: 'EditorCtrl',
				controllerAs: 'vm'
			}).
			when('/gallery', gallery()).
			when('/gallery/ignore', gallery(true)).
			otherwise({
				redirectTo: '/'
			});
		}
	])
	.run(runMe);

function runMe($rootScope, $route, $location) {
	console.warn('springboard client initializing...');

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
			checkSite: function($q, sitemanager) {
				return sitemanager.loadSites(ignore).catch(function(err) {
					if (err.error && err.action == 'commit') {
						console.log('there are uncommitted changes...');
						return $q.reject('uncommitted');
					} else if (err.error && err.action =='push') {
						console.log('there are unpushed changes...');
						return $q.reject('unpushed');
					}
				});
			}
		}
	}
}
