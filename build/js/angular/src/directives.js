// directives

angular
  .module('springboardApp')
  .directive('iframer', iframer);

iframer.$inject = ['$document'];

function iframer($document) {
  return {
    scope: {
    },
    link: function(scope, element, attrs) {
      element.on('load', function() {
        var newUrl = element[0].contentDocument.URL;
        scope.$parent.vm.url = newUrl;
        var frameurl = angular.element(document.getElementById('frameurl'));
        frameurl.val(newUrl);
      })
    }
  }
}
