var assert = require('assert'),
	Promise = require('es6-promise').Promise
;

var flux = require('../fluxify'),
	Dispatcher = require('../src/xDispatcher')
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


describe("Fluxify tests", function(){

	// Clean the dispatcher after the tests
	after( function(){
		for ( var id in flux.dispatcher._callbacks )
			flux.dispatcher.unregister( id );
	});

	it( "Should have the dispatcher as property", function(){

		assert.equal( flux.dispatcher instanceof Dispatcher, true );
	});

	it( "doAction should fail if there are no Promises", function(){

		var error = false;
		try {
			flux.doAction('whatever');
		}
		catch( e ) {
			error = e;
		}

		assert.equal( error instanceof TypeError, true );
	});

	it( "promisify should activate doAction", function(){
		var error = false;

		flux.promisify( Promise );


		console.log( 'Is dispatching: ' + flux.dispatcher.isDispatching() );

		try {
			flux.doAction('whatever');
		}
		catch( e ) {
			console.log( e.stack );
			error = e;
		}

		assert.equal( error, false );
	});

	it( "create a store without id", function(){
		store = flux.createStore( { initialState: state, actionCallbacks: actionCallbacks} );
		assert.deepEqual( store, state );
	});

	it( "No stores should be registered after creating a store without id", function(){
		assert.deepEqual( flux.stores , {});
	});

	it( "So no changes after call their actions", function(){
		return flux.doAction( "changeA" )
			.then( function(  ){
				assert.equal( store.a, 'a' );
			})
			.catch( function( err ) {
				throw( err );
			})
		;
	});

	it( "create a store with id", function(){
		store = flux.createStore( { id: 'testStore', initialState: state, actionCallbacks: actionCallbacks} );
		assert.deepEqual( store, state );
	});

	it( "The stores should be registered after creating a store with id", function(){
		assert.deepEqual( flux.stores , { testStore: store });
	});

	it( "Must change after call their actions", function(){
		return flux.doAction( "changeA" )
			.then( function(  ){
				assert.equal( store.a, 'A' );
			})
			.catch( function( err ) {
				throw( err );
			})
		;
	});


});