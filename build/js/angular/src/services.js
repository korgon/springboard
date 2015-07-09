'use strict';

// services...

angular
  .module('springboardApp')
  .factory('sitemanager', sitemanager);

sitemanager.$inject = ['$http', '$q', '$timeout'];

function sitemanager($http, $q, $timeout) {
  // object containing every site object
  var sites = {};
  // object containing the current (editing) site
  var site = {};


  var service = {
    // reloadSites: function() { return reloadSites(); },
    getSites: getSites,
    getSite: getSite,
    editSite: editSite,
    commitSite: commitSite,
    pushSite: pushSite
  };

  return service;

  // switch to a new site for editing
  function editSite(site) {
    var promise = $q.defer();

    $http({
      method: 'GET',
      url: '/api/site/watch/' + site
    }).success(function(data, status, headers) {
      if (data.error) {
        promise.reject(data.message);
      }
      site = data;
      promise.resolve(site);
    }).error(promise.reject);

    return promise.promise;
  }

  // return site object or check server if site being watched
  function getSite() {
    var promise = $q.defer();

    $http({
      method: 'GET',
      url: '/api/site'
    }).success(function(data, status, headers) {
      if (data.error) {
        promise.reject(data.message);
      }
      site = data;
      promise.resolve(site);
    }).error(promise.reject);

    return promise.promise;
  }

  // return sites object or get sites from server
  function getSites() {
    var promise = $q.defer();

    if (Object.keys(sites).length > 0) {
      console.log('have sites allready...');
      promise.resolve(sites);
    } else {
      $http({
        method: 'GET',
        url: '/api/sites'
      }).success(function(data, status, headers) {
        sites = data;
        promise.resolve(sites);
      }).error(promise.reject);
    }

    return promise.promise;
  }

  // (save) commit the site locally
  function commitSite() {
    var promise = $q.defer();

    if (site.name) {
      $http({
        method: 'GET',
        url: '/api/site/commit'
      }).success(function(data, status, headers) {
        if (data.error) {
          promise.reject(data.message);
        } else {
          promise.resolve();
        }
      }).error(promise.reject);
    } else {
      promise.reject({ error: true, message: 'not editing any site!'});
    }

    return promise.promise;
  }

  // (save) commit the site locally
  function pushSite() {
    var promise = $q.defer();

    if (site.name) {
      $http({
        method: 'GET',
        url: '/api/site/push'
      }).success(function(data, status, headers) {
        if (data.error) {
          promise.reject(data.message);
        } else {
          promise.resolve();
        }
      }).error(promise.reject);
    } else {
      promise.reject({ error: true, message: 'not editing any site!'});
    }
    
    return promise.promise;
  }
}
