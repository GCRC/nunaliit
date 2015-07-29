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
 ,DH = 'n2.canvasCustomHTML'
 ;

// --------------------------------------------------------------------------
var CustomHtmlCanvas = $n2.Class({

	canvasId: null,
 	
	interactionId: null,
 	
	dispatchService: null,

	showService: null,

	moduleDisplay: null,
	
	intentView: null,
	
	nodesById: null,
 	
	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,interactionId: null
			,config: null
			,moduleDisplay: null
			,htmlAttachment: null
			,cssAttachment: null
			,elemIdToDocId: null
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
				this.showService = config.directory.showService;
			};
		};
		
		this.nodesById = {};
		
		// Populate nodesById with information from user
		if( typeof opts.elemIdToDocId === 'object' ){
			for(var elemId in opts.elemIdToDocId){
				var docId = opts.elemIdToDocId[elemId];
				
				var node = {
					n2_id: docId
					,nodeId: elemId
				};
				
				this.nodesById[elemId] = node;
			};
		};
		
		// Create intent view to keep track of user requests
		if( this.dispatchService ){
			this.intentView = new $n2.userIntentView.IntentView({
				dispatchService: this.dispatchService
			});
			this.intentView.addListener(function(nodes){
				_this._intentChanged(nodes);
			});
		};

 		// Register to events
 		if( this.dispatchService ){
// 			var f = function(m){
// 				_this._handleDispatch(m);
// 			};
// 			
// 			this.dispatchService.register(DH,'focusOn',f);
 		};
 		
 		if( opts.cssAttachment ){
 			// Load up CSS as an attachment to the module document
 			var cssUrl = this._computeAttachmentUrl(opts.cssAttachment);
 			if( cssUrl ){
 				$.ajax({
 					url: cssUrl
 					,type: 'get'
 					,async: true
 					,dataType: 'text'
 					,success: function(cssDocument) {
 						cssLoaded(cssDocument);
 					}
 					,error: function(XMLHttpRequest, textStatus, errorThrown) {
 						opts.onError( _loc('Error loading CSS from location: {url}',{
 							url: cssUrl
 						}) );
 					}
 				});
 			} else {
 				opts.onError( _loc('Location of CSS is undefined for customHtml canvas') );
 			};
	 			
 		} else {
 			cssLoaded(undefined);
 		};

 		$n2.log('CustomHtmlCanvas',this);
 		
 		function cssLoaded(cssContent){
 			//$n2.log('CSS content',cssContent);
 	 		
 	 		if( opts.htmlAttachment ){
 	 			// Load up SVG as an attachment to the module document
 	 			var htmlUrl = _this._computeAttachmentUrl(opts.htmlAttachment);
 	 			if( htmlUrl ){
 	 				$.ajax({
 	 					url: htmlUrl
 	 					,type: 'get'
 	 					,async: true
 	 					,dataType: 'html'
 	 					,success: function(htmlDocument) {
 							opts.onSuccess();
 							
 							_this._renderHtmlDocument(htmlDocument, cssContent);
 	 					}
 	 					,error: function(XMLHttpRequest, textStatus, errorThrown) {
 	 						opts.onError( _loc('Error loading HTML from location: {url}',{
 	 							url: htmlUrl
 	 						}) );
 	 					}
 	 				});
 	 			} else {
 	 				opts.onError( _loc('Location of SVG is undefined for customHtml canvas') );
 	 			};
 	 			
 	 		} else {
 	 			opts.onError( _loc('A SVG file must be specified for the customHtml canvas') );
 	 		};

 		};
 	},
 	
 	_handleDispatch: function(m){
 	},
 	
 	_renderHtmlDocument: function(htmlDocument, cssContent){
 		var _this = this;
 		
 		$n2.log('custom html loaded');
 		
 		var $canvas = $('#'+this.canvasId)
 			.html(htmlDocument);
 		
 		// Adjust height and width
 		$canvas.children()
 			.css('width','100%')
 			.css('height','100%')
			.css('position','absolute')
			.css('left','0')
			.css('top','0')
 			;
 		
 		// Try to insert style information
 		if( cssContent ){
			var $html = $canvas.find('html');
 	 		if( $html.length < 1 ){
 	 			// Use main page
 	 			$html = $('html');
 	 		};
			
 	 		var $head = $html.find('head');
 	 		if( $head.length < 1 ){
 	 			$head = $('<head>')
 	 				.prependTo($html);
 	 		};
 	 			
 	 		if( $head.length > 0 ){
 				var $style = $('<style>')
					.attr('type','text/css')
					.text(cssContent);

 				$head.first().append( $style );
 	 		};
 		};
 		
 		// Fix URLs associated with images
 		$canvas.find('img').each(function(){
 			var $image = $(this);
 			var attName = $image.attr('src');
 			if( attName ){
 	 			var url = _this._computeAttachmentUrl(attName);
 	 			$image.attr('src',url);
 			};
 		});

 		// Iterate over the elements already in dictionary that
 		// were specified using elemIdToDocId option
 		for(var nodeId in this.nodesById){
 			var node = this.nodesById[nodeId];
 			var docId = node.n2_id;
 			
 			$('#'+nodeId)
 				.attr('n2-doc-id', docId)
 				.mouseover(function(e){
 					_this._mouseOver($(this),e);
 				})
				.mouseout(function(e){
 					_this._mouseOut($(this),e);
 				})
				.click(function(e){
 					_this._mouseClick($(this),e);
 				})
 				;
 		};

 		
 		// Find all elements that are associated with a doc id
 		$canvas.find('.n2canvas_linkDocId').each(function(){
 			var $child = $(this);
 			
 			var nodeId = $child.attr('id');
 			if( !nodeId ){
 				nodeId = $n2.getUniqueId();
 				$child.attr('id',nodeId);
 			};
 			
 			var docId = $child.attr('n2-doc-id');
 			
 			if( docId ){
 				// Create a node for this element/docId
 	 			var node = {
 	 	 			n2_id: docId
 	 	 			,nodeId: nodeId
 	 			};
 	 			_this.nodesById[nodeId] = node;
 	 			
 	 			$child
	 				.mouseover(function(e){
	 					_this._mouseOver($(this),e);
	 				})
					.mouseout(function(e){
	 					_this._mouseOut($(this),e);
	 				})
					.click(function(e){
	 					_this._mouseClick($(this),e);
	 				})
	 				;
 			};

 			$child
				.removeClass('n2canvas_linkDocId')
				.addClass('n2canvas_linkedDocId');
 		});

		// Adjust intention on all nodes. Update our elements accordingly
 		var nodes = [];
 		for(var nodeId in this.nodesById){
 			var node = this.nodesById[nodeId];
 			nodes.push(node);
 		};
		this.intentView.addNodes(nodes);
		this._intentChanged(nodes);
 		
		$canvas.find('.n2canvas_unselect').each(function(){
 			var $child = $(this);
 			
 			$child
				.click(function(e){
 					_this._mouseUnselect($(this),e);
 				})
 				.removeClass('n2canvas_unselect')
 				.addClass('n2canvas_unselected');
 		});
 		
 		// Get show service to fix HTML
 		if( this.showService ){
 			this.showService.fixElementAndChildren($canvas, {}, undefined);
 		};
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
 	},
 	
 	/*
 	 * This function is called when the user intent view observes
 	 * changes in the style of some nodes
 	 */
 	_intentChanged: function(nodes){
 		for(var i=0,e=nodes.length; i<e; ++i){
 			var node = nodes[i];
 			
 			var $node = $('#'+node.nodeId);
 
 			if( node.n2_hovered ){
 				$node.addClass('n2canvas_hovered');
 			} else {
 				$node.removeClass('n2canvas_hovered');
 			};
 
 			if( node.n2_selected ){
 				$node.addClass('n2canvas_selected');
 			} else {
 				$node.removeClass('n2canvas_selected');
 			};
 			 
 			if( node.n2_selected && node.n2_hovered ){
 				$node.addClass('n2canvas_selectedHovered');
 			} else {
 				$node.removeClass('n2canvas_selectedHovered');
 			};
 		};
 	},
 	
 	_computeAttachmentUrl: function(attName){
		var url = undefined;
		
		if( this.moduleDisplay 
		 && this.moduleDisplay.module ){
			url = this.moduleDisplay.module.getAttachmentUrl(attName);
		};
		
		return url;
 	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'customHtml' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'customHtml' ){
		
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
		
		new CustomHtmlCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasCustomHtml = {
	CustomHtmlCanvas: CustomHtmlCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
