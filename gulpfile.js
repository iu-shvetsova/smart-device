var gulp         = require('gulp'),
    njkRender    = require('gulp-nunjucks-render'), // Render Nunjucks templates
    data         = require('gulp-data'), // Gulp-data proposes a common API for attaching data to the file object for other plugins to consume
    mergeJSON = require('gulp-merge-json'), //  Plugin for deep-merging multiple JSON files into one file. Export as JSON or a node module
    less         = require('gulp-less'), // Dynamic preprocessor style sheet language
    
    autoprefixer = require("gulp-autoprefixer"), // Plugin to parse CSS and add vendor prefixes to CSS rules using values from https://caniuse.com/.
    prettify     = require('gulp-html-prettify'), // Prettify HTML
    inlinesource = require('gulp-inline-source'), // Inline all <script>, <link> and <img> tags that contain the "inline" attribute with inline-source.
    group_media  = require("gulp-group-css-media-queries"), // Combine matching media queries into one media query definition. Useful for CSS generated by preprocessors using nested media queries.
    sourcemaps   = require('gulp-sourcemaps'), // Write source maps
    g_concat     = require('gulp-concat'), // Concatenates files
    htmlmin      = require('gulp-htmlmin'), // Gulp plugin to minify HTML
    uglify       = require('gulp-uglify'), // Minify JavaScript with UglifyJS2
    cleanCSS     = require('gulp-clean-css'), // Plugin to minify CSS, using clean-css
    imagemin     = require('gulp-imagemin'), // Minify PNG, JPEG, GIF and SVG images with imagemin
    pngquant     = require('imagemin-pngquant'), // Pngquant imagemin plugin
    //styleInject  = require("gulp-style-inject"), //style-inject plugin for gulp. Style included into <style> by the directive for example  <!-- inject-style src="./path/file.css" -->
    
    connect      = require("gulp-connect"), // Gulp plugin to run a webserver (with LiveReload)
    opn          = require('opn'); // Open a file or url in the user's preferred application.
    plumber      = require('gulp-plumber'), // Prevent pipe breaking caused by errors from gulp plugins
    notify       = require("gulp-notify"), // Send messages to Mac, Linux or Windows Notification Center
    del          = require('del'), // Delete files and folders
    rigger       = require('gulp-rigger'), // Rigger is a build time include engine for Javascript, CSS, CoffeeScript and in general any type of text file that you wish to might want to "include" other files into. Use directive "//= path/to/file"
    spritesmith  = require('gulp.spritesmith'); // Convert a set of images into a spritesheet and CSS variable
var gulpsync     = require('gulp-sync')(gulp);// Sync for dependency tasks of gulp.task method

var server = { host: 'localhost', port: '9000' };

var dir = { src: 'src/', prod: 'production/', build: 'build/'}

var path = { 
  prod: {
      html: dir.prod,
      js: dir.prod + 'js/',
      css: dir.prod + 'css/',
      img: dir.prod + 'images/',
      fonts: dir.prod + 'fonts/',
      icons: dir.src + 'images/',
      favicon: dir.prod
  },
  build: {
      html: dir.build,
      js: dir.build + 'js/',
      css: dir.build + 'css/',
      cssInit: './cached/',
      img: dir.build + 'images/',
      fonts: dir.build + 'fonts/',
      icons: dir.src + 'images/',
      favicon: dir.build,
      htmlFiles: dir.build + '**/*.html'
  },
  src: {
      html: dir.src + '*.html',
      js: dir.src + 'js/main.js',
      css: dir.src + 'less/main.less',
      cssInit: dir.src + 'less-init/main.less',
      img: dir.src + 'images/**/*',
      fonts: dir.src + 'fonts/*.*',
      icons: dir.src + 'images/icons/*.png',
      retinaIcons: dir.src + 'images/icons/*@2x.png',
      favicon: dir.src + '*.ico',
      svg: dir.src + 'svg/*.svg',
      templates: dir.src,
      data: './cached/data.json'
  },
  watch: {
      html: dir.src + '**/*.html',
      js: dir.src + 'js/**/*.js',
      css: dir.src + 'less/**/*.less',
      cssInit: dir.src + 'less-init/**/*.less',
      img: dir.src + 'images/**/*',
      fonts: dir.src + 'fonts/*.*',
      icons: dir.src + 'images/icons/*',
      svg: dir.src + 'svg/*.svg',
      data: dir.src + 'data/**/*.json'
  }
};



