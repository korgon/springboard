'use strict';

/*******************/
// Modal Controllers
/*******************/


// Alert Modal Controller
/************************/
angular
	.module('springboardApp')
	.controller('ModalAlertCtrl', ModalAlertCtrl);

ModalAlertCtrl.$inject = ['$scope', 'modalmanager', 'focus'];

function ModalAlertCtrl($scope, modalmanager, focus) {
	var params = modalmanager.params();
	var mm = {};
	$scope.mm = mm;

	// Setup defaults using the modal params.
	mm.message_icon = ( params.message_icon || 'alert' );
	mm.message = ( params.message || 'Something failed...' );
	mm.button_confirm = ( params.button_confirm || 'Ok' );
	mm.button_cancel = ( params.button_cancel || false );

	// focus on the close button
	focus('modalClose');

	// modal resolution
	mm.closeModal = function() {
		modalmanager.reject();
	}

	// modal resolution
	mm.resolveModal = function() {
		modalmanager.resolve();
	}
}

// Input Modal Controller
/************************/
angular
	.module('springboardApp')
	.controller('ModalInputCtrl', ModalInputCtrl);

ModalInputCtrl.$inject = ['$scope', 'modalmanager', 'focus'];

function ModalInputCtrl($scope, modalmanager, focus) {
	var params = modalmanager.params();
	var mm = {};
	$scope.mm = mm;

	// Setup defaults using the modal params.
	mm.message_icon = params.message_icon || 'alert';
	mm.message = params.message || '...';

	// used for git commit
	mm.message_data = params.message_data || {};

	mm.button_cancel = params.button_cancel || 'Cancel';
	mm.button_confirm = params.button_confirm || 'Ok';

	// focus on the input
	focus('modalInput');

	// modal resolution
	mm.closeModal = function() {
		modalmanager.reject('closed');
	}

	// modal resolution
	mm.resolveModal = function() {
		modalmanager.resolve(mm.input);
	}
}

// Module Modal Controller
/************************/
// used for installing modules and viewing the readme
angular
	.module('springboardApp')
	.controller('ModalModuleCtrl', ModalModuleCtrl);

ModalModuleCtrl.$inject = ['$scope', 'modalmanager', 'focus'];

function ModalModuleCtrl($scope, modalmanager, focus) {
	var params = modalmanager.params();
	var mm = {};
	$scope.mm = mm;

	// modal resolution
	mm.closeModal = function(err) {
		modalmanager.reject(err);
	}

	// modal resolution
	mm.resolveModal = function() {
		modalmanager.resolve(mm.selected);
	}

	if (params.libraryModules && params.catalogModules) {
		var modules = {};
		// remove from library currently installed catalogs
		angular.forEach(params.libraryModules, function(module) {
			if (!params.catalogModules[module.name]) {
				modules[module.name] = module;
			}
		});

		if (!Object.keys(modules).length) {
			mm.closeModal({ message: 'No modules available to install.' });
		} else {
			var firstModule;
			for (firstModule in modules) break;
		}

		mm.selectModule = function(type) {
			var parts = type.split('/');
			if (!parts[2]) {
				parts[2] = 'default';
			}
			mm.readmeUrl = '/library/' + parts[0] + '/modules/' + parts[1] + '/' + parts[2] + '/readme/' + parts[2] + '.md';
			mm.selected = {
				catalog: parts[0],
				module: parts[1],
				theme: parts[2]
			}
		}

		// install model
		mm.modules = modules;
		mm.selectModule(modules[firstModule].themes['default'].type);

	} else {
		// readme model
		mm.icon = params.icon;
		mm.type = params.type;
		mm.readmeUrl = params.readmeUrl;
	}

}
