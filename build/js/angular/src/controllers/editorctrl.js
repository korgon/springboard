'use strict';

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

  sitemanager.getModules().then(function(modules) {
    vm.modules = modules;
  }, function(err) {
    console.error('Failed to get listing of available modules.');
    console.log(err);
  })

  vm.openUrl = function() {
    $window.open(vm.url, '_blank');
  }

  vm.prompty = function() {
    var promise = modalmanager.open(
      'alert',
      {
        message: 'Are you going to do that?',
        button_confirm: 'Okay...'
      }
    );

    promise.then(function(response) {
      console.log('pull alert was resolved');
    }, function(err) {
      console.warn('pull alert rejected...');
    });
  }

  vm.commitSite = function() {
    var promise = modalmanager.open(
      'input',
      {
        message: 'Commit message for changes',
        message_icon: 'commit',
        button_cancel: 'Cancel',
        button_confirm: 'Save'
      }
    );

    promise.then(function(response) {
      vm.loading = true;
      sitemanager.commitSite(response).then(function() {
        vm.loading = false;
      }, function(err) {
        console.log(err);
        vm.loading = false;
      });
    }, function(err) {
      console.error(err);
    });
  }

  vm.pushSite = function() {
    vm.loading = true;
    sitemanager.pushSite().then(function() {
      console.log('site pushed yo!');
      vm.loading = false;
    }, function(err) {
      console.error(err);
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
