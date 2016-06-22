'use strict';

const gulp = require('gulp');

const $ = require('gulp-load-plugins')();
const del = require('del');
const runSequence = require('run-sequence');

gulp.task('clean', () => {
  return del('target');
});

gulp.task('connect', () => {
  $.connect.server({
    livereload: true,
    root: __dirname,
    port: 9000
  });
});

gulp.task('scripts', () => {
  return gulp.src('src/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel({presets: ['es2015'], compact: false}))
    .pipe($.ngAnnotate())
    .pipe($.concat('angular-select2.js'))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist/'))
    .pipe($.connect.reload())
    .pipe($.size({title: 'scripts'}));
});

gulp.task('serve', ['connect'], () => {
  gulp.watch(['src/*.js'], ['scripts']);
});

gulp.task('protractor', () => {
  $.connect.server({
    root: __dirname,
    port: 9000
  });

  return gulp.src('test/e2e/**/*.js')
    .pipe($.angularProtractor({
      configFile: 'protractor.conf.js',
      debug: false,
      autoStartStopServer: true
    }))
    .on('error', (e) => {
      $.connect.serverClose();
      console.log(e);
    })
    .on('end', () =>
    {
      $.connect.serverClose();
    });
});

gulp.task('karma', (done) =>
{
  var Server = require('karma').Server;

  new Server({
    configFile: `${__dirname}/karma.conf.js`,
    singleRun: true,
    autoWatch: false
  }, done).start();
});

gulp.task('default', ['clean'], (done) =>
{
  runSequence('scripts', 'karma', 'protractor', done);
});
