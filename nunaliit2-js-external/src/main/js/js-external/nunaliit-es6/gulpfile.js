
var gutil = require('gulp-util');
var gulp = require('gulp');
var babel = require('gulp-babel');

var concat = require("gulp-concat");

/* Prevent error for reload */
function swallowError (error) {
  // Show error in the console
  console.log(error.toString())
  this.emit('end')
}

var name = "n2es6";

gulp.task('cp-nunaliit-core', function() {
  return gulp.src(
    [
      './src/n2es6/n2core/*.js'
    ]
  ).pipe(concat("nunaliit2.js"))
  .on('error', swallowError)
  .pipe(gulp.dest("./dist/n2es6/n2core"))
});

gulp.task('babel', ['cp-nunaliit-core'], function() {
    return gulp.src(
	[
//	'node_modules/babel-polyfill/dist/polyfill.js',
	'./src/**/*.js','!src/n2es6/n2core/*.js']
)
	.pipe(babel({presets: ['es2015']}))
  .on('error', swallowError)
//        .pipe(concat(name+".js"))
	.pipe(gulp.dest('dist'))
  .on('end', function(){ console.log('\x1b[32m','\n>>> Babel Terminated...','\x1b[0m')});
});

gulp.task('babel-index', function() {
    return gulp.src(
	[
//	'node_modules/babel-polyfill/dist/polyfill.js',
	'./dist/index.js' ]
)
	.pipe(babel({presets: ['es2015']}))
        .on('error', swallowError)
//        .pipe(concat(name+".js"))
	.pipe(gulp.dest('dist'))
        .on('end', function(){ console.log('\x1b[32m','\n>>> Babel Terminated...','\x1b[0m')});
});

/* Watch for modification to recreate the dist */
gulp.task('watch', function() {
  gulp.watch(['./src/*/*.js'], ['default']);
});


// The default task that will be run if no task is supplied
gulp.task("default", ["babel"]);
