// gulpfile.js
const gulp = require('gulp');
const clean = require('gulp-clean');
const { exec } = require('child_process');

// Clean build directory
gulp.task('clean', function () {
    return gulp.src(['build', 'dist', 'tools', 'web-ext-artifacts'], { read: false, allowEmpty: true }).pipe(clean());
});

// Run webpack
gulp.task('webpack', function (cb) {
    exec('yarn webpack', function (err, stdout, stderr) {
        console.log(stdout);
        console.error(stderr);
        cb(err);
    });
});

// Run web-ext build
gulp.task('webext-build', function (cb) {
    exec('yarn web-ext build', function (err, stdout, stderr) {
        console.log(stdout);
        console.error(stderr);
        cb(err);
    });
});

// Archive source
gulp.task('archive', function (cb) {
    exec('git archive -o dist/src.zip HEAD', function (err, stdout, stderr) {
        console.log(stdout);
        console.error(stderr);
        cb(err);
    });
});

// Build task: webpack and web-ext build in sequence
gulp.task('build', gulp.series('webpack', 'webext-build'));

// Dist task: build then archive
gulp.task('dist', gulp.series('build', 'archive'));

// Default task: clean then build
gulp.task('default', gulp.series('clean', 'build'));
