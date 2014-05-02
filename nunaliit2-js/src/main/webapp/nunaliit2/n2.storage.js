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

// @requires n2.core.js

;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

var sessionStorage = null;
var localStorage = null;

function getSessionStorage(){
	
	if( !sessionStorage ){
		if( window.sessionStorage ){
			sessionStorage = new Storage(window.sessionStorage);
		} else {
			sessionStorage = new FallbackStorage();
		};
	};
	
	return sessionStorage;
};

function getLocalStorage(){
	
	if( !localStorage ){
		if( window.localStorage ){
			localStorage = new Storage(window.localStorage);
		} else {
			localStorage = new FallbackStorage();
		};
	};
	
	return localStorage;
};

var Storage = $n2.Class({
	
	browserObj: null,
	
	initialize: function(browserObj){
		this.browserObj = browserObj;
	},
	
	getKeys: function(){
		var keys = [];
		
		var s = this.browserObj.length;
		for(var i=0;i<s; ++i){
			keys.push(this.browserObj.key(i));
		};
		
		return keys;
	},
	
	getItem: function(key){
		return this.browserObj.getItem(key);
	},
	
	setItem: function(key, value){
		this.browserObj.setItem(key, value);
	},
	
	removeItem: function(key){
		this.browserObj.removeItem(key, value);
	},
	
	clear: function(){
		this.browserObj.clear();
	}
});

var FallbackStorage = $n2.Class({
	
	store: null,
	
	initialize: function(){
		this.store = {};
	},
	
	getKeys: function(){
		var keys = [];
		
		for(var key in this.store){
			keys.push(key);
		};
		
		return keys;
	},
	
	getItem: function(key){
		if( this.store[key] ) {
			return this.store[key];
		};
		return null;
	},
	
	setItem: function(key, value){
		this.store[key] = value;
	},
	
	removeItem: function(key){
		delete this.store[key];
	},
	
	clear: function(){
		this.store = {};
	}
});

//============================================================
// Exports
$n2.storage = {
	getSessionStorage: getSessionStorage,
	getLocalStorage: getLocalStorage,
	Storage: Storage
};

})(jQuery,nunaliit2);