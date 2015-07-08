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
    console.log('error?');
  });
  vm.refresh = function() {
    console.log('refreshing sites...');
  }
}

angular
  .module('springboardApp')
  .controller('EditorCtrl', EditorCtrl);

EditorCtrl.$inject = ['$log', '$location', '$window', 'sitemanager'];

function EditorCtrl($log, $location, $window, sitemanager) {
  var vm = this;

  vm.loading = false;
  $log.log('in editor...');

  sitemanager.getSite().then(function(site) {
    vm.site = site;
    vm.loading = false;
    $log.info('got site...');
    $log.info(site);
    var current_url = $location.absUrl().match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    vm.url = current_url[0] + 'sites/' + site.name;
  }, function(err) {
    $location.path("/");
  });

  vm.openUrl = function() {
    $window.open(vm.url, '_blank');
  }
}
