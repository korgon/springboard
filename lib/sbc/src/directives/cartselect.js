// cartselect
// used for choosing a cart platform

angular
	.module('springboardApp')
	.directive('cartselect', cartselect);

function cartselect() {
	return {
		restrict: 'E',
		templateUrl: 'partials/directives/cartselect.html',
		scope: {
			list: '=',
			selected: '='
		},
		link: function($scope) {
			$scope.listVisible = false;
			$scope.selected = $scope.list ? $scope.list[0] : [];

			$scope.select = function(item) {
				$scope.toggle();
				$scope.selected = item;
			};

			$scope.isSelected = function(item) {
				return item === $scope.selected;
			};

			$scope.toggle = function() {
				$scope.listVisible = !$scope.listVisible;
			};

			$scope.$watch('selected', function() {
				$scope.display = $scope.selected;
			});
		}
	}
}
