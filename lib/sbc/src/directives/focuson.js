// focus directive
// element gains focus set by focus service
angular
	.module('springboardApp')
	.directive('focusOn', focusOn);

focusOn.$inject = ['$timeout'];

function focusOn($timeout) {
	return {
		restrict: 'A',
		link: function(scope, element) {
			$timeout(function() {
				element[0].focus();
			}, 70);
		}
	};
}
