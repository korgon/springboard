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

  // get available modules
  sitemanager.getModules().then(function(modules) {
    vm.modules = modules;
  }, function(err) {
    console.error('Failed to get listing of available modules.');
    console.log(err);
  });

  // get site to be edited
  sitemanager.getSite().then(function(site) {
    vm.site = site;
    vm.loading = false;
    console.info('editing ' + site.name + '...');

    // setting defaults or loading previous values from window storage
    var session_defaults = { site: site.name, showOptions: false, current_tab: 'settings', tab: { uigen: { vtab: {} }, settings: { vtab: {} } }, url: false };

    vm.session = angular.fromJson($window.sessionStorage.getItem('sites/' + site.name)) || session_defaults;
    if (vm.session.site != site.name) vm.session = session_defaults;

    if (Object.keys(vm.session).length == 0 || !vm.session.url) {
      var current_url = $location.absUrl().match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      vm.session.url = current_url[0] + 'sites/' + site.name + '/' + site.default_html;
    }
  }, function(err) {
    // not editing any site...
    $location.path("/");
  });

  vm.openUrl = function() {
    $window.open(vm.session.url, '_blank');
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
      vm.session.vtab[vm.new_module.name] = {};
      // vm.initVtab(vm.new_module.name);
      vm.session.vtab[vm.new_module.name].visible = true;
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

  vm.installModuleTheme = function(data) {
    vm.loading = true;
    sitemanager.installModuleTheme(data).then(function(updated_site) {
      vm.site = updated_site;
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

  vm.useModuleTheme = function(data) {
    if (vm.site.modules[data.module].theme != data.theme) {
      vm.loading = true;
      var modified_site = angular.copy(vm.site);
      modified_site.modules[data.module].theme = data.theme;
      // update the site
      sitemanager.updateSite(modified_site).then(function(updated_site) {
        vm.site = updated_site;
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
  }

  vm.switchTab = function(new_tab) {
    vm.session.current_tab = new_tab;
    vm.saveEditorSession();
  }

  vm.switchVtab = function(new_tab, module) {
    vm.session.tab[vm.session.current_tab].vtab[module].tab = new_tab;
    vm.saveEditorSession();
  }

  vm.activeVtab = function(module) {
    return vm.session.tab[vm.session.current_tab].vtab[module].tab;
  }

  vm.initVtab = function(module) {
    // set defaults
    if (!vm.session.tab[vm.session.current_tab].vtab[module]) {
      vm.session.tab[vm.session.current_tab].vtab[module] = {};

      if (vm.session.current_tab == 'uigen') {
        vm.session.tab[vm.session.current_tab].vtab[module].tab = 'plugins';
      } else if (vm.session.current_tab == 'settings') {
        vm.session.tab[vm.session.current_tab].vtab[module].tab = 'variables';
      }
    }

    if (!vm.session.tab[vm.session.current_tab].vtab[module].visible)
      vm.session.tab[vm.session.current_tab].vtab[module].visible = false;
  }

  vm.toggleUI = function(module) {
    vm.session.tab['uigen'].vtab[module].visible = !vm.session.tab['uigen'].vtab[module].visible;
    vm.saveEditorSession();
  }

  vm.showModuleInput = function() {
    vm.new_module = { type: 'v3' };
    vm.new_module_show = true;
    focus('moduleName');
  }
  vm.hideModuleInput = function() {
    vm.new_module_show = false;
  }

  vm.isEmpty = function(obj) {
    return angular.equals({}, obj);
  }

  vm.saveEditorSession = function() {
    $window.sessionStorage.setItem('sites/' + vm.site.name, angular.toJson(vm.session));
  }

}
