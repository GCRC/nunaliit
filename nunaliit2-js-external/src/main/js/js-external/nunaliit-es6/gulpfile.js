var gulp = require('gulp');
var concat = require("gulp-concat");
var babel = require("gulp-babel");
/* Prevent error for reload */
 function swallowError (error) {
  // Show error in the console
  console.log(error.toString())
  this.emit('end')
}



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
    // If Supporting old IE browser is a problem, uncomment this line to
    //	 include the polyfill.js
	    
    //   'node_modules/babel-polyfill/dist/polyfill.js',
	'./src/**/*.js','!src/n2es6/n2core/*.js'])
    // If someone want to use more advance feature in ES6 (lambda or ...),
    // try uncomment this line to transpile the code using babel
    //.pipe(babel({presets: ['es2015']}))
	.on('error', swallowError)
	.pipe(gulp.dest('dist'))
	.on('end', function(){ console.log('\x1b[32m','\n>>> Babel Terminated...','\x1b[0m')});
});


/* Watch for modification to recreate the dist */
gulp.task('watch', function() {
  gulp.watch(['./src/*/*.js'], ['default']);
});


// The default task that will be run if no task is supplied
gulp.task("default", ["babel"]);
