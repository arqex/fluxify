var gulp = require('gulp'),
	fs = require('fs'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	insert = require('gulp-insert')
;

var pack = require( './package.json' );

var core = function( fileContents ){
	//Transform the buffer to string
	return ( '' + fileContents).split('//#build')[1];
};


var wrap = function( src ) {
	var now = new Date(),
		wrapper = fs.readFileSync('./build/wrapper.txt', {encoding: 'utf8'})
	;

	return wrapper
		.replace( '%%name%%', pack.name)
		.replace( '%%version%%', pack.version)
		.replace( '%%author%%', pack.author)
		.replace( '%%license%%', pack.license)
		.replace( '%%homepage%%', pack.homepage)
		.replace( '%%date%%', now.getDate() + '-' + (now.getMonth() + 1) + '-' + now.getFullYear() )
		.replace( '%%contents%%', src );
};

var cr = '/*\n%%name%% v%%version%%\n%%homepage%%\n%%license%%: https://github.com/arqex/fluxify/raw/master/LICENSE\n*/\n'
	.replace( '%%name%%', pack.name)
	.replace( '%%version%%', pack.version)
	.replace( '%%license%%', pack.license)
	.replace( '%%homepage%%', pack.homepage)
;

gulp.task( 'build', function(){
	var src = core( fs.readFileSync('./src/xUtils.js') ) +
			core( fs.readFileSync('./src/xEmitter.js') )+
			core( fs.readFileSync('./src/xStore.js') )+
			core( fs.readFileSync('./src/xDispatcher.js') )+
			core( fs.readFileSync('./fluxify.js')),
		build = wrap( src )
	;

	fs.writeFileSync( './build/fluxify.js', build );

	gulp.src('./build/fluxify.js')
		.pipe( uglify() )
		.pipe( rename('fluxify.min.js'))
		.pipe( insert.prepend( cr ))
		.pipe( gulp.dest('./build') )
	;

});

gulp.task( 'default', ['build'] );