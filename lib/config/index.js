// settings for springboard

module.exports = function(dir) {
	return {
		version: '0.0.1',
		app_dir: dir,
		app_port: 1337,
		app_log_http: false,
		koa_port: 1336,
		proxy_port: '8000',
		sites_repo: 'git@github.com:korgon/searchspring-sites.git',
		sites_repo_dir: dir + '/searchspring-sites',
		library_repo: '',
		library_repo_dir: dir + '/springboard-library',
		user_config: 'lib/config/user.json'
	}
}

// git@github.com:korgon/searchspring-sites.git
// git@bitbucket.org:searchspring/springboard.git
// git@bitbucket.org:searchspring/springboard-sites.git
// git@bitbucket.org:searchspring/springboard-modules.git
