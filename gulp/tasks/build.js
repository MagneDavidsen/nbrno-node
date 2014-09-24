var gulp = require('gulp');

gulp.task('heroku:production', ['browserify', 'copy', 'less']);
