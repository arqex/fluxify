'use strict';

var XEmitter = require('./xEmitter'),
	xUtils = require('./xUtils')
;

var Store = XEmitter._extend({
	initialize: function( props ){
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
		// Clone the store properties
		return xUtils._extend({}, this);
	},

	waitFor: function( ids ) {
		// The xDispatcher adds itself as a property
		// when the xStore is registered
		return this.dispatcher.waitFor( ids );
	}
});

module.exports = XStore;