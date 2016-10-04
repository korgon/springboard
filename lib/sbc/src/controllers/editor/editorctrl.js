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

	var URL_CHANGE_TIMER = 777;

	vm.new_ui = {};
	$scope.loading.show = true;

	// get available catalogs (UIs)
	sitemanager.getUIs().then(function(uis) {
		vm.uis = uis;
	}, function(err) {
		console.error('Failed to get listing of available UI catalogs.');
	});

	// get carts and tags
	usermanager.status().then(function(status) {
		vm.tags = status.tags;
		vm.carts = status.carts;
	});

	// get site to be edited
	sitemanager.reloadSite().then(function(site) {
		vm.site = site;
		vm.relative_url = '/sites/' + vm.site.name + '/';
		vm.root_url = $window.location.origin + vm.relative_url;

		console.info('editing ' + vm.site.name + '...');

		var default_url = $window.location.origin + vm.site.default_url;

		// restore editor session for site
		vm.session = usermanager.loadEditorSession(vm.site.name, default_url);

		$scope.loading.show = false;
	}).catch(function(err) {
		// not editing any site...
		$location.path("/");
	});

	vm.changeUrl = function() {
		clearTimeout(changeTimeout);

		changeTimeout = setTimeout(function() {
			vm.session.frameurl = vm.session.url;
			usermanager.saveEditorSession(vm.session);
			$scope.$apply();
		}, URL_CHANGE_TIMER);
	}

	vm.setUrl = function(path) {
		vm.session.frameurl = vm.session.url = path;
		usermanager.saveEditorSession(vm.session);
	}

	vm.openUrl = function(url) {
		$window.open(url, '_blank');
	}

	vm.setDefaultHTML = function(path) {
		vm.site.default_url = '/sites/' + vm.site.name + '/' + path;
		vm.checkChange();
	}

	vm.setThumb = function(path) {
		vm.site.thumb = '/sites/' + vm.site.name + '/' + path;
		vm.checkChange();
	}

	vm.toggleCloudFile = function(path) {
		var in_cloud = vm.site.cloud_files.indexOf(path);
		if (in_cloud != -1) {
			vm.site.cloud_files.splice(in_cloud, 1);
		} else {
			vm.site.cloud_files.push(path);
		}
		vm.checkChange();
	}

	vm.forceCompile = function(ui) {
		$scope.loading.show = true;
		sitemanager.compileUI(ui.name).then(function() {
			// browser will be foreced to refresh
		}).catch(function(err) {
			console.error(err);
			$scope.loading.show = false;
		});
	}

	// return the init script (move this out of here one day...)
	vm.getScriptTag = function(catalog_type) {
		if (catalog_type == 'v3') {
			return '<!-- Springboard Catalog Init -->\r<script type="text/javascript">document.write(unescape(\'%3Cscript src="\' + \'//\' + window.location.host + window.location.pathname.substr(0, window.location.pathname.lastIndexOf("/") + 1) + \'generated/loader.js"%3E%3C/script%3E\'));</script>';
		}
	}

	vm.commitSite = function() {
		$scope.loading.show = true;
		return sitemanager.gitStatus().then(function(status) {
			$scope.loading.show = false;
			if (status.changes) {
				return modalmanager.open(
					'commit',
					{
						message: 'Commit message for changes',
						message_icon: 'commit',
						message_data: status.changes,
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
		$scope.loading.show = true;
		sitemanager.gitStatus().then(function(status) {
			$scope.loading.show = false;
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
			} else if (err.action == 'connect') {
				modalmanager.open(
					'alert',
					{
						message: err.message,
						message_icon: 'connection',
						button_cancel: 'Back',
						button_confirm: 'Retry'
					}
				).then(function() {
					// 'retry' chosen
					vm.pushSite();
				}).catch(function(err) {
					// do nothing
				});
			} else if (err != 'canceled') {
				modalmanager.open(
					'alert',
					{
						message: err.message,
						button_confirm: 'Back'
					}
				);
			}
			$scope.loading.show = false;
		});
	}

	vm.publishSite = function() {
		$scope.loading.show = true;
		sitemanager.publishSite().then(function(info) {
			console.log('site published!');
			$scope.loading.show = false;
			modalmanager.open(
				'publish',
				{
					message: 'Successfully uploaded files to CDN.',
					message_icon: 'publish',
					message_data: info,
					button_confirm: 'Close'
				}
			);
		}).catch(function(err) {
			if (err.action == 's3connect') {
				modalmanager.open(
					'alert',
					{
						message: err.message,
						message_icon: 'connection',
						button_cancel: 'Back',
						button_confirm: 'Retry'
					}
				).then(function() {
					// 'retry' chosen
					vm.publishSite();
				}).catch(function(err) {
					// do nothing
				});
			} else {
				modalmanager.open(
					'alert',
					{
						message: err.message,
						button_confirm: 'Back'
					}
				);
			}
			$scope.loading.show = false;
		}).then(vm.refreshCloudstruct);
	}

	vm.reloadSite = function() {
		$scope.loading.show = true;
		sitemanager.reloadSite().then(function(site) {
			vm.site = site;
			vm.edited = false;

			if (!site.catalogs[vm.session.tab['uigen'].current]) {
				vm.session.tab['uigen'].current = undefined;
				usermanager.saveEditorSession(vm.session);
			}
			$scope.loading.show = false;
		}).catch(function(err) {
			console.error(err);
			$scope.loading.show = false;
		});
	}

	// get directory structure
	vm.refreshDirstruct = function() {
		vm.dirstruct = {
			loading: true
		}
		return sitemanager.getSiteFiles().then(function(files) {
			vm.dirstruct.data = files;
			vm.dirstruct.loading = false;

			if (vm.isEmpty(vm.dirstruct.data.root.contents)) {
				throw { icon: 'alert', message: 'the site folder is empty' };
			}
		}).catch(function(err) {
			vm.dirstruct.error = err;
		});;
	}

	// get cloudfile structure
	vm.refreshCloudstruct = function() {
		vm.cloudstruct = {
			loading: true
		}
		return sitemanager.getSiteS3().then(function(files) {
			vm.cloudstruct.data = files;
			vm.cloudstruct.loading = false;

			if (vm.isEmpty(vm.cloudstruct.data.root.contents)) {
				throw { icon: 'info', message: 'CDN site folder is empty' };
			}
		}).catch(function(err) {
			vm.cloudstruct.error = err;
			if (err.action == 's3connect') vm.cloudstruct.error.icon = 'connect';
		});
	}

	// triggered by the 'save' button
	vm.saveChanges = function() {
		var main_tab = vm.session.current_tab;
		var section = vm.session.tab[main_tab].current || 'default';		// catalog or 'default' on settings
		var tab =	vm.session.tab[main_tab].vtab[section].tab;

		//console.log(main_tab + '>' + section + '>' + tab);

		// depending on tab position do different action
		if (main_tab == 'uigen') {
			// ui generator updates
			if (['settings', 'styles', 'variables', 'tags'].indexOf(tab) != -1) {
				// update the catalog
				vm.updateUI(tab, section);
			} else if (tab.match(/^module_/)) {
				// updating a module theme
				var module_name = tab.replace(/^module_/, '');
				var theme_name = vm.site.catalogs[section].modules[module_name].theme;

				vm.updateModuleTheme(section, module_name, theme_name);
			} else {
				console.log('doing something else?');
			}
		} else if (main_tab == 'settings') {
			// site settings updates
			if (['dirstruct', 'cloudstruct', 'proxy', 'settings'].indexOf(tab) != -1) {
				// update the site
				vm.updateSite();
			} else {
				console.log('doing something else?');
			}
		}
	}

	// update the site settings
	vm.updateSite = function() {
		$scope.loading.show = true;
		sitemanager.updateSite(vm.site).then(function(updated_site) {
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
			// get file structure
			return sitemanager.getSiteFiles();
		}).then(function(files) {
			vm.dirstruct = files;
			// browser will auto-refresh after install
			// catalog successfully installed!
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

	vm.updateUI = function(tab, catalog) {
		if (tab != 'styles' && tab != 'tags') {
			$scope.loading.show = true;
		}
		sitemanager.updateUI(vm.site.catalogs[catalog]).then(function(updated_site) {
			vm.site = updated_site;
			vm.edited = false;
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

	vm.installModule = function(catalog) {
		// first prevent button from working when editing settings on other tabs
		if (!vm.edited) {
			let module_name;
			return modalmanager.open(
				'moduleInstall',
				{
					libraryModules: vm.uis[catalog.type].modules,
					currentCatalog: catalog
				}
			).catch(function(err) {
				if (err && err.message) {
					return $q.reject(err);
				} else {
					return $q.reject('canceled');
				}
			}).then(function(details) {
				module_name = details.module;
				$scope.loading.show = true;
				return sitemanager.installModule(catalog.name, details);
			}).then(function(updated_site) {
				// browser will auto-refresh after install
				// module successfully installed!
				vm.switchVtab('module_' + module_name, catalog.name);
				//vm.site = updated_site;
				//$scope.loading.show = false;
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
		}
	}

	vm.updateModule = function(catalog_name, mod_name) {
		$scope.loading.show = true;

		var mod = vm.site.catalogs[catalog_name].modules[mod_name];
		sitemanager.updateModule(catalog_name, mod).then(function(updated_site) {
			// vm.site = updated_site;
			// vm.edited = false;
			// // need to make loading more apparent here
			// setTimeout(function() {
			// 	$scope.loading.show = false;
			// }, 1000);

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

	vm.updateModuleTheme = function(catalog_name, mod_name, theme_name) {
		$scope.loading.show = true;
		var theme = vm.site.catalogs[catalog_name].modules[mod_name].themes[theme_name];

		sitemanager.updateModuleTheme(catalog_name, mod_name, theme).then(function(updated_site) {
			// vm.site = updated_site;
			// vm.edited = false;
			//
			// // need to make loading more apparent here
			// setTimeout(function() {
			// 	$scope.loading.show = false;
			// }, 1000);

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

	vm.moduleInfo = function(mod) {
		var type = mod.themes[mod.theme].type;
		var parts = type.split('/');

		// if valid type (triune)
		if (parts.length == 3) {

			var readmeUrl = '/library/' + parts[0] + '/modules/' + parts[1] + '/' + parts[2] + '/readme/' + parts[2] + '.md';

			return modalmanager.open(
				'moduleInfo',
				{
					icon: mod.icon,
					type,
					readmeUrl
				}
			);
		}
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

	// open / close directory
	vm.toggleDir = function(struct, dir) {

		dir.collapsed = !dir.collapsed;
		// ensure session data exists
		vm.session[struct] = vm.session[struct] || [];

		if (!dir.collapsed) {
			if (vm.session[struct].indexOf(dir.path) == -1) {
				vm.session[struct].push(dir.path);
			}
		} else {
			var position = vm.session[struct].indexOf(dir.path);
			if (position != -1) {
				vm.session[struct].splice(position, 1);
			}
		}

		usermanager.saveEditorSession(vm.session);
	}

	// check if directory should be collapsed or not
	vm.checkDirState = function(struct, dir) {
		dir.collapsed = true;
		if (vm.session[struct]) {
			if (vm.session[struct].indexOf(dir.path) != -1) {
				dir.collapsed = false;
			}
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

	vm.isSingular = function(obj) {
		if (Object.keys(obj).length > 1) {
			return false;
		} else {
			return true;
		}
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
