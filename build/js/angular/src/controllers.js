'use strict';

// controllers

angular
  .module('springboardApp')
  .controller('GalleryCtrl', GalleryCtrl);

GalleryCtrl.$inject = ['$log', '$location', 'sitemanager'];

function GalleryCtrl($log, $location, sitemanager) {
  var vm = this;
  vm.loading = true;
  $log.log('in gallery...');

  sitemanager.getSites().then(function(sites) {
    vm.sites = sites;
    vm.loading = false;
    $log.info('got sites...');
  }, function() {
    $log.error('Unable to retrieve sites!');
  });

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

  vm.refresh = function() {
    console.log('refreshing sites...');
  }
}

angular
  .module('springboardApp')
  .controller('EditorCtrl', EditorCtrl);

EditorCtrl.$inject = ['$scope', '$log', '$location', '$window', 'sitemanager', 'modalmanager'];

function EditorCtrl($scope, $log, $location, $window, sitemanager, modalmanager) {
  var vm = this;

  vm.loading = true;
  $log.log('in editor...?');

  sitemanager.getSite().then(function(site) {
    vm.site = site;
    vm.loading = false;
    $log.info('got site...');
    //$log.info(site);
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
        message: 'are you going to do that?'
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
}

angular
  .module('springboardApp')
  .controller('DashboardCtrl', DashboardCtrl);

DashboardCtrl.$inject = ['sitemanager'];

function DashboardCtrl(sitemanager) {
  var vm = this;

  console.log('in dashboard...');

}

// modal controllers

// alert modal
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
