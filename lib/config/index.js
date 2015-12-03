module.exports = function(dir) {
  return {
    app_dir: dir,
    app_port: '1337',
    app_log_http: false,
    proxy_port: '8000',
    site_repo: 'git@github.com:korgon/searchspring-sites.git',
    site_repo_dir: dir + '/searchspring-sites',
    module_repo: '',
    module_repo_dir: dir + '/searchspring-modules'
  }
}
