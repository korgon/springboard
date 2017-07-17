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
	mm.detail_show = params.show_details || false;

	// used for s3 publish
	mm.message_data = params.message_data || {};

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
	var mm = { readmeUrl: '' };
	$scope.mm = mm;


	// modal resolution
	mm.closeModal = function(err) {
		modalmanager.reject(err);
	}

	// modal resolution
	mm.resolveModal = function() {
		// return the selected object for module installation
		modalmanager.resolve(mm.selected);
	}

	if (params.libraryModules && params.currentCatalog) {
		var modules = {};
		// remove from library currently installed catalogs
		angular.forEach(params.libraryModules, function(module) {
			if (!params.currentCatalog.modules[module.name]) {
				modules[module.name] = module;

				var parts = modules[module.name].type.split('/');
				if (!parts[2]) {
					parts[2] = 'default';
				}
				modules[module.name].iconUrl = '/library/' + parts[0] + '/modules/' + parts[1] + '/' + parts[2] + '/resources/icon.png';
			}
		});

		mm.available_modules = !Object.keys(modules).length;

		if (mm.available_modules) {
			return mm.closeModal({ message: 'No modules available to install.' });
		} else {
			var firstModule;
			for (firstModule in modules) break;
		}

		mm.selectModule = function(type) {
			var parts = type.split('/');
			if (!parts[2]) {
				parts[2] = 'default';
			}
			mm.readmeUrl = '/library/' + parts[0] + '/modules/' + parts[1] + '/' + parts[2] + '/resources/readme.md';

			// installation object
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
		mm.iconUrl = params.iconUrl;
		mm.type = params.type;
		mm.readmeUrl = params.readmeUrl;
	}

}


// Settings Modal Controller
/************************/
angular
	.module('springboardApp')
	.controller('ModalSettingsCtrl', ModalSettingsCtrl);

ModalSettingsCtrl.$inject = ['$scope', 'modalmanager', 'usermanager', 'focus'];

function ModalSettingsCtrl($scope, modalmanager, usermanager, focus) {
	$scope.loading.show = true;

	var params = modalmanager.params();
	var mm = { tab: 'user' };
	$scope.mm = mm;

	if (params.setup) {
		mm.setup = params.setup;
	}

	mm.setTab = function(tab) {
		mm.tab = tab;
	}

	// Setup defaults using the modal params.

	mm.button_cancel = params.button_cancel || 'Cancel';
	mm.button_confirm = params.button_confirm || 'Ok';


	// modal resolution
	mm.closeModal = function() {
		modalmanager.reject('canceled');
	}

	// modal resolution
	mm.resolveModal = function() {
		modalmanager.resolve(mm.input);
	}

	mm.saveSettings = function() {
		usermanager.putUser(mm.data).then(function() {
			mm.resolveModal();
		}).catch(function(resp) {
			modalmanager.reject(resp.data);
		});
	}

	usermanager.getUser().then(function(data) {
		$scope.loading.show = false;
		mm.data = data;
	}).catch(function(err) {
		$scope.loading.show = false;
		mm.closeModal();
	});
}
