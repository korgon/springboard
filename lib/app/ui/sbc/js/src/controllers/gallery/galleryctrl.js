'use strict';

// Gallery Controller
/********************/
angular
	.module('springboardApp')
	.controller('GalleryCtrl', GalleryCtrl);

GalleryCtrl.$inject = ['$scope', '$window', '$location', 'focus', 'sitemanager', 'modalmanager'];

function GalleryCtrl($scope, $window, $location, focus, sitemanager, modalmanager) {
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
		console.error('Unable to retrieve sites!');
		// maybe go back to previous page
	});

	function init(sites) {
		// got site data
		$scope.loading.show = false;
		vm.loaded = true;
		vm.sites = sites;
		console.info('loaded sites')
	}

	// start editing a new site
	vm.editSite = function(site) {
		$scope.loading.show = true;
		sitemanager.editSite(site).then(function() {
			//$scope.loading.show = false;
			$location.path("/editor");
		}).catch(function(err) {
			modalmanager.open(
				'alert',
				{
					message: err.message,
					button_confirm: 'close'
				}
			).then(function() {
				$scope.loading.show = false;
			}).catch(function() {
				$scope.loading.show = false;
			});
		});
	}

	// reload sites
	vm.refresh = function() {
		console.log('refreshing sites...');
	}

	// create new site
	vm.createSite = function() {
		console.log(vm.new_site);
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

			// promise.then(function(response) {
			//   console.log('pull alert was resolved');
			// }, function(err) {
			//   console.warn('pull alert rejected...');
			// });
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
