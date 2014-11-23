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

module.exports = {
	_extend: _extend
}