/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

$Id: n2.class.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @requires n2.core.js
// @requires n2.utils.js

;(function($n2){

var EmptyInit = function(){};

// Class definition.
// Usage:
//   var myClass = $n2.Class(<classname string, optional>, <superclass class, optional>*, {
//      var1: 1
//      ,var2: 2
//      ,initialize: function(v){
//         this.var2 = v;
//         this.report();
//      }
//      ,report: function(){
//         alert('var1: '+this.var1+' var2:'+this.var2);
//      }
//   }); 
//
//   var inst = new myClass(5);
$n2.Class = function() {
	// This is a copy of this class' prototype
    var proto = {};
    var vars = {};
    var className = null;
	
	// This function is the class. It also represents the constructor
	// that is called when a new instance of the class is created.
    var Class = function() {
    	// Initialize instance variables from templates.
    	for(var key in vars){
    		if( vars[key] === null ) {
    			this[key] = vars[key];
    		} else if( $n2.isArray(vars[key]) ) {
    			this[key] = $n2.extend(true, [], vars[key]);
    		} else if( typeof(vars[key]) === 'object' ){
    			this[key] = $n2.extend(true, {}, vars[key]);
    		} else if( typeof(vars[key]) === 'function' ){
    			// This should not happen. Functions should be in
    			// the prototype
    		} else {
    			this[key] = vars[key];
    		};
    	};
    	
    	// Assign class name
    	if( typeof(className) === 'string' ) {
    		this._classname = className;
    	};
    	
    	// Call initialization function
        this.initialize.apply(this, arguments);
    };

    // Process class definition
    for(var i=0, len=arguments.length; i<len; ++i) {
    	if( i === 0 && typeof(arguments[i]) === 'string' ) {
    		// Class name
    		Class._classname = className = arguments[i];
    		
    	} else if( typeof(arguments[i]) === 'function' ) {
            // This is a superclass. Extend this class' prototype
    		// from the superclass' prototype
            var parent = arguments[i].prototype;
            for(var key in parent){
            	if( typeof(parent[key]) === 'function' ){
            		proto[key] = parent[key];
            	} else {
            		vars[key] = parent[key];
            	};
            };
            
            // Extend variables from superclass
            if( arguments[i]._vars ){
                $n2.extend(vars, arguments[i]._vars);
            };
            
        } else {
            // Class definition. Save functions in prototype.
        	// Save variable initializations separately.
            var def = arguments[i];
            for(var key in def){
            	if( typeof(def[key]) === 'function' ){
            		proto[key] = def[key];
            	} else {
            		vars[key] = def[key];
            	};
            };
        };
    }
                
    // Supply an empty initialize method if the
    // class does not have one
    if( !proto.initialize ) {
    	proto.initialize = EmptyInit;
    };

    Class.prototype = proto;
    Class._vars = vars;
    return Class;
};

})(nunaliit2);