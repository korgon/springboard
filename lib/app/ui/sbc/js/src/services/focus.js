'use strict';

// focus service
angular
  .module('springboardApp')
  .factory('focus', focus);

focus.$inject = ['$rootScope', '$timeout'];

function focus($rootScope, $timeout) {
  // service api returns a single function
  return function(focus_attr) {
    $timeout(function() {
      $rootScope.$broadcast('focusOn', focus_attr);
    });
  }
}
