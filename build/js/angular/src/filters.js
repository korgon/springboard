// filters

angular
  .module('springboardApp')
  .filter('trustAsResourceUrl', trustAsResourceUrl);

trustAsResourceUrl.$inject = ['$sce'];

function trustAsResourceUrl($sce) {
  return function(val) {
    return $sce.trustAsResourceUrl(val);
  };
}
