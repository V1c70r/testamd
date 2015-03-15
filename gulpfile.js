'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var karma = require('gulp-karma');

gulp.task('default', ['test']);

gulp.task('lint', function() {
  return gulp.src(['src/**/*.js', 'test/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(jscs());
});

gulp.task('test', ['lint'], function() {
  return gulp.src([])
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('error', function(error) {
      throw error;
    });
});

gulp.task('watch', function() {
  return gulp.src([])
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }));
});
