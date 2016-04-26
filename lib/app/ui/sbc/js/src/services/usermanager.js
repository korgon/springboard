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
    status: status,
    getUser: getUser,
    putUser: putUser
  });

  // get springboard status
  function status() {
    var promise = $q.defer();

    $http({
      method: 'GET',
      url: '/api/status'
    }).success(function(data, status, headers) {
      promise.resolve(data);
    }).error(promise.reject);

    return promise.promise;
  }

  // get user data
  function getUser() {
    var promise = $q.defer();

    $http({
      method: 'GET',
      url: '/api/user'
    }).success(function(data, status, headers) {
      promise.resolve(data);
    }).error(promise.reject);

    return promise.promise;
  }

  // TODO
  // put user data
  function putUser(user) {
    var promise = $q.defer();

    $http({
      method: 'POST',
      data: user,
      url: '/api/user'
    }).success(function(data, status, headers) {
      promise.resolve(data);
    }).error(promise.reject);

    return promise.promise;
  }
}
