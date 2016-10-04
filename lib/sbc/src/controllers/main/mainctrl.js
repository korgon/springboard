'use strict';

// Main Controller
/*******************/

// Used to redirect based on git status and user status
angular
	.module('springboardApp')
	.controller('MainCtrl', MainCtrl);

MainCtrl.$inject = ['$scope', '$location', '$q', 'sitemanager', 'modalmanager', 'usermanager'];

function MainCtrl($scope, $location, $q, sitemanager, modalmanager, usermanager) {
	$scope.loading = { show: true, hide: false };

	$scope.$on("$routeChangeError", function(event, current, previous, rejection){
		if(rejection == 'uncommitted') {
			// uncommitted changes
			$scope.loading.show = false;
			modalmanager.open(
				'alert',
				{
					message: 'There are uncommitted changes.',
					button_cancel: 'Back',
					button_confirm: 'Discard'
				}
			).then(function() {
				// modal response
				// 'discard' chosen
				sitemanager.resetSite().then(function() {
					$location.path('/editor');
				});
			}).catch(function(err) {
				// modal response
				// 'back' chosen
				$scope.loading.hide = true;
				$location.path('/editor', false);
			});

		} else if (rejection == 'unpushed') {
			// unpushed commits
			$scope.loading.show = false;
			modalmanager.open(
				'alert',
				{
					message: 'There are unpushed commits.',
					button_cancel: 'Back',
					button_confirm: 'Ignore'
				}
			).then(function() {
				// 'ignore' chosen
				$scope.loading.show = true;
				$location.path('/gallery/ignore');
			}).catch(function(err) {
				// 'back' chosen
				$scope.loading.hide = true;
				$location.path('/editor', false);
			});
		} else if (rejection == 'connection') {
			// connection to internet failed
			$scope.loading.show = false;
			modalmanager.open(
				'alert',
				{
					message: 'Connection failure.\n Ignoring will use local data.',
					message_icon: 'connection',
					button_cancel: 'Retry',
					button_confirm: 'Ignore'
				}
			).then(function() {
				// 'ignore' chosen
				$scope.loading.show = true;
				$location.path('/gallery/offline');
			}).catch(function(err) {
				// 'retry' chosen
				$scope.loading.hide = true;
				$location.path('/', true);
			});
		} else if (rejection == 'setup') {
			$location.path('/settings');
		} else {
			console.log(rejection);
			console.log('Not sure what to do...');
		}
	});

	$scope.$on("$routeChangeStart", function(event, next, current) {
		// fix for hiding loading on routerErrors where the location is not reloaded
		$scope.loading.show = true;

		if ($scope.loading.hide) {
			$scope.loading.show = false;
			$scope.loading.hide = false;
		}

	});

	$scope.$on("$routeChangeSuccess", function() {
		$scope.loading.show = false;
	});
}
