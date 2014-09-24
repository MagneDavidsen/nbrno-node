var gulp       = require('gulp');
var livereload = require('gulp-livereload');

gulp.task('watch', function() {
	var server = livereload();

	var reload = function(file) {
		server.changed(file.path);
	};

	gulp.watch('./src/js/**', ['browserify']);
	gulp.watch('./src/styles/**', ['less']);
	gulp.watch('./src/**', ['copy']);
	gulp.watch(['build/**']).on('change', reload);
});
