'use strict';

// Settings Controller
/*******************/
angular
	.module('springboardApp')
	.controller('SettingsCtrl', SettingsCtrl);

SettingsCtrl.$inject = ['$scope', '$q', '$location', 'focus', 'usermanager', 'modalmanager'];

function SettingsCtrl($scope, $q, $location, focus, usermanager, modalmanager) {
	var vm = this;
	$scope.loading.show = true;

	usermanager.status().then(function(status) {
		if (!status.setup) {
			vm.setup = false;
			$scope.loading.show = false;
			return modalmanager.open(
				'alert',
				{
					message: 'Springboard setup...',
					button_confirm: 'Continue'
				}
			)
		} else {
			vm.setup = true;
			return $q.resolve();
		}
	}).catch(function(err) {
		// overlay clicked
		return $q.resolve();
	}).then(function() {
		$scope.loading.show = true;
		return usermanager.getUser();
	}).then(function(userdata) {
		$scope.loading.show = false;
		vm.user = userdata;
	}).catch(function(err) {
		modalmanager.open(
			'alert',
			{
				message: 'problem getting user data',
				button_confirm: 'Continue'
			}
		)
	});

	vm.saveUserSettings = function() {
		usermanager.putUser(vm.user).then(function() {
			// if first time setup redirect to gallery
			if (vm.setup == false) {
				$location.path('/gallery');
			}
		}).catch(function(err) {
			console.error(err);
			modalmanager.open(
				'alert',
				{
					message: 'something bad happened...',
					button_confirm: 'Continue'
				}
			);
		});
	}

}
