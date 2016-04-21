'use strict';

// Dashboard Controller
/*******************/

// TODO
// build out a dashboard?
// for now redirect to previously edited site
angular
	.module('springboardApp')
	.controller('DashboardCtrl', DashboardCtrl);

DashboardCtrl.$inject = ['$location', 'sitemanager'];

function DashboardCtrl($location, sitemanager) {
	var vm = this;
	vm.loading = true;

	sitemanager.getSite().then(function(site) {
		vm.loading = false;
		$location.path("/editor");
	}, function(err) {
		// not editing any site...
		vm.loading = false;
		$location.path("/gallery");
	});

	console.log('in dashboard...');

}
