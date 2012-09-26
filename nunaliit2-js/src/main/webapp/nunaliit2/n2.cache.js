/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.cache.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @ requires n2.utils.js

;(function($,$n2){

// Localization
var _loc = function(str){ return $n2.loc(str,'nunaliit2'); };

var CacheService = $n2.Class({
	options: null
	
	,cacheFunctions: null
	
	,initialize: function(options_){
		this.options = $n2.extend({
		},options_);
		
		this.cacheFunctions = [];
	}

	/**
	 * Returns a value from cache based on the given id.
	 * @param id {String} identifier for cached value
	 * @return {Object} value cached for given identifier. 
	 * If not found, returns null;
	 */
	,retrieve: function(id){
		// Loop through cache functions
		for(var i=0,e=this.cacheFunctions.length; i<e; ++i){
			var cacheFn = this.cacheFunctions[i];
			var value = cacheFn(id);
			if( typeof(value) !== 'undefined' && value != null ) {
				// Found it
				return value;
			};
		};
		
		return null;
	}
	
	,addCacheFunction: function(cacheFn){
		if( typeof(cacheFn) === 'function' ) {
			this.cacheFunctions.push(cacheFn);
		};
	}
});

$n2.cache = {
	CacheService: CacheService
	,defaultCacheService: null
};

})(jQuery,nunaliit2);