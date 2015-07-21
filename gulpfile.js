// springboard build manager
// manage the task of building with a taskmaster!
// using gulp browsersync and browserify

var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// gulp plugins
var gzip = require('gulp-gzip');
var jshint = require('gulp-jshint');
var minify = require('gulp-minify-css');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

// error handler for browserify
function browserifyHandler(err){
  gutil.log(gutil.colors.red('Error'), err.message);
  this.emit('end');
}

// all seeing eye
// tasked to watch
// watch for js, scss, css and jade changes
gulp.task('watch', function() {
  //gulp.watch('build/js/*.js', ['lint', 'bundlejs', reload]);
  gulp.watch('build/scss/*.scss', ['sass']);
  gulp.watch('public/css/*.css', ['css']);
  gulp.watch('public/**/*.html').on('change', reload);
});

gulp.task('watchAngular', function() {
  gulp.watch('build/js/angular/**/*.js', ['lintAngular', 'bundleAngular', reload]);
});

// js bundler task (using browserifiy)
gulp.task('bundleAngular', function() {
  var ng = browserify();
  ng.add('./build/js/angular/main.js');

  return ng.bundle().on('error', browserifyHandler)
    .pipe(source('sba-v1.0.0.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
    .pipe(uglify()).on('error', gutil.log)
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest('public/js'));
    // .pipe(gzip())
    // .pipe(rename({extname: '.gzip'}))
    // .pipe(gulp.dest('public/js'));
});

gulp.task('lintAngular', function() {
  return gulp.src('./build/js/angular/src/app.js')
  .pipe(jshint()).on('error', gutil.log)
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail')).on('error', function(err) {
    console.log(err);
    this.emit('end');
  });
});

// sass task
gulp.task('sass', function() {
  return gulp.src('build/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      sourceComments: 'map',
      sourceMap: 'scss'
    }))
    .on('error', function(err) {
			console.log(err);
			console.log(err.message.red);
			this.emit('end');
			return;
		})
    .pipe(reload({stream: true})).on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('public/css'))
});

// css task for injection
gulp.task('css', function() {
  return gulp.src(['public/css/*.css', '!public/css/*.min.css'])
  .pipe(rename({extname: '.min.css'}))
  .pipe(minify())
  .pipe(gulp.dest('public/css'));
});

// start browsersync to trigger reload and inject css
gulp.task('browsersync', function() {
  try {
    browserSync({
      baseDir: "./",
      ui: false,                  // start with ui?
      notify: false,						  // show browser notifications
      port: 3333,             		// port number
      online: false,						  // online features
      open: false,						    // open browser on start
    });
  }
  catch(err) {
    return reject(err);
  }
});


// the default gulp task!
gulp.task('default', ['browsersync', 'watch', 'watchAngular']);
