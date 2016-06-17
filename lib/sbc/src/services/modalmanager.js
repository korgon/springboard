'use strict';

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

  function open(type, params, pipeResponse) {
    var previousDeferred = modal.deferred;

    // set current modal
    modal.deferred = $q.defer();
    modal.params = params;

    // if a modal existed, pipe response
    if (previousDeferred && pipeResponse) {
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
    return(modal.params || {});
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

    modal.deferred.reject(reason);

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
