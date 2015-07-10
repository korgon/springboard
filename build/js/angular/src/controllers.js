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

EditorCtrl.$inject = ['$scope', '$log', '$location', '$window', 'sitemanager'];

function EditorCtrl($scope, $log, $location, $window, sitemanager) {
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
