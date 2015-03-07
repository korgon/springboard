// springboard build manager
// manage the task of building with a taskmaster!
// using gulp browsersync and browserify

var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// gulp plugins
var concat = require('gulp-concat');
var gzip = require('gulp-gzip');
var jshint = require('gulp-jshint');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

// error handler for browserify
function browserifyHandler(err){
  gutil.log(gutil.colors.red('Error'), err.message);
  this.emit('end');
}



// all seeing eye
// watch for js css and jade changes
gulp.task('watch', function() {
  gulp.watch('build/js/*.js', ['bundlejs', reload]);
  gulp.watch('build/scss/*.scss', ['sass']);
  gulp.watch('views/**/*.jade').on('change', reload);
});


// taskmaster tasks below
// ---------------------------------------------

// js linting task
// gulp.task('lintjs', function() {
//   return gulp.src('build/js/*.js')
//     .pipe(jshint.reporter('jshint-stylish'))
//     .pipe(jshint.reporter('fail'))
//     .pipe(gulp.dest('public/js'))
//     .pipe(uglify()).on('error', gutil.log)
//     .pipe(rename({extname: '.min.js'}))
//     .pipe(gulp.dest('public/js'))
//     .pipe(gzip())
//     .pipe(rename({extname: '.gzip'}))
//     .pipe(gulp.dest('public/js'));
// });

// js bundler task (using browserifiy)
gulp.task('bundlejs', function() {
  var sbc = browserify();
  sbc.add('./build/js/sbc.js');

  return sbc.bundle().on('error', browserifyHandler)
    .pipe(source('sbc-v1.0.0.js'))
    .pipe(gulp.dest('public/js'));
    // .pipe(uglify()).on('error', gutil.log)
    // .pipe(rename({extname: '.min.js'}))
    // .pipe(gulp.dest('public/js'))
    // .pipe(gzip())
    // .pipe(rename({extname: '.gzip'}))
    // .pipe(gulp.dest('public/js'));
});

// sass task
gulp.task('sass', function() {
  return gulp.src('build/scss/*.scss')
    .pipe(plumber())
    .pipe(sass({errLogToConsole: true}))
    .pipe(gulp.dest('public/css'))
    .pipe(reload({stream: true}))
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
gulp.task('default', ['browsersync', 'watch']);
