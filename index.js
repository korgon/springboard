// begin
var conf = require('_/config')(__dirname);
var app = require('_/app');
var logit = require('_/logit');
var springboard = require('_/springboard');

springboard.init(conf).catch(function(err) {
  console.log('failed to initialize springboard!'.red);
  process.exit(1);
});

if (conf.app_log_http) {
  app.use(logger());
}

app.use(serve(global.site_repo_dir));

// start your engines
app.listen(conf.port + 1);
