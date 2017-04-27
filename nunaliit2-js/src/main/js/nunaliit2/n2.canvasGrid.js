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
 ,DH = 'n2.canvasGrid'
 ;

// --------------------------------------------------------------------------
/* 
This canvas displays a grid of elements provided by an element generator. The original purpose 
for this canvas is to provide a simple way to display a photo grid which are referenced linked 
to specific documents.  

The attribute for each grid cell is described here:
 - 	id: a doc id for use as a reference link and as the label of grid cell
 - 	gridImage: an object which contains two properties (doc and attachment) to provide the required 
 	information for the insertMediaView show service. 
 	- gridImage.doc: provides the doc id of the image
	- gridImage.attachement: provided the filename of the attachment
*/
var GridCanvas = $n2.Class({

	canvasId: null,

	sourceModelId: null,

	elementGenerator: null,
 
	dispatchService: null,

	showService: null,

	elementsById: null,

	intentView: null,
 
	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,sourceModelId: null
			,elementGenerator: null
			,config: null
			,moduleDisplay: null
			,elemIdToDocId: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
 		
		var _this = this;
 	
		this.canvasId = opts.canvasId;
		this.sourceModelId = opts.sourceModelId;
		this.elementGenerator = opts.elementGenerator;

		var config = opts.config;
		if( config ){
			if( config.directory ){
				this.dispatchService = config.directory.dispatchService;
				this.showService = config.directory.showService;
			};
		};
	
		this.elementsById = {};
		
 		// Element generator
 		if( this.elementGenerator ){
			this.elementGenerator.setElementsChangedListener(function(added, updated, removed){
				_this._elementsChanged(added, updated, removed);
			});
			this.elementGenerator.setIntentChangedListener(function(updated){
				_this._intentChanged(updated);
			});
 		};

 		// Register to events
 		if( this.dispatchService ){
 			var f = function(m){
 				_this._handleDispatch(m);
 			};
 			
 			this.dispatchService.register(DH,'modelGetInfo',f);
 			this.dispatchService.register(DH,'modelStateUpdated',f);
 		};
 		
 		this._createGrid();

 		$n2.log('GridCanvas',this);
 	},

	_getElem: function(){
		var $elem = $('#'+this.canvasId);
		if( $elem.length < 1 ){
			return undefined;
		};
		return $elem;
	},

 	_createGrid: function(){
		var _this = this;

		var $elem = this._getElem();
		if( $elem ){
			$elem
				.empty()
				.addClass('n2gridcanvas')
				.click(function(e){
					_this._backgroundClicked();
				});
		};
 	},
 
	_backgroundClicked: function(){
		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'userUnselect'
			});
		};
	},

 	_elementsChanged: function(addedElements, updatedElements, removedElements){
 		var _this = this;
 		
 		// Remove elements that are no longer there
		for(var i=0,e=removedElements.length; i<e; ++i){
			var removed = removedElements[i];
			delete this.elementsById[removed.id];
		};
		
		// Add elements
		for(var i=0,e=addedElements.length; i<e; ++i){
			var addedElement = addedElements[i];
			this.elementsById[addedElement.id] = addedElement;
		};
		
		// Update elements
		for(var i=0,e=updatedElements.length; i<e; ++i){
			var updated = updatedElements[i];
			this.elementsById[ updated.id ] = updated;
		};
		
		this._redrawGrid();
 	}, 	
	
 	_redrawGrid: function() {
		var _this = this;
		var $elem = this._getElem();
		var $grid = $('.n2gridcanvas');
		
		$grid.empty();
		
		for (var element in this.elementsById){
			
			// Create an empty grid cell
			var $gridCell = $('<div>')
				.attr('class','n2gridcanvas_cell')
				.css('background-color','#EFEFEF')
				.appendTo($grid);
			
			var $gridCellImage = $('<div>')
				.attr('class','n2gridcanvas_cell_image')
				.appendTo($gridCell);
			
			var $gridCellLabel = $('<div>')
				.attr('class','n2gridcanvas_cell_label')
				.appendTo($gridCell);

						
			// Add image to grid cell if available
			if( this.elementsById[element].gridImage ){
				var cellImage = this.elementsById[element].gridImage;
				var $GridImage = $('<span>')
				.attr('class','n2s_insertMediaView')
				.attr('nunaliit-document',cellImage.doc)
				.attr('nunaliit-attachment',cellImage.attachment)
				.appendTo($gridCellImage);
			};

			// Add label/referencelink to grid cell if available
			if ( this.elementsById[element].id ){
				var $GridLabel = $('<span>')
				.attr('class','n2s_referenceLink')
				.attr('nunaliit-document',this.elementsById[element].id)
				.appendTo($gridCellLabel);
			};
		};
		
		this.showService.fixElementAndChildren($grid);
	},
 	
 	_sourceModelUpdated: function(state){
 		this.elementGenerator.sourceModelUpdated(state);
 	},

 	_handleDispatch: function(m){
 		if( 'modelGetInfo' === m.type ){
 			if( m.modelId === this.modelId ){
 				m.modelInfo = this._getModelInfo();
 			};
 			
 		} else if( 'modelStateUpdated' === m.type ) {
 			if( this.sourceModelId === m.modelId ){
 				if( m.state ){
 					this._sourceModelUpdated(m.state);
 				};
 			};
 		};
 	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'grid' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'grid' ){
		
		var options = {};
		if( m.canvasOptions ){
			for(var key in m.canvasOptions){
				options[key] = m.canvasOptions[key];
			};
		};
		
 		if( !options.elementGenerator ){
 			// If not defined, use the one specified by type
 			options.elementGenerator = $n2.canvasElementGenerator.CreateElementGenerator({
 	 			type: options.elementGeneratorType
 	 			,options: options.elementGeneratorOptions
 	 			,config: m.config
 	 		});
 		};
 		
		options.canvasId = m.canvasId;
		options.config = m.config;
		options.onSuccess = m.onSuccess;
		options.onError = m.onError;
		
		new GridCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasGrid = {
	GridCanvas: GridCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
