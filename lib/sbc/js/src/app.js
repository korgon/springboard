'use strict';

// main app
// version 1.1.0

angular
  .module('springboardApp', [
    'ngRoute',
    'ngAnimate'
  ])
  .config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
      $routeProvider.
        // TODO make some sort of dashboard
        when('/', {
          title: 'Springboard',
          templateUrl: '/partials/dashboard.html',
          controller: 'DashboardCtrl',
          controllerAs: 'vm'
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

      // TODO later maybe...
      // use the HTML5 History API
      // $locationProvider.html5Mode(true);
      // must add <base href="/"> to <head>
    }
  ])
  .run(runMe);

runMe.$inject = ['$rootScope', '$route'];

function runMe($rootScope, $route) {
  console.warn('springboard client initializing...');

  // modify the title
  $rootScope.$on('$routeChangeSuccess', function() {
      document.title = $route.current.title;
  });
}
