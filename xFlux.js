'use strict';

var XDispatcher = require( './src/xDispatcher' ),
	XStore = require( './src/xStore' )
;

var xFlux = function(){
	Object.defineProperty( this, 'dispatcher', {
		value: new XDispatcher()
	});

	this.stores = {};

	if( typeof Promise != 'undefined' ){
		this.promisify( Promise );
	}
};

xFlux.prototype = {
	createStore: function( options ){
		var store = new XStore( options );

		// If the store has an id, register it in xFlux and in the dispatcher
		if( store._id ){
			this.stores[ store._id ] = store;
			this.dispatcher.registerStore( store._id, store );
		}

		return store;
	},

	doAction: function() {
		return this.dispatcher.dispatch( arguments );
	},

	promisify: function( Promise ){
		this._Promise = Promise;
		this.dispatcher._Promise = Promise;
	}
};

module.exports = new xFlux();