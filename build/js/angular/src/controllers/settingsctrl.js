'use strict';

// Settings Controller
/*******************/
angular
  .module('springboardApp')
  .controller('SettingsCtrl', SettingsCtrl);

SettingsCtrl.$inject = ['usermanager'];

function SettingsCtrl(usermanager) {
  var vm = this;

  console.log('in settings...');

}
