'use strict';

// Gallery Controller
/********************/
angular
  .module('springboardApp')
  .controller('GalleryCtrl', GalleryCtrl);

GalleryCtrl.$inject = ['$location', 'focus', 'sitemanager', 'modalmanager'];

function GalleryCtrl($location, focus, sitemanager, modalmanager) {
  var vm = this;
  vm.new_site = {};
  vm.loading = true;
  vm.query = "";
  console.log('in gallery...');

  vm.backends = ['solr', 'saluki'];
  vm.carts = ['custom', 'magento', 'bigcommerce', 'miva', 'shopify', '3dcart', 'yahoo', 'volusion', 'commercev3', 'netsuite'];

  sitemanager.loadSites().then(function(sites) {
    vm.sites = sites.error ? [] : sites;
    vm.loading = false;
    console.info('got sites...');
  }, function() {
    console.error('Unable to retrieve sites!');
    // maybe go back to previous page
  });

  // start editing a new site
  vm.editSite = function(site) {
    // TODO
    // need to check to see if current has any uncommited changes (gitStatus)
    // if so, pop a modal asking to commit changes or drop them
    // ^ do something similar for refreshing sites

    vm.loading = true;
    sitemanager.editSite(site).then(function() {
      vm.loading = false;
      $location.path("/editor");
    }, function(err){
      vm.loading = false;
      console.error(err);
    });
  }

  // reload sites
  vm.refresh = function() {
    console.log('refreshing sites...');
  }

  // create new site
  vm.createSite = function() {
    console.log(vm.new_site);
    vm.loading = true;
    sitemanager.createSite(vm.new_site).then(function() {
      vm.loading = false;
      $location.path("/editor");
    }, function(err){
      vm.loading = false;
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
    vm.new_site = { cart: 'custom', backend: 'solr' };
    vm.show_input = true;
    focus('siteName');
  }

  vm.hideInput = function() {
    vm.show_input = false;
  }

}
