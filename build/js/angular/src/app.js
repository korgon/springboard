'use strict';

// main app

angular
  .module('springboardApp', [
    'ngRoute',
    'ngAnimate'
  ])
  .config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.
        when('/', {
          title: 'Springboard'
        }).
        when('/editor', {
          title: 'Site Editor',
          templateUrl: '/partials/editor.html',
          controller: 'EditorCtrl',
          controllerAs: 'vm'
        }).
        when('/gallery', {
          title: 'Site Gallery',
          templateUrl: '/partials/gallery.html',
          controller: 'GalleryCtrl',
          controllerAs: 'vm'
        }).
        otherwise({
          redirectTo: '/'
        });
    }
  ])
  .run(runMe);

runMe.$inject = ['$rootScope', '$route'];

function runMe($rootScope, $route) {
  console.log('loading springboard client here...');
  $rootScope.$on('$routeChangeSuccess', function() {
      document.title = $route.current.title;
  });
}
