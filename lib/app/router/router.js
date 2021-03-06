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

	// alive check
	router.get('/api/alive', sbapi.alive);
	// determine springboard status
	router.get('/api/status', sbapi.status);
	// current repo status (branch/changes/ahead)
	router.get('/api/git', sbapi.gitStatus);

	// get or put user data
	router.get('/api/user', sbapi.getUser);
	router.post('/api/user', koaBody(), sbapi.putUser);

	// reload sites from git and files (trigger siteLoad)
	router.get('/api/sites/fetch', sbapi.fetchSites);
	// reload sites
	router.get('/api/sites/load', sbapi.loadSites);
	// reload sites (optional ignore unpushed commits)
	router.get('/api/sites/load/:ignore', sbapi.loadSites);

	// get sites json data
	router.get('/api/sites', sbapi.sites);
	// get current site json data
	router.get('/api/sites/:site', sbapi.getSite);

	// create a new site
	router.post('/api/create', koaBody(), sbapi.addSite);

	// choose site to begin watching (editing)
	router.get('/api/edit/:site', sbapi.editSite);
	router.get('/api/edit/:site/:offline', sbapi.editSite);

	// get current site json data
	router.get('/api/site', sbapi.getSite);
	// update current site
	router.post('/api/site', koaBody(), sbapi.updateSite);

	// filestructure
	router.get('/api/site/files', sbapi.getSiteFiles);
	router.get('/api/site/s3', sbapi.getSiteS3);

	// git & s3
	router.post('/api/site/commit', koaBody(), sbapi.commitSite);
	router.get('/api/site/push', sbapi.pushSite);
	router.get('/api/site/reload', sbapi.reloadSite);
	router.get('/api/site/reset', sbapi.resetSite);
	router.get('/api/site/publish', sbapi.publishSite);
	router.post('/api/site/publish', koaBody(), sbapi.publishFile);

	// install catalog
	router.post('/api/site/capture', koaBody(), sbapi.captureSite);

	// install set and update site catalog, modules, themes
	// install catalog
	router.post('/api/site/install', koaBody(), sbapi.installCatalog);
	// compile catalog
	router.post('/api/site/compile', koaBody(), sbapi.compileCatalog);
	// update catalog
	router.post('/api/site/:catalog', koaBody(), sbapi.updateCatalog);
	// install module
	router.post('/api/site/:catalog/install', koaBody(), sbapi.installModule);
	// update module
	router.post('/api/site/:catalog/:module', koaBody(), sbapi.updateModule);
	// install theme
	router.post('/api/site/:catalog/:module/install', koaBody(), sbapi.installTheme);
	// update theme
	router.post('/api/site/:catalog/:module/:theme', koaBody(), sbapi.updateTheme);

	// library and catalogs
	router.get('/api/library', sbapi.getLibrary);
	router.get('/api/library/:catalog', sbapi.getLibrary);

	// end route definitions
	return router;
}
