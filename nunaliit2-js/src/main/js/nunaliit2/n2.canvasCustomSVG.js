/*
Copyright (c) 2015, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.canvasCustomSVG'
 ;
 
// Required library: d3
var $d = window.d3;
if( !$d ) return;
 
// --------------------------------------------------------------------------
var CustomSvgCanvas = $n2.Class({

	canvasId: null,
 	
	interactionId: null,
 	
	dispatchService: null,

	moduleDisplay: null,
 	
	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,interactionId: null
			,config: null
			,moduleDisplay: null
			,svgAttachment: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
 		
		var _this = this;
 	
		this.canvasId = opts.canvasId;
		this.interactionId = opts.interactionId;
		this.moduleDisplay = opts.moduleDisplay;

		var config = opts.config;
		if( config ){
			if( config.directory ){
				this.dispatchService = config.directory.dispatchService;
			};
		};

 		// Register to events
 		if( this.dispatchService ){
 			var f = function(m){
 				_this._handleDispatch(m);
 			};
 			
 			this.dispatchService.register(DH,'focusOn',f);
 			this.dispatchService.register(DH,'focusOnSupplement',f);
 			this.dispatchService.register(DH,'focusOff',f);
 			this.dispatchService.register(DH,'selected',f);
 			this.dispatchService.register(DH,'selectedSupplement',f);
 			this.dispatchService.register(DH,'unselected',f);
 		};
 		
 		if( opts.svgAttachment ){
 			// Load up SVG as an attachment to the module document
 			var svgUrl = null;
 			if( opts.moduleDisplay 
 			 && opts.moduleDisplay.module ){
 				svgUrl = opts.moduleDisplay.module.getAttachmentUrl(opts.svgAttachment);
 			};
 			
 			if( svgUrl ){
 				$.ajax({
 					url: svgUrl
 					,type: 'get'
 					,async: true
 					,dataType: 'xml'
 					,success: function(svgDocument) {
						opts.onSuccess();
						
						_this._renderSvgDocument(svgDocument);
 					}
 					,error: function(XMLHttpRequest, textStatus, errorThrown) {
 						opts.onError( _loc('Error loading SVG from location: {url}',{
 							url: svgUrl
 						}) );
 					}
 				});
 			} else {
 				opts.onError( _loc('Location of SVG is undefined for customSvg canvas') );
 			};
 			
 		} else {
 			opts.onError( _loc('A SVG file must be specified for the customSvg canvas') );
 		};

 		$n2.log('CustomSvgCanvas',this);
 	},
 	
 	_handleDispatch: function(m){
 		if( 'focusOn' === m.type ){
 			var docId = m.docId;
 			var cls = 'n2LinkIntent_'+$n2.utils.stringToHtmlId(docId);
 			$d.select('#'+this.canvasId).selectAll('.'+cls)
 				.classed('n2LinkHovered',true)
 				;
 			
 		} else if( 'focusOnSupplement' === m.type ){
 		} else if( 'focusOff' === m.type ){
 			$d.select('#'+this.canvasId).selectAll('.n2LinkHovered')
				.classed('n2LinkHovered',false)
				;

 		} else if( 'selected' === m.type ){
 			var docIds = [];
 			
 			if( m.docId ){
 				docIds.push(m.docId);
 			};
 			if( m.docIds ){
 				docIds.push.apply(docIds, m.docIds);
 			};
 			
 			for(var i=0,e=docIds.length; i<e; ++i){
 	 			var docId = docIds[i];
 	 			var cls = 'n2LinkIntent_'+$n2.utils.stringToHtmlId(docId);
 	 			$d.select('#'+this.canvasId).selectAll('.'+cls)
 	 				.classed('n2LinkSelected',true)
 	 				;
 			};

 		} else if( 'selectedSupplement' === m.type ){
 		} else if( 'unselected' === m.type ){
 			$d.select('#'+this.canvasId).selectAll('.n2LinkSelected')
				.classed('n2LinkSelected',false)
				;
 		};
 	},
 	
 	_renderSvgDocument: function(svgDocument){
 		var _this = this;
 		
 		$n2.log('custom svg loaded');
 		
 		$('#'+this.canvasId)
 			.empty()
 			.append(svgDocument.documentElement);
 		
 		$d.select('#'+this.canvasId).selectAll('.n2LinkDocId').each(function(){
 			var $child = $d.select(this);
 			
 			var docId = $child.attr('n2-doc-id');
 			
 			if( docId ){
 				var cls = 'n2LinkIntent_'+$n2.utils.stringToHtmlId(docId);
 				
 	 			$child
 	 				.classed(cls,true)
	 				.on('mouseover',function(d,i){
	 					_this._mouseOver($d.select(this),$d.event);
	 				})
					.on('mouseout',function(d,i){
	 					_this._mouseOut($d.select(this),$d.event);
	 				})
					.on('click',function(d,i){
	 					_this._mouseClick($d.select(this),$d.event);
	 				})
	 				;
 			};

 			$child
				.classed({
					'n2LinkDocId':false
					,'n2LinkedDocId':true
				});
 		});

 		$d.select('#'+this.canvasId).selectAll('.n2LinkUnselect').each(function(){
 			var $child = $d.select(this);
 			
 			$child
				.on('click',function(d,i){
 					_this._mouseUnselect($d.select(this),$d.event);
 				})
				.classed({
					'n2LinkUnselect':false
					,'n2LinkUnselected':true
				});
 		});
 	},
 	
 	_mouseOver: function($elem, evt){
 		var docId = $elem.attr('n2-doc-id');
 		if( docId && this.dispatchService ){
 			this.dispatchService.send(DH,{
 				type: 'userFocusOn'
 				,docId: docId
 			});
 		};
 	},
 	
 	_mouseOut: function($elem, evt){
 		var docId = $elem.attr('n2-doc-id');
 		if( docId && this.dispatchService ){
 			this.dispatchService.send(DH,{
 				type: 'userFocusOff'
 				,docId: docId
 			});
 		};
 	},
 	
 	_mouseClick: function($elem, evt){
 		var docId = $elem.attr('n2-doc-id');
 		if( docId && this.dispatchService ){
 			this.dispatchService.send(DH,{
 				type: 'userSelect'
 				,docId: docId
 			});
 		};
 		
 		// Do not continue up the DOM tree
 		evt.stopPropagation();
 	},
 	
 	_mouseUnselect: function($elem, evt){
		this.dispatchService.send(DH,{
			type: 'userUnselect'
		});
 	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'customSvg' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'customSvg' ){
		
		var options = {};
		if( m.canvasOptions ){
			for(var key in m.canvasOptions){
				options[key] = m.canvasOptions[key];
			};
		};
		
		options.canvasId = m.canvasId;
		options.interactionId = m.interactionId;
		options.config = m.config;
		options.moduleDisplay = m.moduleDisplay;
		options.onSuccess = m.onSuccess;
		options.onError = m.onError;
		
		new CustomSvgCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasCustomSvg = {
	CustomSvgCanvas: CustomSvgCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
