// copy
// used to copy input contents to clipboard
angular
	.module('springboardApp')
	.directive('copycat', copycat);

function copycat() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var target = document.querySelector(attrs.copycat);

			if (target) {
				element.on('click', function() {
					var text = target.value;
					if (text) {
						copyText(text);
					}
				});
			}

			function copyText(text) {
				function selectElementText(element) {
					if (document.selection) {
						var range = document.body.createTextRange();
						range.moveToElementText(element);
						range.select();
					} else if (window.getSelection) {
						var range = document.createRange();
						range.selectNode(element);
						window.getSelection().removeAllRanges();
						window.getSelection().addRange(range);
					}
				}

				var element = document.createElement('div');
				element.textContent = text;
				document.body.appendChild(element);
				selectElementText(element);
				document.execCommand('copy');
				element.remove();
			}

		}
	}
}
