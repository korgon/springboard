'use strict';

/*******************/
// Modal Controllers
/*******************/


// Alert Modal Controller
/************************/
angular
  .module('springboardApp')
  .controller('ModalAlertCtrl', ModalAlertCtrl);

ModalAlertCtrl.$inject = ['$scope', 'modalmanager'];

function ModalAlertCtrl($scope, modalmanager) {

  console.log('in alert modal');

  var params = modalmanager.params();
  var mm = {};
  $scope.mm = mm;

  // Setup defaults using the modal params.
  mm.message = ( params.message || 'Do the thing?' );

  // modal resolution
  mm.closeModal = function() {
    console.log('close the modal yo');
    modalmanager.resolve();
  }
}
