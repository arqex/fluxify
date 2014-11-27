var assert = require('assert'),
	Promise = require('es6-promise').polyfill()
;

var Dispatcher = require('../src/xDispatcher'),
	d = new Dispatcher()
;

var state = {
		list: [],
		obj: {},
		a: 'a',
		b: 'b',
		c: 'c'
	},
	actionCallbacks = {
		changeA: function( store ) {
			store.set( 'a', 'A' );
		}
	},
	store
;

var result = [],
	wait = false
;
var callbacks = [
	function( payload ){
		if( wait ){
			return d.waitFor( 'ID_2' )
				.then( function(){
					result.push( 3 );
				})
			;
		}
		if( payload.action != 'skip3' )
			result.push( 3 )
	},
	function( payload ){
		if( wait ){
			return d.waitFor( 'ID_1' )
				.then( function(){
					result.push( 2 );
				})
			;
		}
		if( payload.action != 'skip2' )
			result.push( 2 )
	},
	function( payload ){
		if( payload.action != 'skip1' )
			result.push( 1 )
	}
];

var unregisterAll = function(){
	for( var id in d._callbacks )
		d.unregister( id );
};


describe("Dispatcher tests", function(){
	it( "Registering callbacks without ids", function(){
		var ids = [];
		for( var i = 0; i<callbacks.length; i++ ){
			ids.push( d.register( callbacks[i] ) );
		}
		assert.deepEqual( ids, ['ID_1', 'ID_2', 'ID_3'] );
	});

	it( "Test dispatching", function(){
		result = [];
		return d.dispatch( { action: 'all' } )
			.then( function(){
				assert.deepEqual( result, [3, 2, 1] );
			})
			.catch( function( err ) {
				throw ( err );
			})
		;
	});

	it( "Test payload dispatching", function(){
		result = [];
		return d.dispatch( { action: 'skip2' } )
			.then( function(){
				assert.deepEqual( result, [3, 1] );
			})
			.catch( function( err ) {
				throw ( err );
			})
		;
	});

	it( "Registering callbacks with ids", function(){
		var ids = [],
			ohs = ['OH_1', 'OH_2', 'OH_3']
		;
		for( var i = 0; i<callbacks.length; i++ ){
			ids.push( d.register( ohs[i], callbacks[i] ) );
		}
		assert.deepEqual( ids, ohs );
	});

	it( "Test dispatching", function(){
		result = [];
		return d.dispatch( { action: 'all' } )
			.then( function(){
				assert.deepEqual( result, [3, 2, 1, 3, 2, 1] );
			})
			.catch( function( err ) {
				throw ( err );
			})
		;
	});

	it( "Test unregistering", function(){

		var ids = ['ID_1', 'ID_2', 'ID_3', 'OH_1', 'OH_2', 'OH_3'];
		for( var i = 0; i<ids.length; i++ ){
			d.unregister( ids[i] );
		}

		result = [];
		return d.dispatch( { action: 'all' } )
			.then( function(){
				assert.deepEqual( result, [] );
			})
			.catch( function( err ) {
				throw ( err );
			})
		;
	});

	it( "Test dispatching arguments", function(){
		result = [];
		var f = function(){
				for (var i = 0; i < arguments.length; i++) {
					result.push( arguments[i] );
				}
			},
			id = d.register(f)
		;

		return d.dispatch( 1, 2, 3, 4, 5 )
			.then( function(){
				assert.deepEqual( result, [1,2,3,4,5] );
			})
			.catch( function( err ) {
				throw ( err );
			})
		;
	});

	it( "Test waitFor", function(){
		wait = true;
		result = [];

		unregisterAll();
		d.register( 'ID_3', callbacks[0] );
		d.register( 'ID_2', callbacks[1] );
		d.register( 'ID_1', callbacks[2] );

		return d.dispatch( {action: 'whatever'} )
			.then( function(){
				assert.deepEqual( result, [1,2,3] );
			})
			.catch( function( err ) {
				throw ( err );
			})
		;
	});
	/* // Chain dispatch not ready
	it( "Test chained dispatches", function(){
		wait = false;
		result = [];

		return d
			.dispatch( {action: 'skip1'} )
			.dispatch( {action: 'skip2'} )
			.dispatch( {action: 'skip3'} )
			.then( function(){
				assert.deepEqual( result, [3,2,3,1,2,1] );
			})
			.catch( function( err ) {
				throw ( err );
			})
		;
	});
	*/
	it( "isDispatching should return true in the middle of a dispatch", function(){
		var f = function(){
			assert( d.isDispatching() );
		};

		unregisterAll();
		d.register( f );


		assert( !d.isDispatching() );
		return d.dispatch( "first" )
			.then( function(){
				assert( !d.isDispatching() );
			})
			.catch( function( err ) {
				throw( err );
			})
		;
	});

	it( "Cannot dispatch in the middle of a dispatch", function( done ){
		var f = function(){
			d.dispatch("Second");
		};

		unregisterAll();
		d.register( f );

		d.dispatch( "first" )
			.then( function(){
				done();
			})
			.catch( function( err ) {
				try {
					assert.equal( err.message, 'Cannot dispatch in the middle of a dispatch.' );
				}
				catch ( e ) {
					console.log( e );
				}
				done();
			})
		;
	});


});