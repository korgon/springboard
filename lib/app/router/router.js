var router = require('koa-router')();
var koaBody = require('koa-better-body');

module.exports = function(springboard) {
	// begin route definitions



	// Old pre-angular implementation (using /routes/routes.js)

	// var routes = require(__dirname + '/routes/routes.js')();
	// router.get('/', routes.editor);
	// router.get(['/sites', '/gallery'], routes.gallery);
	// router.get('/sites/:site', routes.editSite);


	// api routes
	var sbapi = require('./api-v1.js')(springboard);

	// get or put user data
	router.get('/api/status', sbapi.status);
	router.get('/api/user', sbapi.getUser);
	router.post('/api/user', koaBody(), sbapi.putUser);

	// reload sites from file (trigger siteLoad)
	router.get('/api/sites/load', sbapi.loadSites);
	router.get('/api/sites/load/:ignore', sbapi.loadSites);

	// get sites or site json data
	router.get('/api/sites', sbapi.sites);

	// choose site to begin watching
	router.get('/api/site/edit/:site', sbapi.editSite);
	// see which site is being watched
	router.get('/api/site', sbapi.getSite);

	// create/update a new site
	router.post('/api/site/create', koaBody(), sbapi.addSite);
	router.post('/api/site/update', koaBody(), sbapi.updateSite);

	// git & s3
	router.get('/api/git', sbapi.gitStatus);
	router.post('/api/site/commit', koaBody(), sbapi.commitSite);
	router.get('/api/site/push', sbapi.pushSite);
	router.get('/api/site/reload', sbapi.reloadSite);
	router.get('/api/site/reset', sbapi.resetSite);
	router.get('/api/site/publish', sbapi.publishSite);

	// install set and update site catalog, modules, themes
	router.post('/api/site/install', koaBody(), sbapi.install);
	router.post('/api/site/theme', koaBody(), sbapi.setTheme);

	// library and catalogs
	router.get('/api/library', sbapi.getLibrary);
	router.get('/api/library/:catalog', sbapi.getLibrary);

	// end route definitions
	return router;
}
