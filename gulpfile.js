// springboard build manager
// manage the task of building with a taskmaster!
// using gulp browsersync and browserify

var gulp = require('gulp');
var colors = require('colors');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// gulp plugins
var gzip = require('gulp-gzip');
var jshint = require('gulp-jshint');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

// error handler for browserify
function browserifyHandler(err){
  gutil.log(gutil.colors.red('Error'), err.message);
  this.emit('end');
}



// all seeing eye
// watch for js, scss, css and jade changes
gulp.task('watch', function() {
  gulp.watch('build/js/*.js', ['lint', 'bundlejs', reload]);
  gulp.watch('build/scss/*.scss', ['sass']);
  gulp.watch('public/css/*.css', ['css']);
  gulp.watch('views/**/*.jade').on('change', reload);
});

// js bundler task (using browserifiy)
gulp.task('bundlejs', function() {
  var sbc = browserify();
  sbc.add('./build/js/sbc.js');

  return sbc.bundle().on('error', browserifyHandler)
    .pipe(source('sbc-v1.0.0.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
    .pipe(uglify()).on('error', gutil.log)
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest('public/js'));
    // .pipe(gzip())
    // .pipe(rename({extname: '.gzip'}))
    // .pipe(gulp.dest('public/js'));
});

gulp.task('lint', function() {
  return gulp.src('./build/js/sbc.js')
  .pipe(jshint()).on('error', gutil.log)
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail')).on('error', function(err) {

    this.emit('end');
  });
});

// sass task
gulp.task('sass', function() {
  return gulp.src('build/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
        errLogToConsole: true,
        sourceComments: 'map',
        sourceMap: 'scss'
      }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('public/css'))
});

// css task for injection
gulp.task('css', function() {
  return gulp.src('public/css/*.css')
  .pipe(reload({stream: true})).on('error', gutil.log);
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


function logit(alert, message, type) {
  alert = ' ' + alert + ' ';
  var boxtopper = '╭' + '─'.repeat(alert.length) + '╮';
  var boxbottom = '╰' + '─'.repeat(alert.length) + '╯';
  switch (type) {
    case 'blue':
      console.log(boxtopper.blue);
      console.log('│'.blue + alert.bold.blue + '│'.blue + ' ' + message.blue);
      console.log(boxbottom.blue);
      break;
    case 'pass':
    case 'green':
      console.log(boxtopper.green);
      console.log('│'.green + alert.bold.green + '│'.green + ' ' + message.green);
      console.log(boxbottom.green);
      break;
    case 'fail':
    case 'red':
      console.log(boxtopper.red);
      console.log('│'.red + alert.bold.red + '│'.red + ' ' + message.red);
      console.log(boxbottom.red);
      break;
    case 'warn':
    case 'yellow':
      console.log(boxtopper.yellow);
      console.log('│'.yellow + alert.bold.yellow + '│'.yellow + ' ' + message.yellow);
      console.log(boxbottom.yellow);
      break;
    case 'white':
    default:
      console.log(boxtopper.white);
      console.log('│'.white + alert.bold.white + '│'.white + ' ' + message.white);
      console.log(boxbottom.white);
  }
  console.log();
}
