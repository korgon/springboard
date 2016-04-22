'use strict';

// Main Controller
/*******************/

// Used to redirect based on git status and user status
angular
	.module('springboardApp')
	.controller('MainCtrl', MainCtrl);

MainCtrl.$inject = ['$scope', '$location', '$q', 'sitemanager', 'modalmanager'];

function MainCtrl($scope, $location, $q, sitemanager, modalmanager) {
	$scope.testobj = { loading: true };
	$scope.loading = { show: true, hide: false };

	$scope.$on("$routeChangeError", function(event, current, previous, rejection){
		console.log('checking router error')
	  if(rejection == 'uncommitted') {
			// uncommitted changes
	    console.error('there are uncommited site changes!');
			$scope.loading.show = false;
			modalmanager.open(
				'alert',
				{
					message: 'There are uncommitted changes.',
					button_cancel: 'Back',
					button_confirm: 'Discard'
				}
			).then(function(response) {
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
			console.error('there are unpushed site changes!');
			$scope.loading.show = false;
			modalmanager.open(
				'alert',
				{
					message: 'There are unpushed commits.',
					button_cancel: 'Back',
					button_confirm: 'Ignore'
				}
			).then(function(response) {
				// 'ignore' chosen
				$scope.loading.show = true;
				$location.path('/gallery/ignore');
			}).catch(function(err) {
				// 'back' chosen
				$scope.loading.hide = true;
				$location.path('/editor', false);
			});
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
