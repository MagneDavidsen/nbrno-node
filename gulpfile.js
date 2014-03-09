var gulp = require('gulp');
var bower = require('gulp-bower');
var react = require('gulp-react');

gulp.task('bower', function() {
  bower()
    .pipe(gulp.dest('public/js/lib/'))
});



gulp.task('react', function () {
    gulp.src('public/js/main.jsx')
        .pipe(react())
        .pipe(gulp.dest('public/js'));
});

gulp.task('default', function(){
  // place code for your default task here
});