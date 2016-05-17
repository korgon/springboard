'use strict';

// Editor Controller
/*******************/
angular
	.module('springboardApp')
	.controller('EditorCtrl', EditorCtrl);

EditorCtrl.$inject = ['$scope', '$location', '$window', '$q', 'focus', 'usermanager', 'sitemanager', 'modalmanager'];

function EditorCtrl($scope, $location, $window, $q, focus, usermanager, sitemanager, modalmanager) {
	var vm = this;
	var changeTimeout;

	vm.new_ui = {};
	$scope.loading.show = true;

	// get available catalogs (UIs)
	sitemanager.getUIs().then(function(uis) {
		vm.uis = uis;
	}, function(err) {
		console.error('Failed to get listing of available UI catalogs.');
	});

	// get site to be edited
	sitemanager.getSite().then(function(site) {
		// reload to pull in potential file changes (forced reload)
		return sitemanager.reloadSite();
	}).then(function(site) {
		vm.site = site;

		$scope.loading.show = false;
		console.info('editing ' + vm.site.name + '...');

		var default_url = $location.absUrl().match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i)[0];
		default_url += 'sites/' + vm.site.name + '/' + site.default_html;

		// restore editor session for site
		vm.session = usermanager.loadEditorSession(vm.site.name, default_url);
	}).catch(function(err) {
		// not editing any site...
		$location.path("/");
	});

	vm.changeUrl = function() {
		clearTimeout(changeTimeout);

		changeTimeout = setTimeout(function() {
			vm.session.frameurl = vm.session.url;
			vm.saveEditorSession();
			$scope.$apply();
		}, 350);
	}

	vm.openUrl = function() {
		$window.open(vm.session.url, '_blank');
	}

	vm.commitSite = function() {
		return sitemanager.gitStatus().then(function(status) {
			if (status.changes) {
				return modalmanager.open(
					'input',
					{
						message: 'Commit message for changes',
						message_icon: 'commit',
						button_cancel: 'Cancel',
						button_confirm: 'Save'
					}
				).catch(function(err) {
					return $q.reject('canceled');
				}).then(function(response) {
					$scope.loading.show = true;
					return sitemanager.commitSite(response);
				}).then(function() {
					$scope.loading.show = false;
				}).catch(function(err) {
					$scope.loading.show = false;
					if (err != 'canceled') {
						return modalmanager.open(
							'alert',
							{
								message: err.message,
								button_confirm: 'Back'
							}
						);
					} else {
						return $q.reject('canceled');
					}
				});
			} else {
				modalmanager.open(
					'alert',
					{
						message: 'There are no changes to commit.',
						button_confirm: 'Back'
					}
				).catch(function(err) {
					return $q.resolve();
				}).then(function() {
					$scope.loading.show = false;
					return $q.reject('nothing to commit');
				});
			}
		});
	}

	vm.pushSite = function() {
		sitemanager.gitStatus().then(function(status) {
			if (status.changes) {
				// things to commit
				return vm.commitSite();
			} else if (status.ahead) {
				// ready to push
				return $q.resolve();
			} else {
				// nothing to push
				return $q.reject('nothing to push');
			}
		}).catch(function(err) {
			return $q.reject(err);
		}).then(function() {
			$scope.loading.show = true;
			return sitemanager.pushSite();
		}).then(function() {
			$scope.loading.show = false;
		}).catch(function(err) {
			if (err == 'nothing to push') {
				modalmanager.open(
					'alert',
					{
						message: 'There are no commits to push.',
						button_confirm: 'Back'
					}
				);
			} else if (err != 'canceled') {
				console.error(err);
				modalmanager.open(
					'alert',
					{
						message: err.message,
						button_confirm: 'Back'
					}
				);
			}
			$scope.loading.show = false;
		});;
	}

	vm.publishSite = function() {
		$scope.loading.show = true;
		sitemanager.publishSite().then(function() {
			console.log('site published!');
			$scope.loading.show = false;
		}).catch(function(err) {
			console.error(err);
			$scope.loading.show = false;
		});
	}

	vm.reloadSite = function() {
		$scope.loading.show = true;
		sitemanager.reloadSite().then(function(site) {
			vm.site = site;
			vm.edited = false;

			if (!site.catalogs[vm.session.tab['uigen'].current]) {
				vm.session.tab['uigen'].current = undefined;
				vm.saveEditorSession();
			}
			$scope.loading.show = false;
		}).catch(function(err) {
			console.error(err);
			$scope.loading.show = false;
		});
	}

	// triggered by the 'save' button
	vm.saveChanges = function() {
		var main_tab = vm.session.current_tab;
		var section = vm.session.tab[main_tab].current;		// catalog or 'default' on settings
		var tab =	vm.session.tab[main_tab].vtab[section].tab;

		console.log(main_tab + '>' + section + '>' + tab);
		// depending on tab position do different action
		if (main_tab == 'uigen') {
			// ui generator updates
			if (['settings', 'styles'].indexOf(tab) != -1) {
				// update the catalog
				vm.updateUI(section);
			} else {
				console.log('doing something else');
			}
		} else if (main_tab == 'settings') {
			// site settings updates
		}
	}

	// install new catalog (ui)
	vm.installUI = function() {
		$scope.loading.show = true;
		var ui_data = { type: vm.new_ui.type, name: vm.new_ui.name };
		sitemanager.installUI(ui_data).then(function(updated_site) {
			vm.site = updated_site;
			vm.hideAddInput();
			vm.initVtab(vm.new_ui.name);
			vm.toggleUI(vm.new_ui.name);
			vm.new_ui.name = '';
			$scope.loading.show = false;
		}).catch(function(err) {
			$scope.loading.show = false;
			modalmanager.open(
				'alert',
				{
					message: err.message
				}
			);
		});
	}

	vm.updateUI = function(catalog) {
		$scope.loading.show = true;
		sitemanager.updateUI(vm.site.catalogs[catalog]).then(function(updated_site) {
			vm.site = updated_site;
			vm.edited = false;
			$scope.loading.show = false;
		}, function(err) {
			$scope.loading.show = false;
			var promise = modalmanager.open(
				'alert',
				{
					message: err.message
				}
			);
		});
	}

	vm.updateModule = function(catalog_name, mod_name) {
		$scope.loading.show = true;
		sitemanager.updateModule(catalog_name, vm.site.catalogs[catalog_name].modules[mod_name]).then(function(updated_site) {
			vm.site = updated_site;
			vm.edited = false;
			$scope.loading.show = false;
		}, function(err) {
			$scope.loading.show = false;
			var promise = modalmanager.open(
				'alert',
				{
					message: err.message
				}
			);
		});
	}

	vm.installModuleTheme = function(catalog_name, mod_name, theme_name) {
		$scope.loading.show = true;
		sitemanager.installModuleTheme(catalog_name, mod_name, theme_name).then(function(updated_site) {
			vm.site = updated_site;
			$scope.loading.show = false;
		}, function(err) {
			$scope.loading.show = false;
			var promise = modalmanager.open(
				'alert',
				{
					message: err.message
				}
			);
		});
	}

	// open/close the editor panel
	vm.toggleEditor = function() {
		vm.session.showOptions = !vm.session.showOptions;
		usermanager.saveEditorSession(vm.session);
	}

	// change main tab (ui/settings)
	vm.switchTab = function(new_tab) {
		// prevent movement when edits made
		if (!vm.edited) {
			vm.session.current_tab = new_tab;
			usermanager.saveEditorSession(vm.session);
		}
	}

	// change vertical tab
	vm.switchVtab = function(new_tab, section) {
		// prevent movement when edits made
		if (!vm.edited) {
			vm.session.tab[vm.session.current_tab].vtab[section].tab = new_tab;
			usermanager.saveEditorSession(vm.session);
		}
	}

	vm.activeVtab = function(section) {
		return vm.session.tab[vm.session.current_tab].vtab[section].tab;
	}

	vm.initVtab = function(section) {
		// set defaults
		if (!vm.session.tab[vm.session.current_tab].vtab[section]) {
			vm.session.tab[vm.session.current_tab].vtab[section] = {};

			if (vm.session.current_tab == 'uigen') {
				vm.session.tab[vm.session.current_tab].vtab[section].tab = 'settings';
			} else if (vm.session.current_tab == 'settings') {
				vm.session.tab[vm.session.current_tab].vtab[section].tab = 'files';
			}
		}

		if (!vm.session.tab[vm.session.current_tab].vtab[section].visible)
			vm.session.tab[vm.session.current_tab].vtab[section].visible = false;
	}

	// open / close ui being edited
	vm.toggleUI = function(section) {
		// prevent movement when edits made
		if (!vm.edited) {
			vm.session.tab['uigen'].vtab[section].visible = !vm.session.tab['uigen'].vtab[section].visible;
			if (vm.session.tab['uigen'].vtab[section].visible) {
				vm.session.tab['uigen'].current = section;
			} else {
				vm.session.tab['uigen'].current = undefined;
			}
			usermanager.saveEditorSession(vm.session);
		}
	}

	vm.showAddInput = function() {
		vm.new_ui = { type: 'v3' };
		vm.new_ui_show = true;
		focus('moduleName');
	}
	vm.hideAddInput = function() {
		vm.new_ui_show = false;
	}

	vm.isEmpty = function(obj) {
		return angular.equals({}, obj);
	}

	vm.checkChange = function() {
		sitemanager.getSite().then(function(site) {
			if (angular.equals(vm.site, site)) {
				// change bottom buttons (commit/push/publish)
				// unlock tab navigation
				vm.edited = false;
			} else {
				// change bottom buttons (reset/push/save)
				// lock down tab navigation
				vm.edited = true;
			}
		});
	}

}
