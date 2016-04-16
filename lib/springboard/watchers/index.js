var chokidar = require('chokidar');
var sass = require('node-sass');
var ccss = require('clean-css');

/*******************/
// Watch functions //
/*******************/

// watchers for watching things...
var watchers = {
  all_seeing_eye: '', // used for tracking js
  eye_of_sauron: '', // used for tracking sass
  eye_of_saturn: '', // used for tracking json
  eye_of_horus: '' // used for tracking html
};

// pass a website for watching
function startWatch(website) {

}

function stopWatch() {
  site = null;
  // blinding the eyes
  if (watchers.eye_of_sauron) watchers.eye_of_sauron.close();
  watchers.eye_of_sauron = null;
  if (watchers.eye_of_horus)	watchers.eye_of_horus.close();
  watchers.eye_of_horus = null;
  //if (watchers.eye_of_saturn)	watchers.eye_of_saturn.end();
  //if (watchers.all_seeing_eye)	watchers.all_seeing_eye.end();

  // force garbage collection (reduces memory footprint)
  global.gc();

  return;
}

function watchScss() {
  // close the watch if it exists
  if (watchers.eye_of_sauron) watchers.eye_of_sauron.close();

  // new watching method to rid ourselves of gulp
  var watch_list = [ site.directory + '/**/*.scss'];

  watchers.eye_of_sauron = chokidar.watch(watch_list, { ignoreInitial: true });

  // watch for when new files are created
  watchers.eye_of_sauron.on('add', function(path) {
    actOnChange(path);
  });

  // watch for when files are changed
  watchers.eye_of_sauron.on('change', function(path) {
    actOnChange(path);
  });

  function actOnChange(path) {
    site.setStatus({ gitstatus: 'uncommited' });

    var file_path = path.replace(site.directory, '');
    var file_root_directory = file_path.match(/\/[^\/]*\//) ? file_path.match(/\/[^\/]*\//)[0] : '/';
    var file = file_path.replace(/^.*[\\\/]/, '');

    console.log('A file has changed:', file);
    console.log('In the directory:', file_root_directory);

    // check if file is within a module
    var module_dir = file_root_directory.replace(/\//g, '');
    if (Object.keys(site.modules).indexOf(module_dir) > -1) {
      // file is in a module!
      console.log('Part of module:', module_dir);
    } else {
      scssBuilder(path);
    }
  }

  // ran by the watcher to compile to css and minify
  function scssBuilder(path) {
    var source_file = path.replace(/^(.*\/)(.*)\.(.*)$/, '$2.$3');

    // check if file is an include file
    if (source_file.match(/^\_.*/)) {
      // TODO find parent source
      // or just compile all scss in containing folder just to be sure
      console.log('need to compile the parent files... but not doing it now!');
      return;
    }
    var dest_folder = site.directory + '/css/';
    var dest_css = dest_folder + path.replace(/^(.*\/)(.*)\.(.*)$/, '$2.css');
    var dest_min = dest_folder + path.replace(/^(.*\/)(.*)\.(.*)$/, '$2.min.css');
    var dest_map = dest_folder + path.replace(/^(.*\/)(.*)\.(.*)$/, '$2.css.map');

    var sass_options = {
      file: path,
      outputStyle: 'expanded',
      outFile: path.replace(/^(.*\/)(.*)\.(.*)$/, '$2.css'),
      sourceMap: true
    };

    sass.render(sass_options, function(err, result) {
      if (err) {
        logit.log('scss', 'sass failed to compile', 'fail');
        console.log(err);
      } else {
        if (!fs.existsSync(dest_folder)) {
          logit.log('scss', 'created css directory for files...');
          fs.mkdirSync(dest_folder);
        }

        var ccss_options = {
          // see https://www.npmjs.com/package/clean-css
        };

        var minified = new ccss(ccss_options).minify(result.css).styles;
        fs.writeFileSync(dest_min, minified);
        fs.writeFileSync(dest_css, result.css);
        fs.writeFileSync(dest_map, result.map);
        //browserSync.reload([dest_css, dest_min]);
        logit.log('scss', 'compiled and minified ' + source_file, 'pass');
      }
    });
  }
}

function watchHtml() {
  // html task to reload browser on change
  if (watchers.eye_of_horus) watchers.eye_of_horus.close();

  // new watching method to rid ourselves of gulp
  var watch_list = [site.directory + '/*.html',
                    site.directory + '/*.htm'];
  watchers.eye_of_horus = chokidar.watch(watch_list, { ignoreInitial: true });

  watchers.eye_of_horus.on('change', function(path) {
    handleHtml(path);
  })
  .on('add', function(path) {
    handleHtml(path);
  })

  function handleHtml(path) {
    site.setStatus({ gitstatus: 'uncommited' });
    //browserSync.reload();
  }
}

function watchJSON() {
  // // watch json template building files for changes
  // var watchlist = [site.directory + '/build/**/.*.json', site.directory + '/build/**/**/.*.json'];
  // var jsonfile, njfile;
  //
  // // render nunjucks template files
  // gulp.task('rendernj', function() {
  // 	return gulp.src(watchlist)
  // 	.pipe(tap(function(file,t) {
  // 		jsonfile = path.dirname(file.path) + '/' + path.basename(file.path);
  // 		njfile = jsonfile.replace(/json$/, 'nj.js');
  // 		console.log(jsonfile + ' -> ' + njfile);
  // 	}))
  // 	.pipe(gcb(function(){
  // 		console.log('rendering nj...');
  // 		site.setStatus({ gitstatus: 'uncommited' });
  // 	}));
  // });
  //
  // // watch for JSON file changes (represents a change in the config of modules)
  // if (watchers.eye_of_saturn) {
  // 	// stop the watch in the rare case that it should ever exist
  // 	watchers.eye_of_saturn.end();
  // }
  // // start the watch again
  // watchers.eye_of_saturn = gulp.watch(watchlist, ['rendernj']);
}

function watchJs() {
  // // watch js files for change
  // var ignorelist = ['!' + site.directory + '/build/**/*.nj.js', '!' + site.directory + '/build/**/.*.nj.js'];
  // var watchlist = [site.directory + '/build/**/*.js', site.directory + '/build/**/.*.js'];
  // var buildlist = [site.directory + '/build/modules/**/.*.js', site.directory + '/build/.init.js', site.directory + '/build/init_options.js'];
  // watchlist = watchlist.concat(ignorelist);
  // buildlist = buildlist.concat(ignorelist);
  // // js task compile and reload browser
  // gulp.task('buildjs', function() {
  // 	return gulp.src(buildlist)
  // 	.pipe(concat(site.name + '.js'))
  // 	.pipe(gulp.dest(site.directory + '/js'))
  // 	.pipe(gcb(function(){
  // 		console.log('js watch!');
  // 		site.setStatus({ gitstatus: 'uncommited' });
  // 	}));
  // });
  //
  // gulp.task('lintjs', ['buildjs'], function() {
  // 	return gulp.src([site.directory + '/js/*.js', '!' + site.directory + '/js/*.min.js'])
  // 	.pipe(jshint()).on('error', gutil.log)
  // 	.pipe(jshint.reporter('jshint-stylish'))
  // 	.pipe(jshint.reporter('fail')).on('error', function(err) {
  // 		var errormsg = site.name + ' failed js linting';
  // 		logit.log('buildjs', errormsg, 'fail');
  // 		this.emit('end');
  // 	})
  // 	.pipe(uglify()).on('error', gutil.log)
  // 	.pipe(rename({extname: '.min.js'}))
  // 	.pipe(gulp.dest(site.directory + '/js'))
  // 	.pipe(gzip())
  // 	.pipe(rename({extname: '.gz'}))
  // 	.pipe(gulp.dest(site.directory + '/js'))
  // 	.pipe(gcb(function() {
  // 		var msg = 'exported js files';
  // 		logit.log('buildjs', msg);
  // 		browserSync.reload();
  // 	}));
  // });
  //
  // if (watchers.all_seeing_eye) {
  // 	// stop the watch
  // 	watchers.all_seeing_eye.end();
  // }
  // // start the watch again
  // watchers.all_seeing_eye = gulp.watch(watchlist, ['lintjs']);
}



	/***************/
	// Browsersync //
	/***************/

// 	function startBrowserSync() {
// 		// promisified
// 		logit.log('initialization', 'beginning browersersyncification');
// 		return new Promise(function(resolve, reject) {
// 			try {
// 				browserSync({
// 					ui: false,							// start with ui?
// 					notify: false,						// show browser notifications?
// 					port: global.port,			// port number
// 					online: false,						// online features?
// 					open: false,						// open browser on start?
// 					logLevel: "silent",					// silencio!
// 					proxy: "localhost:" + (global.port + 1)
// 				}, function() {
// 					// callback function after browsersync loads
// 					var msg = 'http://localhost:' + global.port + '/';
// 					logit.log('server started', msg, 'green');
// 					return resolve(true);
// 				});
// 			}
// 			catch(err) {
// 				var msg = 'failed to start browsersync';
// 				logit.log('server fail', msg, 'fail');
// 				return reject(err);
// 			}
// 		});
// 	}


/*

// compilers

const sass = require('node-sass');
const css = require('clean-css');

// eslint
// http://eslint.org/docs/rules/
const ESLINT_CONFIG = __dirname + '/.eshintrc';
const CLIEngine = require('eslint').CLIEngine;
const eslint = new CLIEngine({ configFile: ESLINT_CONFIG });

const compilers = {
	css,
	sass,
	js: eslint
}

*/
