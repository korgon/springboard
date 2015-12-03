// directives

// iframer
// used to help keep the iframe url and the url input box in sync
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
        scope.$parent.vm.session.url = newUrl;
        var frameurl = angular.element(document.getElementById('frameurl'));
        frameurl.val(newUrl);
      })
    }
  }
}


// modaly
// used to show / hide and choose which modal to show
angular
  .module('springboardApp')
  .directive('modaly', modaly);

modaly.$inject = ['$rootScope', 'modalmanager'];

function modaly($rootScope, modalmanager) {
  return {
    link: function(scope, element, attrs) {
      console.log('modaly init... linking');
      scope.vm.modalview = null;

      // click on the modals container will auto reject the modal
      element.on('click', function handleClickEvent(event) {
        if (element[0] !== event.target) {
          return;
        }
        scope.$apply(modalmanager.reject);
      });

      // listen for modal open emission
      $rootScope.$on('modals.open', function(event, modalType) {
        console.log('opening modal...');
        scope.vm.modalview = modalType;
      });

      // listen for modal close emmision
      $rootScope.$on('modals.close', function(event) {
        console.log('closing modal...');
        scope.vm.modalview = null;
      });
    }
  }
}

// focus directive
// element gains focus set by focus service
angular
  .module('springboardApp')
  .directive('focusOn', focusOn);

function focusOn() {
  return function(scope, element, attrs) {
    scope.$on('focusOn', function(e, name) {
      if(name === attrs.focusOn) {
        element[0].focus();
      }
    });
  }
}
