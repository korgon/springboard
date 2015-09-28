'use strict';

/*******************/
// Modal Controllers
/*******************/


// Alert Modal Controller
/************************/
angular
  .module('springboardApp')
  .controller('ModalAlertCtrl', ModalAlertCtrl);

ModalAlertCtrl.$inject = ['$scope', 'modalmanager', 'focus'];

function ModalAlertCtrl($scope, modalmanager, focus) {

  var params = modalmanager.params();
  var mm = {};
  $scope.mm = mm;

  // Setup defaults using the modal params.
  mm.message_icon = ( params.message_icon || 'alert' );
  mm.message = ( params.message || 'Whoops... Something failed...' );
  mm.button_confirm = ( params.button_confirm || 'Ok' );
  mm.button_cancel = ( params.button_cancel || false );

  // focus on the close button
  focus('modalClose');

  // modal resolution
  mm.closeModal = function() {
    modalmanager.reject();
  }

  // modal resolution
  mm.resolveModal = function() {
    modalmanager.resolve();
  }

}

// Input Modal Controller
/************************/
angular
  .module('springboardApp')
  .controller('ModalInputCtrl', ModalInputCtrl);

ModalInputCtrl.$inject = ['$scope', 'modalmanager', 'focus'];

function ModalInputCtrl($scope, modalmanager, focus) {

  var params = modalmanager.params();
  var mm = {};
  $scope.mm = mm;

  // Setup defaults using the modal params.
  mm.message_icon = ( params.message_icon || 'alert' );
  mm.message = ( params.message || 'Do the thing?' );
  mm.button_cancel = ( params.button_cancel || 'Cancel' );
  mm.button_confirm = ( params.button_confirm || 'Ok' );

  // focus on the input
  focus('modalInput');

  // modal resolution
  mm.closeModal = function() {
    modalmanager.reject();
  }

  // modal resolution
  mm.resolveModal = function() {
    modalmanager.resolve(mm.input);
  }
}
