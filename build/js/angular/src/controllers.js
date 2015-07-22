'use strict';

// Controllers
/*************/

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
  console.log('in gallery...');

  vm.backends = ['solr', 'saluki'];
  vm.carts = ['custom', 'magento', 'bigcommerce', 'miva', 'shopify'];

  sitemanager.loadSites().then(function(sites) {
    vm.sites = sites;
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


// Editor Controller
/*******************/
angular
  .module('springboardApp')
  .controller('EditorCtrl', EditorCtrl);

EditorCtrl.$inject = ['$location', '$window', 'sitemanager', 'modalmanager'];

function EditorCtrl($location, $window, sitemanager, modalmanager) {
  var vm = this;

  vm.loading = true;
  console.log('in editor...?');

  sitemanager.getSite().then(function(site) {
    vm.site = site;
    vm.loading = false;
    console.info('got site...');
    var current_url = $location.absUrl().match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    vm.url = current_url[0] + 'sites/' + site.name + '/' + site.default_html;
  }, function(err) {
    // not editing any site...
    $location.path("/");
  });

  vm.openUrl = function() {
    $window.open(vm.url, '_blank');
  }

  vm.prompty = function() {
    var promise = modalmanager.open(
      'alert',
      {
        message: 'Are you going to do that?'
      }
    );

    promise.then(function(response) {
      console.log('pull alert was resolved');
    }, function(err) {
      console.warn('pull alert rejected...');
    });
  }

  vm.commitSite = function() {
    vm.loading = true;
    sitemanager.commitSite().then(function() {
      console.log('site commited yo!');
      vm.loading = false;
    }, function(err) {
      console.log(err);
      vm.loading = false;
    });
  }

  vm.pushSite = function() {
    vm.loading = true;
    sitemanager.pushSite().then(function() {
      console.log('site pushed yo!');
      vm.loading = false;
    }, function(err) {
      console.log(err);
      vm.loading = false;
    });
  }

  vm.publishMockup = function() {
    vm.loading = true;
    sitemanager.publishSiteMockup().then(function() {
      console.log('site published!');
      vm.loading = false;
    }, function(err) {
      console.log(err);
      vm.loading = false;
    });
  }
}

// Dashboard Controller
/*******************/

// TODO
// build out a dashboard
angular
  .module('springboardApp')
  .controller('DashboardCtrl', DashboardCtrl);

DashboardCtrl.$inject = ['sitemanager'];

function DashboardCtrl(sitemanager) {
  var vm = this;

  console.log('in dashboard...');

}

// Settings Controller
/*******************/
angular
  .module('springboardApp')
  .controller('SettingsCtrl', SettingsCtrl);

SettingsCtrl.$inject = ['sitemanager'];

function SettingsCtrl(sitemanager) {
  var vm = this;

  console.log('in settings...');

}


/*******************/
// Modal Controllers
/*******************/


// Alert Modal Controller
/************************/
angular
  .module('springboardApp')
  .controller('ModalAlertCtrl', ModalAlertCtrl);

ModalAlertCtrl.$inject = ['$scope', 'modalmanager'];

function ModalAlertCtrl($scope, modalmanager) {

  console.log('in alert modal');

  var params = modalmanager.params();
  var mm = {};
  $scope.mm = mm;

  // Setup defaults using the modal params.
  mm.message = ( params.message || 'Do the thing?' );

  // modal resolution
  mm.closeModal = function() {
    console.log('close the modal yo');
    modalmanager.resolve();
  }
}
