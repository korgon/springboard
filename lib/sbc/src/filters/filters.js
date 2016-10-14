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

// order dirstruct by attribute (type implemented)
angular
	.module('springboardApp')
	.filter('orderFilesBy', orderFilesBy);

function orderFilesBy() {
	return function(input, attribute) {

		if (!angular.isObject(input)) {
			return input;
		}

		var array = [];
		for (var objectKey in input) {
			array.push(input[objectKey]);
		}

		// sort by 'type'
		if (attribute == 'type') {
			array.sort(function(a, b) {
				if (a.type == 'file' && b.type == 'directory') {
					return 1;
				} else if(a.type == 'file' && b.type == 'file') {
					return a.name > b.name;
				}
			});
		}

		return array;
	}
}
