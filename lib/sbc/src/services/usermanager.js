'use strict';

// usermanager service
// manages user/login data

// not really doing it properly at the moment...
// the service could be storing things and preventing extra api requests

angular
	.module('springboardApp')
	.factory('usermanager', usermanager);

usermanager.$inject = ['$http', '$q', '$window', '$timeout'];

function usermanager($http, $q, $window, $timeout) {
	// user object
	var user;

	// service api
	return({
		alive: alive,
		status: status,
		getUser: getUser,
		putUser: putUser,
		loadEditorSession: loadEditorSession,
		saveEditorSession: saveEditorSession
	});

	// check if springboard is running
	function alive() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/alive'
		}).then(function(response, status, headers) {
			promise.resolve(response.data);
		}).catch(promise.reject);

		return promise.promise;
	}

	// get springboard status
	function status() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/status'
		}).then(function(response, status, headers) {
			promise.resolve(response.data);
		}).catch(promise.reject);

		return promise.promise;
	}

	// get user data
	function getUser() {
		var promise = $q.defer();

		$http({
			method: 'GET',
			url: '/api/user'
		}).then(function(response, status, headers) {
			user = response.data;

			promise.resolve(response.data);
		}).catch(promise.reject);

		return promise.promise;
	}

	// TODO
	// put user data
	function putUser(user) {
		var promise = $q.defer();

		$http({
			method: 'POST',
			data: user,
			url: '/api/user'
		}).then(function(response, status, headers) {
			promise.resolve(response.data);
		}).catch(function(err) {
			promise.reject(err);
		});

		return promise.promise;
	}

	// load the editor session values from storage
	function loadEditorSession(site_name, url) {
		// setting defaults or loading previous values from window storage
		var session_defaults = { site: site_name, showOptions: false, current_tab: 'settings', tab: { uigen: { vtab: {}, current: undefined }, settings: { vtab: { "default": { "tab": "dirstruct" } } } }, url: false };

		// value to return
		var session;

		// restore session
		session = angular.fromJson($window.sessionStorage.getItem('sites/' + site_name)) || session_defaults;
		if (session.site != site_name) session = session_defaults;

		if (Object.keys(session).length == 0 || !session.url) {
			session.frameurl = session.url = url;
		}
		return session;
	}

	// save the editor session values to storage
	function saveEditorSession(session) {
		$window.sessionStorage.setItem('sites/' + session.site, angular.toJson(session));
	}
}
