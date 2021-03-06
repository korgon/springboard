// settings for springboard

module.exports = function(dir) {
	return {
		version: '1.1.1',
		app_dir: dir,
		app_log_http: false,
		app_port: 1337,
		app_proxy_port: 1338,
		koa_port: 1336,
		hooke_port: 1335,
		cdn_url: 'a.cdn.searchspring.net',
		sites_repo: 'git@github.com:korgon/springboard-sites.git',
		sites_repo_dir: dir + '/springboard-sites',
		sites_base_dir: 'sites',
		sites_thumb_dir: 'thumbs',
		library_repo: 'git@github.com:korgon/springboard-library.git',
		library_repo_dir: dir + '/springboard-library',
		user_config: 'lib/config/user.json',
		save_file: 'lib/config/cache.json',
		debug: false
	}
}
