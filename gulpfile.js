'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var karma = require('karma').server;
var argv = require('yargs').argv;

gulp.task('default', ['test']);

gulp.task('lint', function() {
  return gulp.src(['src/**/*.js', 'test/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(jscs());
});

gulp.task('test', ['lint'], function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    client: {
      args: ['--grep', argv.grep]
    }
  }, done);
});

gulp.task('watch', function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    client: {
      args: ['--grep', argv.grep]
    },
    autoWatch: true,
    singleRun: false
  }, done);
});
