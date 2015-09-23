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

  // arrays used for site creation options
  vm.backends = ['solr', 'saluki'];
  vm.carts = ['custom', 'magento', 'bigcommerce', 'miva', 'shopify', '3dcart', 'yahoo', 'volusion', 'commercev3', 'netsuite'];

  // get sites
  sitemanager.loadSites().then(function(sites) {
    if (sites.error) {
      // uncommited or unpushed site edits...
      vm.loading = false;

      console.log(sites);

      if (sites.action == 'push') {
        console.log('yea?');
        // unpushed commits
        var promise = modalmanager.open(
          'alert',
          {
            message: sites.message,
            button_cancel: 'Back',
            button_confirm: 'Ignore'
          }
        );

        // modal response
        promise.then(function(response) {
          // 'ignore' chosen
          vm.loading = true;
          sitemanager.loadSites(true).then(function(sites) {
            if (sites.error) {
              $location.path("/editor");
            } else {
              vm.loading = false;
              vm.sites = sites;
            }
          });
        }, function(err) {
          // 'back' chosen
          $location.path("/editor");
        });
      } else if (sites.action == 'commit') {
        // uncommited changes
        var promise = modalmanager.open(
          'alert',
          {
            message: sites.message,
            button_cancel: 'Back',
            button_confirm: 'Discard'
          }
        );

        // modal alert response
        promise.then(function(response) {
          // 'discard' chosen
          vm.loading = true;
          sitemanager.resetSite().then(function() {
            sitemanager.loadSites().then(function(sites) {
              if (sites.error) {
                $location.path("/editor");
              } else {
                vm.loading = false;
                vm.sites = sites;
              }
            });
          });
        }, function(err) {
          // 'back' chosen
          $location.path("/editor");
        });
      }

    } else {
      // got site data
      console.info('got sites...');
      vm.loading = false;
      vm.sites = sites;
    }
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
