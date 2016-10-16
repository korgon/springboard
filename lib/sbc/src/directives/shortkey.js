// shortkey
// used to attach listener to document to provide shortcut keys in controller
angular
	.module('springboardApp')
	.directive('shortkey', shortkey);

function shortkey() {
	return {
		restrict: 'A',
		scope: {
			shortkey: '&'
		},
		link: function(scope, element, attrs) {
			var body = angular.element(document.querySelector('body'));
			var frameview = document.getElementById('frameview');
			var framebody;

			if (frameview) {
				var frame = angular.element(frameview);
				console.log(frame);
				frame.on('load', function() {
					try {
						framebody = angular.element(frameview.contentDocument.querySelector('body'));
						console.log('loaded!');
						framebody.bind('keydown', function(event) {
							console.log('frame keypress!');
							scope.shortkey({ keyCode: event.which });
						});
					} catch(err) {
						console.warn('Cannot bind to iframe.');
					}
				});
			}

			body.bind('keydown', function(event) {
				console.log('body keypress!');
				scope.shortkey({ keyCode: event.which });
			});

			scope.$on('$destroy', function() {
				body.unbind('keydown');
				if (framebody) {
					framebody.unbind('keydown');
				}
			});
		}
	}
}

angular
	.module('springboardApp')
	.directive('noShortkey', noShortkey);

function noShortkey() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			element.bind('keypress', function($event) {
				$event.stopPropagation();
			})
		}
	}
}
