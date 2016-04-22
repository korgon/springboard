'use strict';

// Editor Controller
/*******************/
angular
  .module('springboardApp')
  .controller('EditorCtrl', EditorCtrl);

EditorCtrl.$inject = ['$scope', '$location', '$window', 'focus', 'sitemanager', 'modalmanager'];

function EditorCtrl($scope, $location, $window, focus, sitemanager, modalmanager) {
  var vm = this;
  var changeTimeout;
  vm.new_ui = {};
  $scope.loading.show = true;

  // get available catalogs (UIs)
  sitemanager.getUIs().then(function(uis) {
    vm.uis = uis;
  }, function(err) {
    console.error('Failed to get listing of available UI catalogs.');
  });

  // get site to be edited
  sitemanager.getSite().then(function(site) {
    vm.site = site;
    $scope.loading.show = false;
    console.info('editing ' + site.name + '...');

    // setting defaults or loading previous values from window storage
    var session_defaults = { site: site.name, showOptions: false, current_tab: 'settings', tab: { uigen: { vtab: {}, current: undefined }, settings: { vtab: {} } }, url: false };

    vm.session = angular.fromJson($window.sessionStorage.getItem('sites/' + site.name)) || session_defaults;
    if (vm.session.site != site.name) vm.session = session_defaults;

    if (Object.keys(vm.session).length == 0 || !vm.session.url) {
      var current_url = $location.absUrl().match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      vm.session.url = current_url[0] + 'sites/' + site.name + '/' + site.default_html;
      vm.session.frameurl = current_url[0] + 'sites/' + site.name + '/' + site.default_html;
    }
  }).catch(function(err) {
    // not editing any site...
    $location.path("/");
  });

  vm.changeUrl = function() {
    clearTimeout(changeTimeout);

    changeTimeout = setTimeout(function() {
      vm.session.frameurl = vm.session.url;
      vm.saveEditorSession();
      $scope.$apply();
    }, 350);
  }

  vm.openUrl = function() {
    $window.open(vm.session.url, '_blank');
  }

  vm.prompty = function() {
    modalmanager.open(
      'alert',
      {
        message: 'Are you going to do that?',
        button_confirm: 'Okay...'
      }
    ).then(function(response) {
      console.log('pull alert was resolved');
    }).catch(function(err) {
      console.warn('pull alert rejected...');
    });
  }

  vm.commitSite = function() {
    modalmanager.open(
      'input',
      {
        message: 'Commit message for changes',
        message_icon: 'commit',
        button_cancel: 'Cancel',
        button_confirm: 'Save'
      }
    ).then(function(response) {
      $scope.loading.show = true;
      return sitemanager.commitSite(response);
    }).then(function() {
      $scope.loading.show = false;
    }).catch(function(err) {
      $scope.loading.show = false;
    });
  }

  vm.pushSite = function() {
    $scope.loading.show = true;
    sitemanager.pushSite().then(function() {
      console.log('site pushed!');
      $scope.loading.show = false;
    }).catch(function(err) {
      console.error(err);
      $scope.loading.show = false;
    });
  }

  vm.publishMockup = function() {
    $scope.loading.show = true;
    sitemanager.publishSiteMockup().then(function() {
      console.log('site published!');
      $scope.loading.show = false;
    }).catch(function(err) {
      console.error(err);
      $scope.loading.show = false;
    });
  }

  vm.reloadSite = function() {
    $scope.loading.show = true;
    sitemanager.reloadSite().then(function(site) {
      vm.site = site;

      if (!site.catalogs[vm.session.tab['uigen'].current]) {
        vm.session.tab['uigen'].current = undefined;
        vm.saveEditorSession();
      }
      $scope.loading.show = false;
    }).catch(function(err) {
      console.error(err);
      $scope.loading.show = false;
    });
  }

  vm.installUI = function() {
    $scope.loading.show = true;
    var ui_data = { type: vm.new_ui.type, name: vm.new_ui.name };
    sitemanager.installUI(ui_data).then(function(updated_site) {
      vm.site = updated_site;
      vm.hideAddInput();
      vm.initVtab(vm.new_ui.name);
      vm.toggleUI(vm.new_ui.name);
      vm.new_ui.name = '';
      $scope.loading.show = false;
    }).catch(function(err) {
      $scope.loading.show = false;
      modalmanager.open(
        'alert',
        {
          message: err.message
        }
      );
    });
  }

  vm.installModuleTheme = function(data) {
    $scope.loading.show = true;
    sitemanager.installModuleTheme(data).then(function(updated_site) {
      vm.site = updated_site;
      $scope.loading.show = false;
    }, function(err) {
      $scope.loading.show = false;
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
      $scope.loading.show = true;
      var modified_site = angular.copy(vm.site);
      modified_site.modules[data.module].theme = data.theme;
      // update the site
      sitemanager.updateSite(modified_site).then(function(updated_site) {
        vm.site = updated_site;
        $scope.loading.show = false;
      }, function(err) {
        $scope.loading.show = false;
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
        vm.session.tab[vm.session.current_tab].vtab[module].tab = 'settings';
      } else if (vm.session.current_tab == 'settings') {
        vm.session.tab[vm.session.current_tab].vtab[module].tab = 'variables';
      }
    }

    if (!vm.session.tab[vm.session.current_tab].vtab[module].visible)
      vm.session.tab[vm.session.current_tab].vtab[module].visible = false;
  }

  vm.toggleUI = function(module) {
    vm.session.tab['uigen'].vtab[module].visible = !vm.session.tab['uigen'].vtab[module].visible;
    if (vm.session.tab['uigen'].vtab[module].visible) {
      vm.session.tab['uigen'].current = module;
    } else {
      vm.session.tab['uigen'].current = undefined;
    }
    vm.saveEditorSession();
  }

  vm.showAddInput = function() {
    vm.new_ui = { type: 'v3' };
    vm.new_ui_show = true;
    focus('moduleName');
  }
  vm.hideAddInput = function() {
    vm.new_ui_show = false;
  }

  vm.isEmpty = function(obj) {
    return angular.equals({}, obj);
  }

  vm.saveEditorSession = function() {
    $window.sessionStorage.setItem('sites/' + vm.site.name, angular.toJson(vm.session));
  }

}
