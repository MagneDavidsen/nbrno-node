var gulp = require('gulp');

gulp.task('copy', function () {
    gulp.src(['./src/**/*.html', './src/**/*.jpg', './src/**/*.png', './src/**/*.ico', './src/**/*.css', './src/**/*.js', './src/**/*.xml', './src/**/*.woff'])
        .pipe(gulp.dest('./dist/'));
});
