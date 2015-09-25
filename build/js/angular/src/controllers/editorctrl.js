'use strict';

// Editor Controller
/*******************/
angular
  .module('springboardApp')
  .controller('EditorCtrl', EditorCtrl);

EditorCtrl.$inject = ['$location', '$window', 'focus', 'sitemanager', 'modalmanager'];

function EditorCtrl($location, $window, focus, sitemanager, modalmanager) {
  var vm = this;
  vm.new_module = {};

  vm.loading = true;

  sitemanager.getSite().then(function(site) {
    vm.site = site;
    vm.loading = false;
    console.info('editing ' + site.name + '...');

    // setting defaults or loading previous values from window storage
    var session = angular.fromJson($window.sessionStorage.getItem('storage')) || {};

    vm.showOptions = (Object.keys(session).length > 0) ? session.show : false;
    vm.tab = (Object.keys(session).length > 0) ? session.tab : 'modules';
    vm.url = (Object.keys(session).length > 0) ? session.url : false;
    if (!vm.url) {
      var current_url = $location.absUrl().match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      vm.url = current_url[0] + 'sites/' + site.name + '/' + site.default_html;
    }

    // set listner to store values for preservation on refresh
    $window.addEventListener('beforeunload', function() {
      console.log('saving session data...');
      var storage = { tab: vm.tab, url: vm.url, show: vm.showOptions };
      $window.sessionStorage.setItem('storage', angular.toJson(storage));
    });
  }, function(err) {
    // not editing any site...
    $location.path("/");
  });

  sitemanager.getModules().then(function(modules) {
    vm.modules = modules;
  }, function(err) {
    console.error('Failed to get listing of available modules.');
    console.log(err);
  });

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

  vm.installModule = function() {
    vm.loading = true;
    var module_data = { type: vm.new_module.type, name: vm.new_module.name };
    sitemanager.installModule(module_data).then(function(updated_site) {
      vm.site = updated_site;
      vm.hideModuleInput();
      vm.new_module.name = '';
      vm.loading = false;
    }, function(err) {
      vm.loading = false;
      var promise = modalmanager.open(
        'alert',
        {
          message: err.message
        }
      );
    });
  }

  vm.switchTab = function(new_tab) {
    vm.tab = new_tab;
  }

  vm.switchVtab = function(new_tab) {
    vm.vtab = new_tab;
  }

  vm.showModuleInput = function() {
    vm.new_module = { type: 'autocomplete' };
    vm.new_module_show = true;
    focus('moduleName');
  }
  vm.hideModuleInput = function() {
    vm.new_module_show = false;
  }

}
