'use strict';

// controllers

var springboardControllers = angular.module('springboardControllers', []);

springboardControllers.controller('galleryCtrl', ['$scope', 'Sites',
  function($scope, Sites) {
    Sites.loadSites().success(function(data, status, headers) {
      $scope.sites = data;
    });
  }
]);
