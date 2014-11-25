var expect = require('unit.js'),
	Promise = require('es6-promise')
;

var flux = require('../fluxify'),
	Dispatcher = require('../src/xDispatcher')
;


describe("Fluxify tests", function(){
	it( "Should have the dispatcher as property", function(){
		expect.object( flux.dispatcher ).isInstanceOf( Dispatcher );
	});

	it( "doAction should fail if there are no Promises", function(){
		var error;
		try{
			flux.doAction('whatever');
		}
		catch ( e ) {
			error = e;
		}

		expect.exception( error ).isInstanceOf( TypeError );
	});

});