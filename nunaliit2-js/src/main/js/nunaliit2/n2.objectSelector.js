/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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

;(function($n2) {
"use strict";

// Localization
//var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

//=========================================================================
function escapeSelector(sel) {
	if( null === sel ) {
		return 'x';

	} else if( 'string' === typeof sel ) {
		var res = [];
		res.push('s');
		for(var i=0,e=sel.length; i<e; ++i) {
			var c = sel[i];
			if( c >= 'a' && c <= 'z' ) { res.push(c); }
			else if( c >= 'A' && c <= 'Z' ) { res.push(c); }
			else if( c >= '0' && c <= '9' ) { res.push(c); }
			else {
				var code = c.charCodeAt(0);
				var o0 = (code & 0x07) + 0x30;
				var o1 = ((code >> 3) & 0x07) + 0x30;
				var o2 = ((code >> 6) & 0x07) + 0x30;
				res.push('_');
				res.push( String.fromCharCode(o2) );
				res.push( String.fromCharCode(o1) );
				res.push( String.fromCharCode(o0) );
			};
		};
		return res.join('');

	} else if( 'number' === typeof sel ) {
		if( sel >= 0 ){
			return 'p'+sel;
		};
		return 'n'+(sel * -1);

	} else if( 'boolean' === typeof sel ) {
		if( sel ){
			return 't';
		} else {
			return 'f';
		};

	} else if( 'undefined' === typeof sel ) {
		return 'u';
	};

	return 'u';
};

function unescapeSelector(sel) {
	if( !sel ){
		return undefined;
	};
	if( sel.length < 1 ){
		return undefined;
	};
	
	if( 'u' === sel[0] ){
		return undefined;
	};
	
	if( 't' === sel[0] ){
		return true;
	};

	if( 'f' === sel[0] ){
		return false;
	};

	if( 'x' === sel[0] ){
		return null;
	};

	if( 'p' === sel[0] ){
		return 1 * sel.substr(1);
	};

	if( 'n' === sel[0] ){
		return -1 * sel.substr(1);
	};
	
	if( 's' === sel[0] ) {
		var res = [];
		for(var i=1,e=sel.length; i<e; ++i) {
			var c = sel[i];
			if( c === '_' ) { 
				++i;
				var o2 = sel.charCodeAt(i);
				++i;
				var o1 = sel.charCodeAt(i);
				++i;
				var o0 = sel.charCodeAt(i);
				
				var b = ((o2-0x30)<<6)+((o1-0x30)<<3)+(o0-0x30);
				res.push(String.fromCharCode(b));
				
			} else {
				res.push(c);
			};
		};
		return res.join('');
	};
	
	return undefined;
};

//=========================================================================
/**
 * Instances of this class represent a path selector, which can be used
 * to address a portion of an object. This class is instantiated by providing
 * an array of strings. Each string in the array represent one step in the
 * path selection.
 */
var ObjectSelector = $n2.Class({
	
	selectors: null,
	
	initialize: function(selectors){
		// Verify that this is an array of string or numbers
		if( !$n2.isArray(selectors) ){
			throw new Error('Instances of ObjectSelector must be created using an array');
		};
		
		this.selectors = selectors;
	},
	
	getChildSelector: function(key){
		var effectiveKey = null;
		if( typeof key === 'string' ){
			effectiveKey = key;
			
		} else if( typeof key === 'number' ) {
			effectiveKey = key;

		} else if( typeof key === 'object' 
		 && $n2.isArray(key) ) {
			var selectors = this.selectors.slice();
			selectors.push.apply(selectors, key);
			return new ObjectSelector(selectors);

		} else if( typeof key === 'object'
		 && typeof key.selectors === 'object'
		 && $n2.isArray(key.selectors) ) {
			var selectors = this.selectors.slice();
			selectors.push.apply(selectors, key.selectors);
			return new ObjectSelector(selectors);
			
		} else {
			throw new Error('A string or number must be provided when creating a child selector');
		};
		
		// Copy current selector
		var selectors = this.selectors.slice();
		selectors.push(effectiveKey);
		
		return new ObjectSelector(selectors);
	},
	
	getValue: function(obj){
		if(this.selectors.length < 1){
			return obj;
			
		} else if( typeof obj === 'undefined' ){
			return obj;
			
		} else if( obj === null ){
			return undefined;

		} else if( typeof obj === 'object' ){
			var effObj = obj;
			for(var i=0,e=this.selectors.length; i<e; ++i){
				var sel = this.selectors[i];
				if( null === effObj ){
					return undefined;
				} else if( typeof effObj[sel] === 'undefined' ){
					return undefined;
				};
				effObj = effObj[sel];
			};
			return effObj;
		
		} else {
			return undefined;
		};
	},
	
	setValue: function(obj, value, create){
		
		if( typeof value === 'undefined' ){
			return this.removeValue(obj);
		};
		
		var createFlag = (typeof create !== 'undefined') ? create : false;
		
		if( typeof obj !== 'object' ){
			return false;
		};
		if( this.selectors.length < 1 ){
			return false;
		};
		
		var effObj = obj;
		for(var i=0,e=this.selectors.length-1; i<e; ++i){
			var sel = this.selectors[i];
			if( typeof effObj[sel] === 'undefined' ){
				if( createFlag ){
					effObj[sel] = {};
				} else {
					return false;
				};
			} else if( typeof effObj[sel] !== 'object' ){
				return false;
			};
			effObj = effObj[sel];
		};
		var lastSel = this.selectors[this.selectors.length-1];
		effObj[lastSel] = value;
		
		return true;
	},
	
	removeValue: function(obj){
		if( typeof obj !== 'object' ){
			return false;
		};
		if( this.selectors.length < 1 ){
			return false;
		};
		
		var effObj = obj;
		for(var i=0,e=this.selectors.length-1; i<e; ++i){
			var sel = this.selectors[i];
			if( typeof effObj[sel] === 'undefined' ){
				return false;
			} else if( typeof effObj[sel] !== 'object' ){
				return false;
			};
			effObj = effObj[sel];
		};
		var lastSel = this.selectors[this.selectors.length-1];
		if( typeof effObj[lastSel] !== 'undefined' ){
			delete effObj[lastSel];
			return true;
		};

		return false;
	},
	
	/**
	 * Returns the selector to address the object containing the one pointed
	 * to by this path. If there are no parent selector, null is returned.
	 */
	getParentSelector: function(){
		if( this.selectors.length < 1 ){
			return null;
		};
		
		if( this.selectors.length === 1 ){
			return new ObjectSelector([]);
		};
		
		var parentSelectors = this.selectors.slice(0,this.selectors.length-1);
		return new ObjectSelector(parentSelectors);
	},
	
	/**
	 * Returns the key needed, from the perspective of the parent selector,
	 * to address the portion of the object that this path refers to. If there are no 
	 * parent selector, undefined is returned.
	 */
	getKey: function(){
		if( this.selectors.length < 1 ){
			return undefined;
		};
		
		return this.selectors[this.selectors.length-1];
	},
	
	getSelectorString: function(){
		return this.selectors.join('.');
	},
	
	encodeForDomAttribute: function(){
		var encodedPortions = [];
		for(var i=0,e=this.selectors.length; i<e; ++i){
			var sel = this.selectors[i];
			var encoded = escapeSelector(sel);
			encodedPortions.push(encoded);
		};
		return encodedPortions.join('-');
	}
});

//=========================================================================
function parseSelector(selectorString){
	var parts = selectorString.split('.');
	return new ObjectSelector(parts);
};

//=========================================================================
function decodeFromDomAttribute(domAttribute){
	var parts = [];
	if( domAttribute && domAttribute.length > 0 ) {
		var encodedParts = domAttribute.split('-');
		for(var i=0,e=encodedParts.length; i<e; ++i){
			var encoded = encodedParts[i];
			var part = unescapeSelector(encoded);
			parts.push(part);
		};
	};
	return new ObjectSelector(parts);
};

//=========================================================================
// Iterate over an object and find all possible selectors according to a
// a filter function
function findSelectors(obj, testFn){
	function traverse(obj, testFn, result, selector){
		for(var key in obj){
			var value = obj[key];
			if( testFn(value) ){
				var childSelector = selector.getChildSelector(key);
				result.push(childSelector);
			};
			
			if( typeof value === 'object' ){
				var childSelector = selector.getChildSelector(key);
				traverse(value, testFn, result, childSelector);
			};
		};
	};

	if( typeof obj !== 'object' ){
		throw new Error('objectSelector.findSelectors() needs an object');
	};
	if( typeof testFn !== 'function' ){
		throw new Error('objectSelector.findSelectors() needs a test function');
	};
	
	var result = [];
	var rootSelector = new ObjectSelector([]);
	
	if( testFn(obj) ){
		result.push(rootSelector);
	};
	
	traverse(obj, testFn, result, rootSelector);
	
	return result;
};


// =========================================================================

$n2.objectSelector = {
	ObjectSelector: ObjectSelector
	,parseSelector: parseSelector
	,decodeFromDomAttribute: decodeFromDomAttribute
	,findSelectors: findSelectors
};	
	
})(nunaliit2);
