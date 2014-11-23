'use strict';

var xUtils = require( './xUtils' );

var XEmitter = function(){
	Object.defineProperty( this, '_events', {
		value: {}
	});

	if( typeof this.initialize == 'function' )
		this.initialize.apply( this, arguments );
};

XEmitter.prototype = {
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
var proto = XEmitter.prototype;
xUtils._extend( proto, {
	addListener: proto.on,
	removeListener: proto.off,
	removeAllListeners: proto.off,
	emit: proto.trigger
});

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

		var Surrogate = function(){ this.constructor = child; };
		Surrogate.prototype = parent.prototype;
		child.prototype = new Surrogate();

		if ( protoProps )
			xUtils._extend( child.prototype, protoProps );

		child.__super__ = parent.prototype;

		return child;
	}
});

module.exports = XEmitter;