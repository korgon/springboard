'use strict';

// Main Controller
/*******************/

// Used to redirect based on git status and user status
angular
	.module('springboardApp')
	.controller('MainCtrl', MainCtrl);

MainCtrl.$inject = ['$scope', '$location', '$q', 'sitemanager', 'modalmanager', 'usermanager'];

function MainCtrl($scope, $location, $q, sitemanager, modalmanager, usermanager) {
	$scope.loading = { show: true, hide: false, offline: false };

	// check if server is alive
	// var pulseCheck = setInterval(function() {
	// 	usermanager.alive().then(function(resp) {
	// 		$scope.loading.offline = false;
	// 	}).catch(function(err) {
	// 		$scope.loading.offline = true;
	// 	});
	// }, 5000);

	$scope.settings = function(setup) {
		$scope.loading.show = false;
		var popup;

		if (setup) {
			$scope.loading.show = false;
			popup = modalmanager.open(
				'alert',
				{
					message: 'Springboard Initial Setup!',
					message_icon: 'springboard',
					button_confirm: 'Continue'
				}
			).catch(function(err) {
				// overlay clicked
				return $q.resolve();
			});
		} else {
			popup = $q.resolve();
		}

		return popup.then(function() {
			return modalmanager.open(
				'settings',
				{
					setup: setup
				}
			);
		});
	}

	$scope.$on("$routeChangeError", function(event, current, previous, rejection){
		if(rejection == 'uncommitted' || rejection == 'mastercontamination') {
			// uncommitted changes
			$scope.loading.show = false;
			var modal_message = {};
			if (rejection == 'uncommitted') {
				modal_message.message = 'There are uncommitted changes.';
				modal_message.confirm = 'Discard';
				modal_message.cancel = 'Back';
			} else if (rejection == 'mastercontamination') {
				modal_message.message = 'Master branch is contaminated.';
				modal_message.confirm = 'Reset';
				modal_message.cancel = null;
			}
			modalmanager.open(
				'alert',
				{
					message: modal_message.message,
					button_cancel: modal_message.cancel,
					button_confirm: modal_message.confirm
				}
			).then(function() {
				// modal response
				// 'discard' chosen
				$scope.loading.show = true;
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
			$scope.settings(true).then(function() {
				$location.path('/', true);
			});;
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
