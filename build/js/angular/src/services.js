'use strict';

// services...

// sitemanager
// manages site data

angular
  .module('springboardApp')
  .factory('sitemanager', sitemanager);

sitemanager.$inject = ['$http', '$q', '$timeout'];

function sitemanager($http, $q, $timeout) {
  // object containing every site object
  var sites = {};
  // object containing the current (editing) site
  var site = {};

  // service api
  return({
    // reloadSites: function() { return reloadSites(); },
    loadSites: loadSites,
    getSites: getSites,
    getSite: getSite,
    editSite: editSite,
    commitSite: commitSite,
    pushSite: pushSite,
    publishSiteMockup: publishSiteMockup
  });

  // switch to a new site for editing
  function editSite(site) {
    var promise = $q.defer();

    $http({
      method: 'GET',
      url: '/api/site/edit/' + site
    }).success(function(data, status, headers) {
      if (data.error) {
        promise.reject(data.message);
      }
      // empty the sites object
      sites = {}
      site = data;
      promise.resolve(site);
    }).error(promise.reject);

    return promise.promise;
  }

  // get current details of site under edit
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

  // triggers complete reload of sites (including pull)
  // return sites objects
  function loadSites() {
    var promise = $q.defer();

    $http({
      method: 'GET',
      url: '/api/sites/load'
    }).success(function(data, status, headers) {
      // empty site object
      site = {};
      sites = data;
      promise.resolve(sites);
    }).error(promise.reject);

    return promise.promise;
  }

  // return sites objects
  function getSites() {
    var promise = $q.defer();

    $http({
      method: 'GET',
      url: '/api/sites'
    }).success(function(data, status, headers) {
      // empty site object
      site = {};
      sites = data;
      promise.resolve(sites);
    }).error(promise.reject);

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
          promise.resolve(data);
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
          promise.resolve(data);
        }
      }).error(promise.reject);
    } else {
      promise.reject({ error: true, message: 'not editing any site!'});
    }

    return promise.promise;
  }

  function publishSiteMockup() {
    var promise = $q.defer();

    if (site.name) {
      $http({
        method: 'GET',
        url: '/api/site/publish/mockup'
      }).success(function(data, status, headers) {
        if (data.error) {
          promise.reject(data.message);
        } else {
          promise.resolve(data);
        }
      }).error(promise.reject);
    } else {
      promise.reject({ error: true, message: 'not editing any site!'});
    }

    return promise.promise;
  }
}

// modal service
angular
  .module('springboardApp')
  .factory('modalmanager', modalmanager);

modalmanager.$inject = ['$rootScope', '$q'];

function modalmanager($rootScope, $q) {

  // current modal in use
  var modal = {
    deferred: null,
    params: null
  }

  // service api
  return({
    open: open,
    params: params,
    proceedTo: proceedTo,
    reject: reject,
    resolve: resolve
  });

  function open( type, params, pipeResponse ) {
    var previousDeferred = modal.deferred;

    // set current modal
    modal.deferred = $q.defer();
    modal.params = params;

    // if a modal existed, pipe response
    if ( previousDeferred && pipeResponse ) {
      modal.deferred.promise.then(previousDeferred.resolve, previousDeferred.reject);
    // no piping - reject
    } else if (previousDeferred) {
      previousDeferred.reject();
    }

    // open modal (using directive)
    $rootScope.$emit('modals.open', type);

    return(modal.deferred.promise);
  }

  // return current params
  function params() {
    return( modal.params || {} );
  }

  // used for passing modal params
  function proceedTo(type, params) {
    return(open(type, params, true));
  }

  // reject modal
  function reject(reason) {
    if (!modal.deferred) {
      return;
    }

    modal.deferred.reject( reason );

    // close the modal
    modal.deferred = modal.params = null;
    $rootScope.$emit('modals.close');
  }

  // resolve modal
  function resolve(response) {
    if (!modal.deferred) {
      return;
    }

    modal.deferred.resolve(response);

    // close the modal
    modal.deferred = modal.params = null;
    $rootScope.$emit('modals.close');
  }
}
