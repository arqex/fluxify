'use strict';

var XEmitter = require('./xEmitter');

var Store = XEmitter._extend({
	constructor: function( props ){
		this.props = props;
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
	constructor: function( options ){
		var me = this,
			opts = options || {},
			store = new Store( opts.initialState ),
			actionType, stateProp
		;

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
				value: (function( payload ){
					if( this._callbacks[ payload.actionType ] ){
						// The callbacks are already bound to this xStore
						return this._callbacks[ payload.actionType ].call( this, payload );
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
				value: value,
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

	waitFor: function( ids ) {
		// The xDispatcher adds itself as a property
		// when the xStore is registered
		this.dispatcher.waitFor( ids );
	}
});

module.exports = XStore;