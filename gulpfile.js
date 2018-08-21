const del = require('del');
const gulp = require('gulp');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const zip = require('gulp-zip');
const pages = require('gh-pages');
const sync = require('browser-sync').create();

const path = {
	src: './src',
	build: './build/presentations'
};


gulp.task('build', () => {

	const shower = gulp.src([
			path.src + '/**',
			'!docs{,/**}',
			'!node_modules{,/**}',
			'!prepared{,/**}',
			'!CONTRIBUTING.md',
			'!LICENSE.md',
			'!README.md',
			'!gulpfile.js',
			'!package.json',
			'!package-lock.json'
		])
		.pipe(replace(
			/(<link rel="stylesheet" href=")(node_modules\/shower-)([^\/]*)\/(.*\.css">)/g,
			'$1../../presentation_engine/themes/$3/$4', { skipBinary: true }
		))
		.pipe(replace(
			/(<script src=")(node_modules\/shower-core\/)(shower.min.js"><\/script>)/g,
			'$1../../presentation_engine/$3', { skipBinary: true }
		));

	const core = gulp.src([
			'shower.min.js'
		], {
			cwd: 'node_modules/shower-core'
		})
		.pipe(rename( (path) => {
			path.dirname = '../presentation_engine/' + path.dirname;
		}));

	const material = gulp.src([
			'**', '!package.json'
		], {
			cwd: 'node_modules/shower-material'
		})
		.pipe(rename( (path) => {
			path.dirname = '../presentation_engine/themes/material/' + path.dirname;
		}))

	const ribbon = gulp.src([
			'**', '!package.json'
		], {
			cwd: 'node_modules/shower-ribbon'
		})
		.pipe(rename( (path) => {
			path.dirname = '../presentation_engine/themes/ribbon/' + path.dirname;
		}));

	const themes = merge(material, ribbon)
		.pipe(replace(
			/(<script src=")(\/shower-core\/)(shower.min.js"><\/script>)/,
			'$1../../$3', { skipBinary: true }
		));

	return merge(shower, core, themes)
		.pipe(gulp.dest(path.build));

});

gulp.task('clean', () => {
	return del(path.build + '/**');
});

gulp.task('zip', () => {
	return gulp.src(path.build + '/**')
		.pipe(zip('archive.zip'))
		.pipe(gulp.dest('.'));
});

gulp.task('upload', () => {
	return pages.publish('build')
});

gulp.task('archive', gulp.series(
	'build',
	'zip',
	'clean'
));

gulp.task('publish', gulp.series(
	'build',
	'upload',
	'clean'
));

gulp.task('serve', () => {
	sync.init({
		ui: false,
		notify: false,
		port: 3000,
		server: {
			baseDir: '.'
		}
	});
	gulp.watch(path.src + 'index.html').on('change', () => {
    	sync.reload();
	});
});
