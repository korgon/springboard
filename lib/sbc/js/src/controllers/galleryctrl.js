'use strict';

// Gallery Controller
/********************/
angular
  .module('springboardApp')
  .controller('GalleryCtrl', GalleryCtrl);

GalleryCtrl.$inject = ['$window', '$location', 'focus', 'sitemanager', 'modalmanager'];

function GalleryCtrl($window, $location, focus, sitemanager, modalmanager) {
  var vm = this;
  vm.new_site = {};
  vm.loading = true;
  vm.query = "";

  // arrays used for site creation options
  vm.backends = ['solr', 'saluki'];
  vm.carts = ['custom', 'magento', 'bigcommerce', 'miva', 'shopify', '3dcart', 'yahoo', 'volusion', 'commercev3', 'netsuite'];

  // get sites
  sitemanager.loadSites().then(function(sites) {
    if (sites.error) {
      console.log(sites);
      // uncommited or unpushed site edits...
      vm.loading = false;

      if (sites.action == 'push') {
        console.log('no push?');
        // unpushed commits
        var pushpromise = modalmanager.open(
          'alert',
          {
            message: sites.message,
            button_cancel: 'Back',
            button_confirm: 'Ignore'
          }
        );
        console.log('error!');
        // modal response
        pushpromise.then(function(response) {
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
        var commitpromise = modalmanager.open(
          'alert',
          {
            message: sites.message,
            button_cancel: 'Back',
            button_confirm: 'Discard'
          }
        );

        // modal alert response
        commitpromise.then(function(response) {
          // 'discard' chosen
          vm.loading = true;
          sitemanager.resetSite().then(function() {
            sitemanager.loadSites().then(function(sites) {
              if (sites.error) {
                throw(sites.message);
                console.log('error???');
                console.log(sites);
                //$location.path("/editor");
              } else {
                console.log('error!!!!!!!');
                init(sites);
              }
            });
          });
        }, function(err) {
          // 'back' chosen
          $location.path("/editor");
        });
      }

    } else {
      init(sites);
    }
  }, function() {
    console.error('Unable to retrieve sites!');
    // maybe go back to previous page
  });

  function init(sites) {
    // got site data
    vm.loading = false;
    vm.sites = sites;
    // reset session storage
    $window.sessionStorage.removeItem('storage');
  }

  // start editing a new site
  vm.editSite = function(site) {
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
