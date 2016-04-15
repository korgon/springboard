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

	// reload sites from file (trigger siteLoad)
	router.get('/api/sites/load', sbapi.loadSites);
	router.get('/api/sites/load/:ignore', sbapi.loadSites);

	// get sites or site json data
	router.get('/api/sites', sbapi.sites);

	// choose site to begin watching
	router.get('/api/site/edit/:site', sbapi.edit);
	// see which site is being watched
	router.get('/api/site', sbapi.site);

	// create/update a new site
	router.post('/api/site/create', koaBody(), sbapi.create);
	router.post('/api/site/update', koaBody(), sbapi.update);

	// git & s3
	router.get('/api/site/status', sbapi.status);
	router.post('/api/site/commit', koaBody(), sbapi.commit);
	router.get('/api/site/push', sbapi.push);
	router.get('/api/site/merge', sbapi.merge);
	router.get('/api/site/reset', sbapi.reset);
	router.get('/api/site/publish/mockup', sbapi.publishMockup);


	// catalogs, modules and themes
	router.get('/api/library', sbapi.library);
	router.get('/api/library/:catalog', sbapi.library);

	// install anything
	router.post('/api/site/install', koaBody(), sbapi.install);

	// end route definitions
	return router;
}
