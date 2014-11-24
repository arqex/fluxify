'use strict';

var XDispatcher = function(){
	this._callbacks = {};
	this._isDispatching = false;
	this._ID = 1;
};

XDispatcher.prototype = {
	register: function( id, callback ){
		var ID = id;

		// If the callback is the first parameter
		if( typeof id == 'function' ){
			ID = 'ID_' + (this._ID++);
			callback = id;
		}

		this._callbacks[ID] = callback;
		return ID;
	},

	registerStore: function( id, xStore ){
		this._callbacks[id] = xStore.callback;
		Object.defineProperty(xStore, '_dispatcher', {
			value: this
		});
	},

	unregister: function( id ) {
		delete this._callbacks[id];
	},

	waitFor: function( ids ) {
		var promises = [],
			i = 0
		;

		for(; i<ids.length; i++ ){
			if( this._promises[ ids[i] ] )
				promises.push( this._promises[ ids[i] ] );
		}

		if( !promises.length )
			return this._Promise.resolve();

		return this._Promise.all( promises );
	},

	dispatch: function() {
		var me = this,
			promises = [],
			id, promise
		;

		if( this._isDispatching )
			throw( 'Cannot dispatch in the middle of a dispatch.' );

		this._promises = {};

		for( id in this._callbacks ){
			this._promises[ id ] = this._callbacks[id].apply( this, arguments );
			promises.push( this._promises[ id ] );
		}

		var promise = this._Promise.all( promises )
			.then(
				function(){
					me._isDispatching = false;
				},
				function(){
					me._isDispatching = false;
				}
			)
		;

		promise.dispatch = promise.doAction = function() {
			this.then( me.dispatch.apply( me, arguments ) );
		};

		return promise;
	},

	isDispatching: function() {
		return this._isDispatching;
	}

};

module.exports = XDispatcher;