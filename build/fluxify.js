/* fluxify 0.2.0 (27-11-2014)
 * https://github.com/arqex/fluxify
 * By Javi Marquez (http://arqex.com)
 * License: GNU-2
 */
(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.Foo = factory();
	}
}(this, function() {
	'use strict';
	

var xUtils = {
	// Object extend, Nod to underscore.js
	_extend: function( obj ){
		var source, prop;

		for (var i = 0; i < arguments.length; i++) {
			source = arguments[i];
			for( prop in source )
				obj[prop] = source[prop];
		}

		return obj;
	}
};



var XEmitter = function(){
	Object.defineProperty( this, '_events', {
		value: {}
	});

	if( typeof this.initialize == 'function' )
		this.initialize.apply( this, arguments );
};

// The prototype methods are stored in a different object
// and applied as non enumerable properties later
var emitterPrototype = {
	on: function( eventName, listener, once ){
		var listeners = this._events[ eventName ] || [];

		listeners.push({ callback: listener, once: once});
		this._events[ eventName ] =  listeners;

		return this;
	},

	once: function( eventName, listener ){
		this.on( eventName, listener, true );
	},

	off: function( eventName, listener ){
		if( typeof eventName == 'undefined' ){
			this._events = {};
		}
		else if( typeof listener == 'undefined' ) {
			this._events[ eventName ] = [];
		}
		else {
			var listeners = this._events[ eventName ] || [],
				i
			;

			for (i = listeners.length - 1; i >= 0; i--) {
				if( listeners[i] === listener )
					listeners.splice( i, 1 );
			}
		}

		return this;
	},

	trigger: function( eventName ){
		var args = [].slice.call( arguments, 1 ),
			listeners = this._events[ eventName ] || [],
			onceListeners = [],
			i, listener
		;

		// Call listeners
		for (i = 0; i < listeners.length; i++) {
			listener = listeners[i];
			listener.callback.apply( null, args );
			if( listener.once )
				onceListeners.push( i );
		}

		// Remove listeners marked as once
		for( i = onceListeners.length - 1; i >= 0; i-- ){
			listeners.splice( onceListeners[i], 1 );
		}

		return this;
	}
};

// EventEmitter methods
xUtils._extend( emitterPrototype, {
	addListener: emitterPrototype.on,
	removeListener: emitterPrototype.off,
	removeAllListeners: emitterPrototype.off,
	emit: emitterPrototype.trigger
});

// Methods are not enumerable so, when the stores are
// extended with the emitter, they can be iterated as
// hashmaps
XEmitter.prototype = {};
for (var method in emitterPrototype ) {
	Object.defineProperty(XEmitter.prototype, method, {
		value: emitterPrototype[ method ]
	});
}

// Extend method for 'inheritance', nod to backbone.js
Object.defineProperty( XEmitter, '_extend', {
	value: function( protoProps ){
		var parent = this,
			child
		;

		if ( protoProps && protoProps.hasOwnProperty( constructor ) ) {
			child = protoProps.constructor;
		} else {
			child = function(){ return parent.apply(this, arguments); };
		}

		xUtils._extend( child, parent );

		var Surrogate = function(){
			// Again the constructor is also defined as not enumerable
			Object.defineProperty( this, 'constructor', {
				value: child
			});
		};
		Surrogate.prototype = parent.prototype;
		child.prototype = new Surrogate();

		// All the extending methods need to be also
		// non enumerable properties
		if ( protoProps ) {
			for( var p in protoProps ){
				if( p != 'constructor' ) {
					Object.defineProperty( child.prototype, p, {
						value: protoProps[p]
					});
				}
			}
		}

		child.__super__ = parent.prototype;

		return child;
	}
});



var Store = XEmitter._extend({
	initialize: function( props ){
		if( ! props )
			return this.props = {};

		this.props = {};
		for( var p in props )
			this.props[ p ] = props[ p ];
	},

	get: function( prop ){
		return this.props[ prop ];
	},

	set: function( prop, value ){
		var props = prop,
			updates = [],
			previousValue, p
		;

		if( typeof value != 'undefined' ) {
			props = {};
			props[ prop ] = value;
		}

		for( p in props ){
			if( this.props[p] != props[p] ){
				previousValue = this.props[p];
				this.props[p] = props[p];
				updates.push({
					prop: p,
					previousValue: previousValue,
					value: props[p]
				});
			}
		}

		if( updates.length )
			this.emit('change', updates);
	}
});

var XStore = XEmitter._extend({
	initialize: function( options ){
		var me = this,
			opts = options || {},
			store = new Store( opts.initialState ),
			actionType, stateProp
		;

		// Store id
		if( options.id ) {
			Object.defineProperty( this, '_id', {
				value: options.id
			});
		}

		// Register action callbacks in the store
		Object.defineProperties( this, {
			_callbacks: {
				writable: true,
				configurable: true,
				value: {}
			},
			addActionCallbacks: {
				value: function( clbks ){
					for( actionType in clbks ){
						me._callbacks[ actionType ] = clbks[ actionType ].bind( this, store );
					}
				}
			},

			// Callback for register in the dispatcher
			callback: {
				value: (function(){
					var actionType = arguments[ 0 ],
						args = [].slice.call( arguments, 1 )
					;

					if( this._callbacks[ actionType ] ){
						// The callbacks are already bound to this xStore and the mutable store
						return this._callbacks[ actionType ].apply( this, args );
					}

					return true;
				}).bind( this )
			}
		});

		this.addActionCallbacks( opts.actionCallbacks || {} );

		// Create inmmutable properties
		var addProperty = function( propName, value ) {
			Object.defineProperty( me, propName, {
				enumerable: true,
				configurable: false,
				get: function(){
					return store.get( propName );
				}
			});
		};

		if( opts.initialState ){
			for (stateProp in opts.initialState ){
				addProperty( stateProp, opts.initialState[ stateProp ] );
			}
		}

		// Emit on store change
		store.on( 'change', function( updates ){
			var updatesLength = updates.length,
				update,	i
			;

			for(i=0; i < updatesLength; i++){
				update = updates[i];

				// If the property is new, add it to the xStore
				if( !me.hasOwnProperty( update.prop ) )
					addProperty( update.prop, update.value );

				me.emit('change:' + update.prop, update.value, update.previousValue );
			}

			me.emit( 'change', updates );
		});
	},

	getState: function() {
		var props = {};
		for( var prop in this )
			props[ prop ] = this[ prop ];

		// Clone the store properties
		return xUtils._extend({}, props);
	},

	waitFor: function( ids ) {
		// The xDispatcher adds itself as a property
		// when the xStore is registered
		return this._dispatcher.waitFor( ids );
	}
});



var XDispatcher = function(){
	this._callbacks = {};
	this._isDispatching = false;

	if( typeof Promise != 'undefined' ){
		this._Promise = Promise;
	}
};

XDispatcher.prototype = {
	register: function( id, callback ){
		var ID = id;

		// If the callback is the first parameter
		if( typeof id == 'function' ){
			ID = 'ID_' + ( Object.keys( this._callbacks ).length + 1 );
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

		if( !Array.isArray( ids ) )
			ids = [ ids ];

		for(; i<ids.length; i++ ){
			if( this._promises[ ids[i] ] )
				promises.push( this._promises[ ids[i] ] );
		}

		//console.log( this._promises );

		if( !promises.length )
			return this._Promise.resolve();

		return this._Promise.all( promises );
	},

	dispatch: function() {
		var me = this,
			promises = [],
			dispatchArguments = arguments,
			id, promise
		;

		if( ! this._Promise )
			throw( new TypeError( 'No promises.' ));

		if( this._isDispatching )
			throw( new Error( 'Cannot dispatch in the middle of a dispatch.' ));

		this._promises = [ this._isDispatching = true ];

		// A closure is needed for the callback id
		Object.keys( this._callbacks ).forEach( function( id ){

			// All the promises must be set in me._promises before trying to resolved
			// in order to make waitFor work ok
			me._promises[ id ] = me._Promise.resolve().then( function(){
				return me._callbacks[ id ].apply( me, dispatchArguments );
			});

			promises.push( me._promises[ id ] );
		});

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

		return promise;
	},

	isDispatching: function() {
		return this._isDispatching;
	}

};



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
	createStore: function( options ){
		var store = new XStore( options );

		// If the store has an id, register it in Fluxify and in the dispatcher
		if( store._id ){
			this.stores[ store._id ] = store;
			this.dispatcher.registerStore( store._id, store );
		}

		return store;
	},

	doAction: function() {
		return this.dispatcher.dispatch.apply( this.dispatcher, arguments );
	},

	promisify: function( Promise ){
		this._Promise = Promise;
		this.dispatcher._Promise = Promise;
	}
};


	return new Fluxify();
}));