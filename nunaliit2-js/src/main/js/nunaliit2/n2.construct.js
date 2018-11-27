/*
Copyright (c) 2018, Geomatics and Cartographic Research Centre, Carleton 
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

 */

;
(function($n2) {
	"use strict";
	
	/**
	 The single inheritance construct function

	 Class definition.
	 Usage:
	 var myClass = $n2.Construct(<classname string, optional>, <superclass
	 class, optional>*, {
	 var1: 1
	 ,var2: 2
	 ,initialize: function(v){
	 this.var2 = v;
	 this.report();
	 }

	 var inst = new myClass(5);
 	*/	
	/**
	 * If constructor: function() provided, invoke the parent's constructor yourselves 
	 * (inside the constructor).
	 * Or you can just provide initialize : function(), in which case, the parent invoking 
	 * is taken care by us. The (super: function) will always be call 
	 * at very end of the initiation of the subclass. 
	 */
	$n2.Construct = function() {
		// This is a copy of this class' prototype
		var proto = {};
		var vars = {};
		var className = null;
		var isContructorProvided = false;

		// This function is the class. It also represents the constructor
		// that is called when a new instance of the class is created.
		var childClass = function(options) {

			// Initialize instance variables from templates.
			for ( var key in vars) {
				if (vars[key] === null) {
					this[key] = vars[key];
				} else if ($n2.isArray(vars[key])) {
					this[key] = $n2.extend(true, [], vars[key]);
				} else if (typeof (vars[key]) === 'object') {
					this[key] = $n2.extend(true, {}, vars[key]);
				} else if (typeof (vars[key]) === 'function') {
					// This should not happen. Functions should be in
					// the prototype
				} else {
					this[key] = vars[key];
				}
				;
			}
			;

			// Assign class name
			if (typeof (className) === 'string') {
				this._classname = className;
			}
			;
			if ( false == isContructorProvided) {
				this.initialize.apply(this, arguments);
				
			// Call parent's constructor function
				childClass.base(this, 'constructor', options)
				
			} else {
				this.customConstructor.apply(this, arguments);
				
			}
			//
		};

		childClass.base = function(me, methodName, var_args) {

			var args = new Array(arguments.length - 2);
			for (var i = 2; i < arguments.length; i++) {
				args[i - 2] = arguments[i];
			}
			if (childClass.superClass_) {
				childClass.superClass_[methodName].apply(me, args);
			} else {
				// nothing need to be done if no superClass providing

			}
		};

		// Process class definition
		var singleInherit = true;
		for (var i = 0, len = arguments.length; i < len; ++i) {
			if (i === 0 && typeof (arguments[i]) === 'string') {
				// Class name
				childClass._classname = className = arguments[i];

			} else if (typeof (arguments[i]) === 'function') {

				if (singleInherit) {
					
					singleInherit = false;
					/** Constructor * */
					function tempCtor() {
					}
					tempCtor.prototype = arguments[i].prototype;
					childClass.superClass_ = arguments[i].prototype;
					proto = new tempCtor();

					
					// Extend variables from superclass
					if (arguments[i]._vars) {
						$n2.extend(vars, arguments[i]._vars);
					}
					;
				} else {
					throw new Error('multi inheritance not support');
				}
			} else {
				// Class definition. Save functions in prototype.
				// Save variable initializations separately.
				var def = arguments[i];
				for ( var key in def) {
					if (typeof (def[key]) === 'function') {
						proto[key] = def[key];
						isContructorProvided |= (key === "constructor")
					} else {
						vars[key] = def[key];
					}
					;
				}
				;
			}
			;
		}

		// Supply an empty initialize method if the
		// class does not have one
		if (!proto.initialize) {
			proto.initialize = function() {
			};
			;
		}
		;

		// Add getClass function
		proto.getClass = function() {
			return childClass;
		};

		childClass.prototype = proto;
		childClass.prototype.customConstructor = proto.constructor || function(){};
		childClass._vars = vars;
		childClass.prototype.constructor = childClass;
		

		return childClass;
	};

})(nunaliit2);