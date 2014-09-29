var browserify   = require('browserify');
var gulp         = require('gulp');
var handleErrors = require('../util/handleErrors');
var source       = require('vinyl-source-stream');
var buffer 			 = require('vinyl-buffer');
var uglify 			 = require('gulp-uglify');


gulp.task('browserify', function(){
	return browserify({
			entries: ['./src/js/main.jsx'],
			extensions: ['.js']
		})
		.bundle({debug: false})
		.on('error', handleErrors)
		.pipe(source('bundle.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest('./dist/js'));
});
