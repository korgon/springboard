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
			selected: '=',
			callback: '&'
		},
		link: function($scope) {
			$scope.listVisible = false;
			$scope.selected = $scope.selected || ($scope.list ? $scope.list[0] : []);

			if ($scope.list && $scope.list.length) {
				$scope.list.sort();
				$scope.list.splice(0, 0, $scope.list.splice($scope.list.indexOf($scope.selected), 1)[0]);
			}

			$scope.select = function(item) {
				$scope.toggle();
				$scope.selected = item;
				$scope.list.sort();
				$scope.list.splice(0, 0, $scope.list.splice($scope.list.indexOf(item), 1)[0]);

				if ($scope.callback) {
					$scope.callback();
				}
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
