// iframer
// used to help keep the iframe url and the url input box in sync
angular
	.module('springboardApp')
	.directive('iframer', iframer);

iframer.$inject = ['$document', 'usermanager'];

function iframer($document, usermanager) {
	return {
		scope: {
		},
		link: function(scope, element, attrs) {
			element.on('load', function() {
				iframeChange();

				element[0].contentWindow.onhashchange = function() {
					iframeChange();
				}
			});

			function iframeChange() {
				var newUrl = element[0].contentDocument.URL;

				if (scope.$parent.vm.session) {
					scope.$parent.vm.setUrl(newUrl);
					scope.$apply();
				}
			}
		}
	}
}
