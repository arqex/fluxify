'use strict';

// Object extend, Nod to underscore.js
var _extend = function( obj ){
	var source, prop;

	for (var i = 0; i < arguments.length; i++) {
		source = arguments[i];
		for( prop in source )
			obj[prop] = source[prop];
	}

	return obj;
};

var XEmitter = function(){
	Object.defineProperty( this, '_events', {
		value: {}
	});
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
			i
		;

		for (i = 0; i < listeners.length; i++) {
			listeners[i].apply( null, args );
		}

		return this;
	}
};

// EventEmitter methods
var proto = XEmitter.prototype;
_extend( proto, {
	addListener: proto.on,
	removeListener: proto.off,
	removeAllListeners: proto.off,
	emit: proto.trigger
});

// Extend method for 'inheritance', nod to backbone.js
Object.defineProperty( XEmitter, '_extend', {
	value: function( protoProps ){
		var child;

		if ( protoProps && protoProps.constructor ) {
			child = protoProps.constructor;
		} else {
			child = function(){ return this.apply(this, arguments); };
		}

		_extend( child, this );

		var Surrogate = function(){ this.constructor = child; };
		Surrogate.prototype = this.prototype;
		child.prototype = new Surrogate();

		if ( protoProps )
			_extend( child.prototype, protoProps );

		child.__super__ = this.prototype;

		return child;
	}
});

module.exports = XEmitter;