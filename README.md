Fluxify
=====

Yet another thing that ends with "ify": **The simplest Flux implementation**.

It is simple because:

* It has no dependencies.
* It is compatible with [facebook's flux dispatcher](http://facebook.github.io/flux/docs/dispatcher.html).
* It can be required as a page script, AMD or CommonJS module.
* It handles asynchronous actions using promises.
* It has eventful stores out of the box.
* It has pseudo-immutable stores, so they only can be modified by actions.
* It is lightweight: <5KB minified (much less if gzipped).

Here it an example:

```js
//Let's suposse browserify
var flux = require('fluxify');

// Create a store
var helloStore = flux.createStore({
	id: 'helloStore',
	initialState: {
		name: 'Alice'
	},
	actionCallbacks: {
		changeName: function( updater, name ){

			// Stores updates are only made inside store's action callbacks
			updater.set( {name: name} );
		}
	}
});

// It is not possible to update the store directly
helloStore.name = 'Charlie';
console.log( helloStore.name ); // logs "Alice"

// Listen to name changes
helloStore.on( 'change:name', function( name, previousName ){
	console.log( 'Bye ' + previousName + ', hello ' + helloStore.name );
});

// Dispatch actions
flux.doAction( 'changeName', 'Bob' ); // logs "Bye Alice, hello Bob";
```

## Index

* [Installation](#installation)
* [Use](#use)
* [Docs](#docs)
	* [Dispatcher](#dispatcher)
	* [Actions](#actions)
	* [Stores](#stores)
* [Collaborate](#collaborate)

## Installation
Fluxify is available as a npm package.
```
npm install fluxify
```

It is possible to download the [full version](https://raw.githubusercontent.com/arqex/fluxify/master/build/fluxify.js) (~13KB) or [minified](https://raw.githubusercontent.com/arqex/fluxify/master/build/fluxify.min.js) (~5KB)

## Use
Fluxify is packed as a UMD module, so it is possible to require it:

* As a CommonJS module (Node/Browserify)
```js
var flux = require('fluxify');
```

* As a AMD module( require.js )
```js
require(['fluxify'], function( flux ){
	...
});
```

* With a script tag in any web page
```html
<script src="path/to/fluxify.js"></script>
```
In this last case fluxify will be globally available.

## Docs
Fluxify brings all the necessary to start with [flux architecture](https://facebook.github.io/flux/docs/overview.html) immediately: **dispatcher, stores** and **actions**.

## Dispatcher
Using Flux architecture your application has a main state and the UI reflects that state. When the user interact with the app ( or there are updates from the server ) an action is launched. The dispacher broadcasts the action data to the all registered callbacks and they update the application state depending on that data.

In Fluxify the dispatcher is a singleton, as recommended by Facebook, and you can access to it through the fluxify object.

```js
var dispatcher = require('fluxify').dispatcher;
```

It is possible to use it like Facebook's dispatcher implementation, registering action callbacks and dispatching payloads.

```js
var callbackId = dispatcher.register( function( payload ){
	if( payload.actionType = 'log' )
		console.log( 'I was logged by an action!' );
});

dispatcher.dispatch( {actionType: 'log'} ); // log 'I was logged by an action!'
```
### An asynchronous dispatcher
The main difference of Fluxify's dispatcher is that it can handle asynchronous actions, **those actions that return a promise**. ```dispatch``` and ```waitFor``` methods also return a promise that fulfill when the dispatch or the callbacks are finished.

```js
var cb1 = dispatcher.register( function( payload ){
	return dispatcher.waitFor( [cb2] )
		.then( function(){
			console.log( 'I was waiting by cb2' );
		})
	;
});

var cb2 = dispatcher.register( function( payload ){
	return new dispatcher._Promise( function( resolve, reject ){
		setTimeout( function(){
			console.log( 'cb1 has been waiting by me' );
			resolve();
		});
	});
});

dispatcher.dispatch( {actionType: 'whatever'} )
	.then( function(){
		console.log( 'Everything dispatched properly' );
	})
;

// logs...
// cb1 hasbeen waiting by me
// I was waiting by cb2
// Everything dispatched properly
```

Since a dispatch can take a while, it is possible to call a new dispatch before the previous dispatch call had finished. Instead if throwing an error, the new call will be enqueued and executed just after the current dispatch finishes.

### Dispatcher promises
Fluxify needs ES6 Promises to work. If your environment supports promises ( current Chrome, Firefox, Opera and Safari versions support it ) or you use any polyfill everything will be ok.

But if the enviroment doesn't have the global ```Promise``` object defined, it is needed to provide ```Promise``` explicity, using Fluxify's ```promisify``` method.

```js
// Using Jake Archibald's es6 promise implementation
var flux = require('fluxify'),
	Promise = require('es6-promise')
;

// Let's get async!
flux.promisify( Promise );
```

There are a bunch promises implementations you can use. Popular choices are [es6-promise](https://github.com/jakearchibald/es6-promise), [when.js](https://github.com/cujojs/when) or [bluebird.js](https://github.com/petkaantonov/bluebird).

### Setting your own ids for callbacks
Using fluxify it is possible to define your own IDs for the callbacks.

In the file *clbk1.js*
```js
// Pass a string as the first parameter, it will be used as id
dispatcher.register('clbk1', function(){
	return dispatcher.waitFor( 'clbk2' )
		.then( function(){
			console.log('I was waiting by clbk2');
		})
	;
});
```
In the file *clbk2.js*
```js
dispatcher.register('clbk2', function(){
	console.log('Here I am!');
});
```

This feature allows to decouple the callbacks from the ID given by the dispatcher. In the example above, we don't need to save the id generated in the file *clbk2.js* and pass it to the callback in the file *clbk1.js*, because we already know that the id will be ```clbk2```, and we can use it direcly in the ```waitFor``` method.

Great power comes with great responsibility, if you give your own ids to the callbacks there is risk of name collision, so it is up to you the way to track your callback names (using a constants file?).

### Dispatch many arguments
Another difference between Facebook and Fluxify dispatcher is the number of arguments to dispatch. Facebook implementation only dispatches one argument, the payload object, while Fluxify dispatches all the arguments that are passed to the ```dispatch``` function.

That is a key feature to make actions much easier to use, as it is explained in the [action section](#actions).
```js
var dispatcher = require('fluxify').dispatcher;

// Register a callback that log the arguments
dispatcher.register( function(){
	console.log( arguments );
});

// It is possible to use dispatches as usual
dispatcher.dispatch( {actionType: 'logAll'} ); // logs [{actionType: 'logAll'}]

// Or you can dispatch multiple data
dispatcher.dispatch( 'logAll', 1, 2, 3 ); // logs ['logAll', 1, 2, 3]

```

Fluxify's stores makes use of the multiple arguments dispatching to make easier to register their callbacks.


## Actions
Actions are originated by the user interaction with the application or by some server event. The dispatcher broadcasts the action and its data to the registered callbacks and they know how to react to that actions updating the stores.

In Fluxify there are no action objects, but the concept of Action is important in Flux architecture, so the fluxify object expose a ```doAction``` method to explicity remark that we are executing an action.

```js
var flux = require('fluxify');

flux.dispatcher.register( function( payload ){
	if( payload.actionType == 'wakeUp')
		console.log( 'Hello ' + payload.name + '!' );
});

flux.doAction( {actionType: 'sayHello', name: 'John'} ); // logs "Hello John!"
```

### Action creators
Facebook recommends to create methods with specific names for executing actions. That makes the code in the view be more semantic, and easier to write than dispatching a payload:

```js
// Somewhere in your app...
var actions = {
	hello: function(){
		flux.doAction( {actionType: 'sayHello'} );
	}
}

// Somewhere in your view code...
actions.hello('Amy');
// Much more readable than
// flux.doAction( {actionType: 'sayHello', name: 'John'} );
```
In other different Flux implementations, those objects that store the actions are called *action creators*. Thinking in the fluxify way they are not needed either, since the dispatches accept multiple the arguments, it is much easier to use the ```doAction``` method directly with the data that the callback needs as arguments.

Let's fluxify:
```js
var flux = require('fluxify');

flux.dispatcher.register( function( actionName, name ){
	if( actionName == 'wakeUp')
		console.log( 'Hello ' + name + '!' );
});

flux.doAction( 'sayHello', 'John' ); // logs "Hello John!"
```
The example above is shorter and easier to write and understand than the original one, and it is as semantic as the one that uses action creators.

In fluxify, the use of *multiple-argument dispatches* is preferred to the use of verbose payloads.

## Stores
The stores are the source of truth of your application. They keep the state of parts of your application, and your UI should be the graphical representation of those states. If something change in a store, the UI should react updating the related parts to reflect that state change.

Fluxify's stores emit events when they are updated, so the app's views can listen to this events to automatically apply those changes to the UI.

```js
var flux = require('fluxify'),
	React = require('react')
;

// Our store
var nameStore = flux.createStore({
	id: 'nameStore',
	initialState: {
		name: 'Alice'
	},
	actionCallbacks: {
		changeName: function( updater, name ){
            // We can update nameStore with the set method
            // of the first argument
			updater.set( {name: name} );
		}
	}
});

// Let's create a react component
var Hello = React.createClass({
	getInitialState: function(){
		return {name: this.props.name };
	},

    render: function() {
        return <div>Hello {this.state.name}</div>;
    },

	componentDidMount: function(){
        var me = this;
		nameStore.on( 'change:name', function( value ){
			me.setState( {name: value} );
		});

		//Let's update the name in 2 seconds
		setTimeout( function(){
			flux.doAction( 'changeName', 'Bob' );
		}, 2000);
	}
});

React.render(<Hello name={nameStore.name} />, document.body);

```
[See this example working](http://jsfiddle.net/marquex/kb3gN/8204/)

### Store initialize options
The code above is a complete example of stores in Fluxify. Stores are created using Fluxify's factory method ```createStore``` with an options object. Available options are:

* **id** {string}: When an id is set in the options object, store's callback is automatically registered in the dispatcher with that id.
```js
var flux = require('fluxify');

var myStore = flux.createStore( {id: 'myStore'} );

// Is equivalent to...
var myStore = flux.createStore();
flux.dispatcher.registerStore( 'myStore', myStore );
flux.stores.myStore = myStore;
```
As you can see, a reference to the store is saved in the stores attribute of the flux object too.

* **initalState** {object}: The initial properties of the store. A Fluxify's store can be see as a common JS object, and you can read their properties as usual:
```js
var myStore = flux.createStore({
	initialStore: {
		a: 1,
		b: 2,
		c: 3
	}
});

console.log( myStore.a ); // logs 1
console.log( myStore.b ); // logs 2
console.log( myStore.c ); // logs 3
```
* **actionCallbacks** {object<Function>}: The functions in this object will be registered in the dispatcher, and called when the action named as the key is triggered.
There are two ways of call these callbacks:
	1. Passing the name as the first argument of Fluxify's ```doAction``` method.
	2. Passing the name as the ```actionType``` attribute of the payload.
```js
var myStore = flux.createStore({
	id: 'myStore',
	actionCallbacks: {
		myAction: function( updater ){
			console.log( 'Hi!');
		}
	}
});

// These two action calls will trigger the store's callback
flux.doAction( 'myAction' );
flux.doAction( {actionType: 'myAction'} );
```

### Store updater and events
The callback will receive always a writable ```updater``` object as the first argument. Using that object is the only way of updating a store, and it is only available in action callbacks forcing the developer to update the stores only there, as the Flux architecture recommends.
To update the store, use the ```updater.set``` method, it will change store's property values and emit events that can be listener by the rest of the application.
The rest of the arguments received are the ones given to ```doAction```.
In every update, two events are emitted by the store:

1. ```change:{updatedProperty}``` with the new and old values as parameters for the listeners.

2. ```change``` with an array of objects ```{prop, value, previousValue}``` for every property updated.
```js
var myStore = flux.createStore({
	id: 'myStore',
	initialState: { a: 1, b: 2 },
	actionCallbacks: {
		myAction: function( updater, a, b, c ){
			updater.set({
				a: a,
				b: b,
				c: c
			});
		}
	}
});

console.log( myStore.getState() ); // 1

// Set up some event listeners
myStore.on( 'change:a', function( value, previousValue ){
	console.log( 'a value was ' + previousValue + ' and now it is ' + value  ); // 2
});
myStore.on( 'change', function( updates ){
	// updates will have 3 elements,
	// one for each property updated
	console.log( updates[0] ); // 3
});

// This will emit the events
// 'change:a', 'change:b', 'change:c' and 'change'
flux.doAction( 'myAction', 3, 2, 1 )
	.then( function(){
		console.log( myStore.getState() ); // 4
	})
;

// The console will show;
// logs {a:1, b:2}
// a value was 1 and now it is 3
// { prop: 'a', value: 3, previousValue: 1}
// {a:3, b:2, c:1}
```

### Pseudo-immutable stores
It is not possible to change the value of a store's property directly, because they are defined
as non-writable.
But be aware that the store itself is mutable, you can add new properties directly but that is not recomended, since that property changes won't emit any events.
```js
var myStore = flux.createStore({
	intialState: {a:1}
});

// Properties are immutable
myStore.a = 5;
console.log( myStore.a ); // logs 1

// But you can add new ones
// This won't emit any event
myStore.b = 1;
console.log( myStore.b ); // logs 1

myStore.b = 2;
console.log( myStore.b ); // logs 2
```
Also keep in mind that if the property value is an object (or an array, they are objects too) the reference to that object is immutable, but the object itself is not.
```js
var myStore = flux.createStore({
	initialState: {
		ob: {a: 1}
	}
});

// It is not possible to update the reference
myStore.ob = 'Hey';
console.log( myStore.ob ); // {a: 1}

// Be careful, you can update the object itself
// and that won't emit any event
myStore.ob.b = 2;
console.log( myStore.ob ); // {a:1, b:2}
```

Stores in fluxify are pseudo-immutable to encourage their updates to be done inside the action callbacks, the way recommended by Flux architecture, but it is still possible to do the above bad practices.

### More about stores
* In store's action callbacks the ```this``` object references to the store.
```js
var myStore = flux.createStore({
	initialState: { a: 1 },
	actionCallbacks: {
		myAction: function(){
			console.log( this.a ); // logs 1
		}
	}
});
```

* Registered stores has a ```waitFor``` method for convenience.
```js
var fooStore = flux.createStore({
	id: 'foo',
	actionCallbacks: {
		myAction: function(){
			return this.waitFor( 'bar' )
				.then( function(){
					console.log( 'foo' );
				})
			;
		}
	}
});

var barStore = flux.createStore({
	id: 'bar',
	actionCallbacks: {
		myAction: function() {
			console.log( 'bar' );
		}
	}
}
});

flux.doAction('myAction');
// logs:
// 'bar'
// 'foo'
```

* Action callbacks can be added after initialization using ```addActionCallbacks```
```js
var myStore = flux.createStore();

myStore.addActionCallbacks({
	myAction: function(){
		console.log( 'Hey' );
	}
});

flux.doAction( 'myAction' ); // logs 'Hey'
```

* A writable copy of the object is available using ```getState``` method. It is the preferred way of passing a store to a react component.
```js
var nameStore = flux.createStore({
	initialState: {
		name: 'Alice'
	}
});

React.createElement( 'div', {store: nameStore.getState()} );
```

## Collaborate
Fluxify is a young library, so PRs, issues and feature requests or anything that helps it to improve is welcome.