gulp.task('default', gulpsync.sync([
  'clean_build',
  'styleInit:build',
  'sprite:build',
  [
    'html:build',
    'js:build',
    'style:build',
    'fonts:build',
    'images:build',
    'favicon:build'
  ],
  'run_webserver',
  'open_browser',
  'watch'
]));

gulp.task('open', ['default']);

gulp.task('build', gulpsync.sync([
  'clean_build',
  'styleInit:build',
  'sprite:build',
  [
    'html:build',
    'js:build',
    'style:build',
    'fonts:build',
    'images:build',
    'favicon:build'
  ]
]));

gulp.task('build:prod', gulpsync.sync([
  'clean_prod',
  'styleInit:prod',
  'sprite:build',
  'merge_json',
  [
    'html:prod',
    'js:prod',
    'style:prod',
    'fonts:prod',
    'images:prod',
    'favicon:prod'
  ]
]));

gulp.task('prod', ['build:prod']);

gulp.task('watch', function(){
    gulp.watch([path.watch.html, path.watch.data, './default-data.json'], function(event, cb) {
        gulp.start('html:build');
    });
    gulp.watch([path.watch.css], function(event, cb) {
        gulp.start('style:build');
    });
    gulp.watch([path.watch.cssInit], function(event, cb) {
        gulp.start('styleInit:watch');
    });    
    gulp.watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
    gulp.watch([path.watch.img], function(event, cb) {
        gulp.start('images:build');
    });
    gulp.watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:build');
    });
    gulp.watch([path.watch.icons], function(event, cb) {
        gulp.start('sprite:build');
    });
    gulp.watch([path.watch.svg], function(event, cb) {
        gulp.start('svg:build');
    });
});



// **************************************
// *
// *           Build Tasks
// *
// **************************************

gulp.task('html:build', gulpsync.sync([
  'merge_json',
  'delete_html',
  'prepair_html',
  'update_html'
]));

gulp.task('style:build', function () {
    gulp.src(path.src.css)
        .pipe(plumber({errorHandler: notify.onError("Style build error: <%= error.message %>")}))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(g_concat('style.css'))
        .pipe(group_media())
        .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css))
        .pipe(connect.reload());
});

gulp.task('styleInit:build', function () {
    gulp.src(path.src.cssInit)
        .pipe(plumber({errorHandler: notify.onError("Style initial build error: <%= error.message %>")}))
        .pipe(less())
        .pipe(g_concat('init.css'))
        .pipe(group_media())
        .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest(path.build.cssInit))
});

gulp.task('js:build', function () {
    gulp.src(path.src.js)
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.js))
        .pipe(connect.reload());
});

gulp.task('images:build', function () {
    gulp.src(path.src.img)
        .pipe(gulp.dest(path.build.img))
        .pipe(connect.reload());
});

gulp.task('svg:build', function () {
    gulp.src(path.src.svg)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.img));
});

gulp.task('fonts:build', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
        .pipe(connect.reload());
});

gulp.task('favicon:build', function() {
    return gulp.src(path.src.favicon)
        .pipe(gulp.dest(path.build.favicon));
});



// **************************************
// *
// *           Production Tasks
// *
// **************************************

