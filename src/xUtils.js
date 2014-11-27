'use strict';

//#build

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

//#build

module.exports = xUtils;