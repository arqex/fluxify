'use strict';

//#build

/**
 * The asynchronous dispatcher compatible with Facebook's flux dispatcher
 * http://facebook.github.io/flux/docs/dispatcher.html
 *
 * Dispatch actions to the registered callbacks, those action can be
 * asynchronous if they return a Promise.
 */
var XDispatcher = function(){
	this._callbacks = {};
	this._dispatchQueue = [];
	this._currentDispatch = false;
	this._ID =  1;

	if( typeof Promise != 'undefined' ){
		this._Promise = Promise;
	}
};

XDispatcher.prototype = {

	/**
	 * Register a callback that will be called when an action is dispatched.
	 *
	 * @param  {String | Function}   id  If a string is passed, it will be the id of the callback.
	 *                  If a function is passed, it will be used as callback, and id is generated
	 *                  automatically.
	 * @param  {Function} callback If an id is passed as a first argument, this will be the callback.
	 * @return {String}            The id of the callback to be used with the waitFor method.
	 */
	register: function( id, callback ){
		var ID = id;

		// If the callback is the first parameter
		if( typeof id == 'function' ){
			ID = 'ID_' + this._ID;
			callback = id;
		}

		this._callbacks[ID] = callback;
		this._ID++;

		return ID;
	},

	/**
	 * Register a XStore in the dispacher. XStores has a method called callback. The dispatcher
	 * register that function as a regular callback.
	 *
	 * @param  {String} id     The id for the store to be used in the waitFor method.
	 * @param  {XStore} xStore Store to register in the dispatcher
	 * @return {String}        The id of the callback to be used with the waitFor method.
	 */
	registerStore: function( id, xStore ){

		Object.defineProperty(xStore, '_dispatcher', {
			value: this
		});

		return this.register( id, xStore.callback );
	},

	/**
	 * Unregister a callback given its id.
	 *
	 * @param  {String} id Callback/Store id
	 * @return {undefined}
	 */
	unregister: function( id ) {
		delete this._callbacks[id];
	},

	/**
	 * Creates a promise and waits for the callbacks specified to complete before resolve it.
	 * If it is used by an actionCallback, the promise should be resolved to let other callbacks
	 * wait for it if needed.
	 *
	 * Be careful of not to wait by a callback that is waiting by the current callback, or the
	 * promises will never fulfill.
	 *
	 * @param  {String<Array>|String} ids The id or ids of the callbacks/stores to wait for.
	 * @return {Promise} A promise to be resolved when the specified callbacks are completed.
	 */
	waitFor: function( ids ) {
		var promises = [],
			i = 0
		;

		if( !Array.isArray( ids ) )
			ids = [ ids ];

		for(; i<ids.length; i++ ){
			if( this._promises[ ids[i] ] )
				promises.push( this._promises[ ids[i] ] );
		}

		if( !promises.length )
			return this._Promise.resolve();

		return this._Promise.all( promises );
	},

	/**
	 * Dispatches an action to all the registered callbacks/stores.
	 *
	 * If a second action is dispatched while there is a dispatch on, it will be
	 * enqueued an dispatched after the current one.
	 *
	 * @return { Promise } A promise to be resolved when all the callbacks have finised.
	 */
	dispatch: function() {
		var me = this,
			dispatchArguments = arguments,
			promise, dequeue
		;

		if( ! this._Promise )
			throw( new TypeError( 'No promises.' ));

		// If we are in the middle of a dispatch, enqueue the dispatch
		if( this._currentDispatch ) {

			// Dispatch after the current one
			promise = this._currentDispatch.then( function(){
				return me._dispatch.apply(me, dispatchArguments);
			});

			// Enqueue, set the chain as the current promise and return
			this._dispatchQueue.push( promise );
			return this._currentDispatch = promise;
		}

		return this._currentDispatch = this._dispatch.apply( me, dispatchArguments );
	},

	/**
	 * Dispatches an action inmediatelly.
	 *
	 * @return {Promise} A promise to be resolved when all the callbacks have finised.
	 */
	_dispatch: function(){
		var me = this,
			dispatchArguments = arguments,
			promises = []
		;

		this._promises = [];

		// A closure is needed for the callback id
		Object.keys( this._callbacks ).forEach( function( id ){

			// All the promises must be set in me._promises before trying to resolved
			// in order to make waitFor work ok
			me._promises[ id ] = me._Promise.resolve().then( function(){
				return me._callbacks[ id ].apply( me, dispatchArguments );
			});

			promises.push( me._promises[ id ] );
		});

		//
		var dequeue = function(){
			me._dispatchQueue.shift();
			if( !me._dispatchQueue.length )
				me._currentDispatch = false;
		};

		return this._Promise.all( promises )
			.then( dequeue, dequeue )
		;


		/* // Chain dispatch calls, not ready
		promise.dispatch = promise.doAction = (function( p ) {

			console.log( p );

			var dispatchArgs = [].slice.call( arguments, 1 ),
				dPromise = p.then(function(){
					return me.dispatch.apply( me, dispatchArgs );
				})
			;

			dPromise.dispatch = dPromise.doAction = p.dispatch;
			return dPromise;
		}).bind( promise );
		*/
	},

	/**
	 * Is this dispatcher currently dispatching.
	 *
	 * @return {Boolean}
	 */
	isDispatching: function() {
		return !!this._dispatchQueue.length;
	}

};

//#build

module.exports = XDispatcher;