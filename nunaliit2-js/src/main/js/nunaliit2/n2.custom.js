/*
Copyright (c) 2013, Geomatics and Cartographic Research Centre, Carleton 
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
;(function($n2){
"use strict";

// Localization
//var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

// *******************************************************
// Service used to keep track of customizations
var CustomService = $n2.Class({
	
	custom: null,
	
	initialize: function(options_){
//		var options = $n2.extend({
//			directory: null
//		},options_);
		
		if( typeof(window.nunaliit_custom) === 'undefined' ) {
			window.nunaliit_custom = {};
		};

		this.custom = window.nunaliit_custom;
		
		this._check();
	},

	setOption: function(optionName, optionValue){
		this._check();

		this.custom.options[optionName] = optionValue;

		if( !this.custom.info[optionName] ){
			this.custom.info[optionName] = {
				reads: 0
				,writes: 1
			};
		} else {
			++this.custom.info[optionName].writes;
		};
	},
	
	getOption: function(optionName, defaultValue){
		this._check();

		if( !this.custom.info[optionName] ){
			this.custom.info[optionName] = {
				reads: 1
				,writes: 0
			};
		} else {
			++this.custom.info[optionName].reads;
		};
		
		if( typeof this.custom.options[optionName] === 'undefined' ){
			return defaultValue;
		};
		
		return this.custom.options[optionName];
	},
	
	updateOption: function(optionsMap, optionName){
		var value = this.getOption(optionName);
		if( typeof value !== 'undefined' ){
			optionsMap[optionName] = value;
		};
	},
	
	_check: function(){
		if( !this.custom.options ) this.custom.options = {};
		if( !this.custom.info ) this.custom.info = {};
	}
});

//*******************************************************
$n2.custom = {
	CustomService: CustomService
};

})(nunaliit2);
