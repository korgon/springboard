'use strict';

// Gallery Controller
/********************/
angular
	.module('springboardApp')
	.controller('GalleryCtrl', GalleryCtrl);

GalleryCtrl.$inject = ['$scope', '$window', '$location', '$q', 'focus', 'sitemanager', 'modalmanager'];

function GalleryCtrl($scope, $window, $location, $q, focus, sitemanager, modalmanager) {
	var vm = this;
	vm.new_site = {};
	$scope.loading.show = true;
	vm.loaded = false;
	vm.query = "";

	// arrays used for site creation options
	vm.carts = ['custom', 'magento', 'bigcommerce', 'miva', 'shopify', '3dcart', 'yahoo', 'volusion', 'commercev3', 'netsuite'];

	// get sites
	sitemanager.getSites().then(function(sites) {
		init(sites);
	}).catch(function() {
		modalmanager.open(
			'alert',
			{
				message: 'Unable to retrieve sites.',
				button_confirm: 'close'
			}
		).catch(function() {
			return $q.resolve();
		}).then(function() {
			$scope.loading.show = false;
		});
		// maybe go back to previous page
	});

	function init(sites) {
		// got site data
		$scope.loading.show = false;
		vm.loaded = true;
		vm.sites = sites;
	}

	// start editing a new site
	vm.editSite = function(site, ignore) {
		$scope.loading.show = true;
		sitemanager.editSite(site, ignore).then(function() {
			$location.path("/editor");
		}).catch(function(err) {
			if (err.action == 'connect') {
				$scope.loading.show = false;
				modalmanager.open(
					'alert',
					{
						message: 'Connection failure. Ignoring will use local site data.',
						message_icon: 'connection',
						button_cancel: 'Cancel',
						button_confirm: 'Ignore'
					}
				).then(function() {
					// 'ignore' chosen
					$scope.loading.show = true;
					vm.editSite(site, true);
				}).catch(function(err) {
					// do nothing
				});
			} else {
				$scope.loading.show = false;
				modalmanager.open(
					'alert',
					{
						message: err.message,
						button_confirm: 'close'
					}
				);
			}
		});
	}

	// reload sites
	vm.refresh = function() {
		console.log('refreshing sites...');
	}

	// create new site
	vm.createSite = function() {
		$scope.loading.show = true;
		sitemanager.createSite(vm.new_site).then(function() {
			$scope.loading.show = false;
			$location.path("/editor");
		}, function(err){
			$scope.loading.show = false;
			var promise = modalmanager.open(
				'alert',
				{
					message: err.message
				}
			);
		});
	}

	vm.showInput = function() {
		vm.new_site = { cart: 'custom' };
		vm.show_input = true;
		focus('siteName');
	}

	vm.hideInput = function() {
		vm.show_input = false;
	}

}
