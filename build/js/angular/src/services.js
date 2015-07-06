'use strict';

// services...

var springboardServices = angular.module('springboardServices', []);

springboardServices.factory('Sites', ['$http',
  function($http) {

    var site = {};
    var sites = {};

    var loadSites = function() {
      return $http({
        method: 'GET',
        url: '/api/sites'
      });
    }

    return {
      loadSites: function() { return loadSites(); },
      sites: function() { return sites; },
      site: function() { return site; }
    };
  }
]);
