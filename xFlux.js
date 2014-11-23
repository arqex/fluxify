'use strict';

var XDispatcher = require( './src/xDispatcher' ),
	XStore = require( './src/xStore' )
;

var xFlux = function(){
	Object.defineProperty( this, 'dispatcher', {
		value: new XDispatcher()
	});

	if( typeof Promise != 'undefined' ){
		this.promisify( Promise );
	}
};

xFlux.prototype = {
	createStore: function( options ){
		return new XStore( options );
	},

	action: function( name, payload ){
		Object.defineProperty( payload, 'actionType', {
			value: name,
			writable: true,
			configurable: true
		});

		return this.dispatcher.dispatch( payload );
	},
	promisify: function( Promise ){
		this._Promise = Promise;
		this.dispatcher._Promise = Promise;
	}
};

module.exports = new xFlux();