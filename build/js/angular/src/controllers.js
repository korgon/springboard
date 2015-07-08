'use strict';

// controllers

angular
  .module('springboardApp')
  .controller('GalleryCtrl', GalleryCtrl);

GalleryCtrl.$inject = ['$log', 'sitemanager'];

function GalleryCtrl($log, sitemanager) {
  var vm = this;
  vm.loading = false;
  $log.log('in gallery...');

  sitemanager.getSites().then(function(sites) {
    vm.sites = sites;
    vm.loading = false;
    $log.info('got sites...');
  }, function() {
    $log.error('Unable to retrieve sites!');
  });
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

  vm.loading = false;
  $log.log('in editor...');

  sitemanager.getSite().then(function(site) {
    vm.site = site;
    vm.loading = false;
    $log.info('got site...');
    $log.info(site);
    var current_url = $location.absUrl().match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    vm.url = current_url[0] + 'sites/' + site.name + '/' + site.default_html;
  }, function(err) {
    $location.path("/");
  });

  vm.openUrl = function() {
    $window.open(vm.url, '_blank');
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
