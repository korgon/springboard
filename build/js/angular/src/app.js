// main app

var springboardApp = angular.module('springboardApp', [
  'ngRoute',
  'springboardControllers',
  'springboardServices'
]);

springboardApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {

      }).
      when('/gallery', {
        templateUrl: '/partials/gallery.html',
        controller: 'galleryCtrl'
      }).
      otherwise({
        redirectTo: '/'
      });
  }
]);
