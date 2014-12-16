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

;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.widgetService'
 ;
 
//--------------------------------------------------------------------------
var CreateDocumentWidget = $n2.Class({
	
	contentId: null,
	
	dispatchService: null,
	
	elemId: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			contentId: null
			,dispatchService: null
		},opts_);
		
		this.contentId = opts.contentId;
		this.dispatchService = opts.dispatchService;
		
		this._display();
	},
	
	_display: function(){
		var _this = this;
		
		this.elemId = $n2.getUniqueId();
		
		var $div = $('<div>')
			.attr('id',this.elemId)
			.addClass('n2widget_createDocument')
			.appendTo( $('#'+this.contentId) );
		
//		$('<a>')
//			.attr('href','#')
//			.text( _loc('Create Document') )
//			.appendTo($div)
//			.click(function(){
//				_this._startEdit();
//				return false;
//			});
		$('<button>')
			.text( _loc('Create Document') )
			.appendTo($div)
			.click(function(){
				_this._startEdit();
				return false;
			});
	},
	
	_startEdit: function(){
		this.dispatchService.send(DH, {
			type: 'editInitiate'
			,doc: {}
		});
	}
});

//--------------------------------------------------------------------------
function BuildCreateDocumentWidgetFromRequest(m){
	var widgetOptions = m.widgetOptions;
	var contentId = m.contentId;
	var config = m.config;
	var moduleDisplay = m.moduleDisplay;
	
	var options = {
		contentId: contentId
	};
	
	if( config && config.directory ){
		options.dispatchService = config.directory.dispatchService;
	};
	
	new CreateDocumentWidget(options);
};

//--------------------------------------------------------------------------
var Service = $n2.Class({
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'widgetIsTypeAvailable',f);
			this.dispatchService.register(DH,'widgetDisplay',f);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'widgetIsTypeAvailable' === m.type ){
			if( m.widgetType === 'createDocument' ){
		        m.isAvailable = true;
		    };
		    
		} else if( 'widgetDisplay' === m.type ){
			if( m.widgetType === 'createDocument' ){
				BuildCreateDocumentWidgetFromRequest(m);
		    };
			
		};
	}
});

//--------------------------------------------------------------------------
$n2.widgetBasic = {
	Service: Service
	,CreateDocumentWidget: CreateDocumentWidget
};

})(jQuery,nunaliit2);
