// default settings for springboard

module.exports = function(dir) {
	return {
		version: '1.1.0',
		app_dir: dir,
		app_port: '1337',
		app_log_http: false,
		proxy_port: '8000',
		sites_repo: 'git@github.com:korgon/searchspring-sites.git',
		sites_repo_dir: dir + '/searchspring-sites',
		library_repo: '',
		library_repo_dir: dir + '/springboard-library',
		user_config: 'lib/config/user.json'
	}
}

// git@github.com:korgon/searchspring-sites.git
// git@bitbucket.org:searchspring/searchspring-sites.git
// git@bitbucket.org:searchspring/springboard-modules.git
