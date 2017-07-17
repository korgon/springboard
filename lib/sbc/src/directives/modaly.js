// modaly
// used to show / hide and choose which modal to show
angular
	.module('springboardApp')
	.directive('modaly', modaly);

modaly.$inject = ['$rootScope', 'modalmanager'];

function modaly($rootScope, modalmanager) {
	return {
		link: function(scope, element, attrs) {
			scope.modalview = null;

			// click on the modals container will auto reject the modal
			element.on('click', function handleClickEvent(event) {
				if (element[0] !== event.target) {
					return;
				}
				scope.$apply(modalmanager.reject('canceled'));
			});

			// listen for modal open emission
			var offModalOpener = $rootScope.$on('modals.open', function(event, modalType) {
				scope.modalview = modalType;
			});

			// listen for modal close emmision
			var offModalCloser = $rootScope.$on('modals.close', function(event) {
				scope.modalview = null;
			});

			scope.$on('$destroy', function() {
				offModalOpener();
				offModalCloser();
			});
		}
	}
}
