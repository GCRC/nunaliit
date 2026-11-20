This page will introduce some of the new features in ES6 and how it change the way of compiling the javascript code in nunaliit codebase.

## What is ECMAScript 6

ES6 or ECMAScript 2015 is a significant update to Javascript with many useful features:

- modules (import/export)
- Classes
- Arrow functions
- promises
- Many high-order functions
- let keyword (scope restriction)
- and many more

Almost all the modern browsers support ES6 but for the old browsers there are many transpilers e.g. Babel.js that  transpile ES6 to ES5 (Javascript with old standards).

All of the popular javascript libraries and frameworks like Node.js, ReactJS follow ES6. To learn more about ES6, there are tons of tutorial online. Here is a good one: [Learning ES2015]{https://babeljs.io/docs/en/learn/}


## What are we using for compiling ES5 javascript files?

A customized Google Closure compiler. The mvn build target: 
```
  <java jar="target/tools/nunaliit2-javascript-compiler.jar" fork="true" failonerror="true" dir=".">
  	<arg line="--config-file ./compress/nunaliit2.cfg" />
  	<arg line="--config-file ./compress/nunaliit2-couch.cfg" />
  	<arg line="--license-file ./compress/license.txt" />
  	<arg line="--source-dir ./src/main/js/nunaliit2" />
  	<arg line="--output ./src/main/js/nunaliit2/nunaliit2.js" />
  	<arg line="--compile-level closure" />
  	<arg line="--verify" />
  	<arg line="--output-debug ./src/main/js/nunaliit2/nunaliit2-debug.js" />
  	<arg line="--output-debug-inline ./src/main/js/nunaliit2/nunaliit2-debug-il.js" />
  </java>
```

## What are we going to use for compiling ES6 javascript files?

- npm 
- gulp
- webpack
- babel (optional)


## npm compiling commands:

- `npm run full-build`

The command re-generates the index file and recompiles the es6 javascript files. The command should be run at the first time of compiling and every time a new js file has been created. 

- `npm run part-build`

The command recompiles the es6 js files. The command should be run every time a change has been made to es6 js files.

- `npm run watch`

This command detects the changes on es6 js files, and every time a change is detected, it executes `npm part-build`.

## How to define a javascript module in ES6 standard.
```
// Declare the module for jsdoc. Also, this comment is used to generate the index
/**
 * @module n2es6/subpackage/className
*/

// Import outside modules
import className/functionName from 'path-to-module';

// Declare 'DH' and _loc function for current module, which is necessary for nunaliit dispatch system to work.
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
var DH = 'n2.canvasMap';

// Implementation of a class
class className extends superClass {
  constructor (opt_options){
    ...
  }
}

// Implementation of a function
export function functionName(){
  
}

// Exporting the class defined in this file to outside world.
export default className;
```
## How to transfer a nunaliit es5 js file into a js file following es6 standands.
```
// Again, declare the module for jsdoc. Also, this annotation is used to generate the index
/**
* @module n2es6/widget/Time
*/

// Annotate the module as API module function, so ES6 packager can pick it up and compiles it into the final result.
/**
 * @function module:Time
 * @api
 */
var Time = (function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.widgetTime'
 ;

// The Implementation for the class using nunaliit class declaration syntax.
var TimelineWidget = $n2.Class({
	
	dispatchService: null,
	
	sourceModelId: null,
	
	elemId: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,sourceModelId: null
		},opts_);
		
		var _this = this;
	
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	}

});
//--------------------------------------------------------------------------

// Register the function and class into global namespaces.
$n2.widgetTime = {
	TimelineWidget: TimelineWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

return TimelineWidget;

})(jQuery,nunaliit2);

export default Time;
```