gulp.task('html:prod', function (cb) {
  return gulp.src(path.src.html)
    .pipe(plumber({errorHandler: notify.onError("HTML build error: <%= error.message %>")}))
    .pipe(data(function() {
            return requireUncached(path.src.data);
          }))
    .pipe(njkRender({
      path: path.src.templates
    }))
    .pipe(rigger())
    .pipe(inlinesource( {compress: true} ))
    .pipe(htmlmin({collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(path.prod.html));
});

gulp.task('js:prod', function () {
  gulp.src(path.src.js)
      .pipe(plumber({errorHandler: notify.onError("JS build error: <%= error.message %>")}))
      .pipe(rigger())
      .pipe(uglify())
      .pipe(gulp.dest(path.prod.js));
});

gulp.task('style:prod', function () {
    gulp.src(path.src.css)
        .pipe(plumber({errorHandler: notify.onError("Style build error: <%= error.message %>")}))
        .pipe(less())
        .pipe(g_concat('style.css'))
        .pipe(group_media())
        .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(cleanCSS({ compatibility: 'ie8', level: { 1: { specialComments: 'no' } } }))
        .pipe(gulp.dest(path.prod.css));
});

gulp.task('styleInit:prod', function () {
    gulp.src(path.src.cssInit)
        .pipe(plumber({errorHandler: notify.onError("Style initial build error: <%= error.message %>")}))
        .pipe(less())
        .pipe(g_concat('init.css'))
        .pipe(group_media())
        .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(cleanCSS({ compatibility: 'ie8', level: { 1: { specialComments: 'no' } } }))
        .pipe(gulp.dest(path.build.cssInit));
});

gulp.task('fonts:prod', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.prod.fonts))
});

gulp.task('images:prod', function () {
    gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true,
            optimizationLevel: 3
        }))
        .pipe(gulp.dest(path.prod.img));
});

gulp.task('favicon:prod', function() {
    return gulp.src(path.src.favicon)
        .pipe(gulp.dest(path.prod.favicon));
});



// **************************************
// *
// *           Service Tasks
// *
// **************************************

gulp.task('open_browser', function() {
  opn( 'http://' + server.host + ':' + server.port + '/');
});

gulp.task('run_webserver', function() {
    connect.server({
        host: server.host,
        port: server.port,
        root: path.build.html,
        livereload: true
    });
});

gulp.task('delete_html', function() {
  return del.sync(path.build.htmlFiles);
});

gulp.task('merge_json', function() {
  return gulp.src(['./default-data.json', path.watch.data])
        .pipe(mergeJSON({ fileName: 'data.json' }))
        .pipe(gulp.dest('cached/'));
});

gulp.task('prepair_html', function() {
  return gulp.src(path.src.html)
        .pipe(plumber({errorHandler: notify.onError("HTML build error: <%= error.message %>")}))
        .pipe(data(function() {
                return requireUncached(path.src.data);
              }))
        .pipe(njkRender({
          path: path.src.templates
        }))
        .pipe(prettify({
          indent_size : 2 
        }))
        .pipe(rigger())
        .pipe(inlinesource( {compress: false} ))
        .pipe(gulp.dest(path.build.html));
});

gulp.task('update_html', function() {
  gulp.src('./src/**/*.*')
  .pipe(connect.reload());
});

gulp.task('sprite:build', function () {
    var spriteData = gulp.src(path.src.icons).pipe(spritesmith({
        imgName: 'sprite.png',
        imgPath: '../images/sprite.png',
        cssName: '../less/sprite.less',
        padding: 5,
        retinaImgName: '../images/sprite@2x.png',
        retinaSrcFilter: path.src.retinaIcons
    }));
    return spriteData.pipe(gulp.dest(path.build.icons));
});

gulp.task('styleInit:watch', gulpsync.sync(['styleInit:build', 'html:build']));

gulp.task('clean_prod', function() {
    return del.sync(path.prod.html);
});

gulp.task('clean_build', function() {
    return del.sync(path.build.html);
});

// By default node.js require function caching data. This de-caching function for Data files
function requireUncached( $module ) {
    delete require.cache[require.resolve( $module )];
    return require( $module );
}