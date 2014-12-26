'use strict';

var xUtils = require( './xUtils' );

//#build

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

			if( listener.callback )
				listener.callback.apply( null, args );
			else {
				// If there is not a callback, remove!
				listener.once = true;
			}

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

//#build

module.exports = XEmitter;