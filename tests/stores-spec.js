var assert = require('assert'),
	Promise = require('es6-promise').Promise
;

var flux = require('../fluxify');

var state = {
		list: [],
		obj: {},
		a: 'a',
		b: 'b',
		c: 'c',
		count: 0
	},
	actionCallbacks = {
		changeA: function( store ) {
			store.set( 'a', 'A' );
		},
		restoreA: function( store ) {
			store.set( {a: state.a} );
		},
		count: function( store ) {
			return this.waitFor( 'secondStore' )
				.then( function(){
					store.set({count: secondStore.count});
				})
			;
		}
	},
	store
;

var secondState = {
		count: 0
	},
	secondCallbacks = {
		count: function( store ){
			store.set( 'count', this.count + 1);
		}
	},
	secondStore
;

describe("Store tests", function(){
	it( "Creating store without id", function(){
		store = flux.createStore({
			initialState: state,
			actionCallbacks: actionCallbacks
		});

		assert.deepEqual( store, state );
	});

	it( "Stores are immutable", function(){
		store.a = 'A';
		store.b = 'B';
		store.c = 'C';

		assert.deepEqual( store, state );
	});

	it( "#getState", function(){
		var storeState = store.getState();

		assert.deepEqual( storeState, state );

		storeState.a = 1;

		assert.equal( storeState.a, 1 );
	});

	it( "shouldn't update the state because the store is not registered", function(){
		return flux.doAction( 'changeA' )
			.then( function(){
				assert.equal( store.a, 'a' )
			})
		;
	});

	it( "register store", function(){
		flux.dispatcher.registerStore( 'store', store );
		return flux.doAction( 'changeA' )
			.then( function(){
				assert.equal( store.a, 'A' )
			})
		;
	});

	it( "test property events", function( done ){
		store.on( 'change:a', function( value ){
			assert.equal( store.a, value );

			// If #off doesn't work, mocha should throw the error
			// done() called multiple times
			store.off( 'change:a' );

			done();
		});

		flux.doAction( 'restoreA' );
	});

	it( "test any property events", function( done ){

		// If once does not work properly, mocha will throw
		// done() called multiple times
		store.once( 'change', function( updates ){
			try {
				assert.equal( updates.length, 1 );
				assert.equal( updates[0].prop, 'a' );
				assert.equal( updates[0].value, 'A' );
				assert.equal( updates[0].previousValue, 'a' );
			}
			catch ( err ){
				done( err );
			}
			done();
		});

		flux.doAction( 'changeA' );
	});

	it( "create a store with id", function(){
		secondStore = flux.createStore({
			id: 'secondStore',
			initialState: secondState,
			actionCallbacks: secondCallbacks
		});

		assert( flux.stores.secondStore, secondStore );
	});

	it( "#waitFor", function(){
		// Store should wait for the second store to update, and
		// then copy its count value
		return flux.doAction( 'count' )
			.then( function(){
				assert.equal( store.count, 1);
				assert.equal( secondStore.count, 1);
			})
		;
	});

	it( "Adding an actionCallback after registering", function(){
		store.addActionCallbacks({
			lastCallback: function( s ){
				s.set({
					added: true
				});
			}
		});

		return flux.doAction( 'lastCallback')
			.then(function(){
				assert( store.added );
			})
		;
	});


});