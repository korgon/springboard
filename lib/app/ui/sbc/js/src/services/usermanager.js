'use strict';

// usermanager service
// manages user/login data

angular
  .module('springboardApp')
  .factory('usermanager', usermanager);

usermanager.$inject = ['$http', '$q', '$timeout'];

function usermanager($http, $q, $timeout) {
  // object containing user info s3 etc...
  var user = {};

  // service api
  return({
    getUser: getUser,
    putUser: putUser
  });

  // switch to a new site for editing
  function getUser() {
    var promise = $q.defer();

    $http({
      method: 'GET',
      url: '/api/user'
    }).success(function(data, status, headers) {

    }).error(promise.reject);

    return promise.promise;
  }

  // TODO
  // put user data
  function putUser(user) {
    // verify user data?
    var promise = $q.defer();

    $http({
      method: 'POST',
      data: user,
      url: '/api/user/update'
    }).success(function(data, status, headers) {

    }).error(promise.reject);

    return promise.promise;
  }
}
