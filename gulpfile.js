// springboard build manager
// manage the task of building with a taskmaster!
// using gulp browsersync and browserify

var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// gulp plugins
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

// js tasks
gulp.task('lint', function() {
  return gulp.src('public/js/*.js')
    .pipe(jshint()).on('error', gutil.log)
    .pipe(jshint.reporter('default'))
});

// sass
gulp.task('sass', function() {
  return gulp.src('build/sass/*.scss')
    .pipe(sass()).on('error', gutil.log)
    .pipe(gulp.dest('public/css'))
    .pipe(reload({stream: true})).on('error', gutil.log);
});

// all seeing eye
gulp.task('watch', function() {
  gulp.watch(['public/js/*.js', 'build/js/*.js'], ['lint', reload]);
  gulp.watch('build/scss/*.scss', ['sass']);
  gulp.watch('public/views/*.jade').on('change', reload);
});

// start browsersync
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

gulp.task('default', ['browsersync', 'watch']);
