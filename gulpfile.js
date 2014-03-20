var gulp = require('gulp');
var bower = require('gulp-bower');
var react = require('gulp-react');
var less = require('gulp-less');
var path = require('path');

gulp.task('bower', function() {
  bower()
    .pipe(gulp.dest('client/src/js/lib/'))
});

gulp.task('react', function () {
    gulp.src('client/src/**/*.jsx')
        .pipe(react())
        .pipe(gulp.dest('dist/'));
});

gulp.task('copy-client', function () {
    gulp.src(['client/src/**/index.html', 'client/src/**/*.js'])
        .pipe(gulp.dest('dist/'));
});

gulp.task('less', function () {
  gulp.src('client/src/**/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('default', function(){
  // place code for your default task here
});

gulp.task('heroku:production', function(){
	runSequence(
		'bower',
		['react', 'copy-client', 'less']
	);

});