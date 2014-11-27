'use strict';

var XDispatcher = require( './src/xDispatcher' ),
	XStore = require( './src/xStore' )
;

//#build

/**
 * Fluxify class that will be used as a singleton.
 * Initializes the dispatcher and the store.
 * Also set the Promise object if it is globally available.
 */
var Fluxify = function(){
	Object.defineProperty( this, 'dispatcher', {
		value: new XDispatcher()
	});

	this.stores = {};

	if( typeof Promise != 'undefined' ){
		this.promisify( Promise );
	}
};

Fluxify.prototype = {
	/**
	 * Create a new store. If an id is passed in the options,
	 * the store will be registered in the dispatcher and saved
	 * in fluxify.stores[id].
	 *
	 * @param  {Object} options {id, initialState, actionCallback}
	 * @return {XStore}
	 */
	createStore: function( options ){
		var store = new XStore( options );

		// If the store has an id, register it in Fluxify and in the dispatcher
		if( store._id ){
			this.stores[ store._id ] = store;
			this.dispatcher.registerStore( store._id, store );
		}

		return store;
	},

	/**
	 * Executes an action. The arguments of this function will be available
	 * for the action callbacks registered in the dispatcher.
	 * @return { Promise } A promise that is resolved when all the action callbacks
	 *                   have finished.
	 */
	doAction: function() {
		return this.dispatcher.dispatch.apply( this.dispatcher, arguments );
	},

	/**
	 * If ES6 Promise object is not defined globally or polyfilled, a Promise object
	 * can be given to fluxify in order to make it work, using this method.
	 *
	 * @param  { Promise } Promise ES6 Promise compatible object
	 * @return { undefined }
	 */
	promisify: function( Promise ){
		this._Promise = Promise;
		this.dispatcher._Promise = Promise;
	}
};

//#build

module.exports = new Fluxify();