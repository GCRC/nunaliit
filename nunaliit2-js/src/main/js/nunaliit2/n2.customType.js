/*
Copyright (c) 2017, Geomatics and Cartographic Research Centre, Carleton 
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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
,DH = 'n2.customType'
;

//*******************************************************
var CustomType = $n2.Class({
	
	dispatchService: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: undefined
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		if( !this.dispatchService ){
			throw new Error('When creating an instance of CustomType, the dispatchService must be provided');
		};
		
		var typeName = this.getTypeName();
		
		this.dispatchService.register(DH, 'showCustom', function(m, addr, dispatcher){
			_this._handleShowCustom(m, addr, dispatcher);
		});

		$n2.schema.registerCustomFieldHandler({
	        customType: typeName // name of custom type
	        ,handler: function(opts_){ // function called when form for custom type is needed
	        	_this.fieldHandler(opts_);
	        }
	    });

	},

	/**
	 * Subclasses should implement this method
	 */
	getTypeName: function(){
		throw new Error('Subclasses of CustomType must implement getTypeName()');
	},
	
	/**
	 * Subclasses should implement this method
	 */
	show: function(opts_){
		var opts = $n2.extend({
    		elem: undefined
    		,doc: undefined
    		,selector: undefined
    		,showService: undefined
    		,m: undefined
		},opts_);
	},
	
	/**
	 * Subclasses should implement this method
	 */
	fieldHandler: function(opts_){
		var opts = $n2.extend({
	        elem: null
	        ,doc: null
	        ,obj: null
	        ,selector: null
	        ,customType: null
	        ,callbackFn: null
		},opts_);
	},
	
	_handleShowCustom: function(m, addr, dispatcher){
	    var $elem = m.elem;
	    var doc = m.doc;
	    var customType = m.customType;
	    var selector = m.selector;
	    var showService = m.showService;
	    
	    var typeName = this.getTypeName();
	    
	    if( typeName == customType ){
	    	this.show({
	    		elem: $elem
	    		,doc: doc
	    		,selector: selector
	    		,showService: showService
	    		,m: m
	    	});
	    };
	}
});

//*******************************************************
$n2.customType = {
	CustomType: CustomType
};

})(nunaliit2);
