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
 - 	id: String. Unique identifier for this element
 -  sort: Optional String. Used to sort the cells in the grid.
 -  fragments: Map map of fragments that make this element. Gives a list of
               documents used to make up this element.
 - 	gridImage: an object which contains two properties (doc and attachment) to provide the required 
 	information for the insertMediaView show service. 
 	- gridImage.doc: provides the doc id of the image
	- gridImage.attachement: provided the filename of the attachment
*/
var GridCanvas = $n2.Class('GridCanvas',{

	canvasId: null,

	sourceModelId: null,

	elementGenerator: null,
 
	dispatchService: null,

	showService: null,

	elementsById: null,
	
	sortedElements: null,

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
		
		try {
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
			this.sortedElements = [];
			
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
	 			this.dispatchService.register(DH,'windowResized',f);
	 		};
	 		
	 		this._createGrid();
	
	 		$n2.log(this._classname,this);
	 		
		} catch(e) {
			var error = new Error('Unable to create '+this._classname+': '+err);
			opts.onError(error);
		};
 		
 		opts.onSuccess();
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
					var $target = $(e.target);
					if( $target.hasClass('n2gridcanvas_cell') ){
						// Ignore
					} else if( $target.parents('.n2gridcanvas_cell').length > 0 ) {
						// Ignore
					} else {
						_this._backgroundClicked();
					};
				})
				.scroll(function(){
					_this._scrollChanged( $(this) );
					return false;
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

		// Keep track of elements in sorted order
		this.sortedElements = [];
		for(var elementId in this.elementsById){
			var element = this.elementsById[elementId];
			this.sortedElements.push(element);
			
			if( typeof element.sort === 'undefined' ){
				element.sort = element.id;
			};
		};
		this.sortedElements.sort(function(a,b){
			if( a.sort < b.sort ){
				return -1;
			};
			if( a.sort > b.sort ){
				return 1;
			};
			return 0;
		});
		
		this._redrawGrid();
 	},
 	
 	_intentChanged: function(updatedElements){
 		var _this = this;

 		updatedElements.forEach(function(updatedElement){
 			var cellId = _this.canvasId + '_cell_' + updatedElement.id;
 			
 			var $cell = $('#'+cellId);
 			
 			_this._adjustIntent(updatedElement, $cell);
 		});
 	},
 	
 	_adjustIntent: function(element, $cell){
 		if( element.n2_hovered ){
 			$cell.addClass('n2gridcanvas_cell_hovered');
 		} else {
 			$cell.removeClass('n2gridcanvas_cell_hovered');
 		};
 		if( element.n2_selected ){
 			$cell.addClass('n2gridcanvas_cell_selected');
 		} else {
 			$cell.removeClass('n2gridcanvas_cell_selected');
 		};
 	},
	
 	_redrawGrid: function() {
		var _this = this;
		var $elem = this._getElem();
		var $grid = $('.n2gridcanvas');
		
		$grid.empty();
		
		this.sortedElements.forEach(function(element){
			var elementId = element.id;
			
			var cellId = _this.canvasId + '_cell_' + elementId;

			// Create an empty grid cell
			var $gridCell = $('<div>')
				.attr('id', cellId)
				.addClass('n2gridcanvas_cell')
				.attr('n2-element-id', elementId)
				.appendTo($grid)
				.click(function(){
					var $cell = $(this);
					var elementId = $cell.attr('n2-element-id');
					_this._cellClicked(elementId);
				})
				.mouseover(function(){
					var $cell = $(this);
					var elementId = $cell.attr('n2-element-id');
					_this._cellMouseOver(elementId);
				})
				.mouseout(function(){
					var $cell = $(this);
					var elementId = $cell.attr('n2-element-id');
					_this._cellMouseOut(elementId);
				});
			
			_this._adjustIntent(element, $gridCell);
		});
		
		this._reloadTiles();
	},
	
	_cellClicked: function(elementId){
 		var element = this.elementsById[elementId];
 		if( this.toggleSelection 
 		 && this.lastElementIdSelected === elementId ){
 			this.elementGenerator.selectOff(element);
 			this.lastElementIdSelected = null;
 		} else {
 			this.elementGenerator.selectOn(element);
 			this.lastElementIdSelected = elementId;
 		};
	},
	
	_cellMouseOver: function(elementId){
 		var element = this.elementsById[elementId];
 		if( elementId !== this.currentMouseOverId ){
 			// Focus Off before Focus On
 			if( this.currentMouseOver ){
 	 			this.elementGenerator.focusOff(this.currentMouseOverId);
 				this.currentMouseOverId = null;
 			};
 			
 			this.elementGenerator.focusOn(element);
 			this.currentMouseOverId = elementId;
 		};
	},
	
	_cellMouseOut: function(elementId){
 		var element = this.elementsById[elementId];
 		if( elementId === this.currentMouseOverId ){
 			this.elementGenerator.focusOff(elementId);
			this.currentMouseOverId = null;
 		};
	},
	
	/*
	 * Attempts to load the content of the visible tiles
	 */
	_reloadTiles: function(){
		var _this = this;

		var $canvas = this._getElem();
		
		var canvasWidth = $canvas.width();
		var canvasHeight = $canvas.height();
		var canvasOffsetTop = $canvas.scrollTop();
		var canvasOffsetLeft = $canvas.scrollLeft();
		
		$canvas.find('.n2gridcanvas_cell').each(function(){
			var $cell = $(this);
			
			var cellPosition = $cell.position();
			var cellHeight = $cell.height();
			var cellWidth = $cell.width();
			
			var show = true;
			if( cellPosition.top > canvasHeight ){
				show = false;
			} else if( (cellPosition.top + cellHeight) < 0 ){
				show = false;
			} else if( cellPosition.left > canvasWidth ){
				show = false;
			} else if( (cellPosition.left + cellWidth) < 0 ){
				show = false;
			};
			
			if( show ){
				if( $cell.hasClass('n2gridcanvas_cell_show') ){
					// Already done
				} else {
					_this._displayTile($cell);
					$cell.addClass('n2gridcanvas_cell_show');
				};
			} else {
				if( $cell.hasClass('n2gridcanvas_cell_show') ){
					$cell.empty().removeClass('n2gridcanvas_cell_show');
				};
			};
		});
	},
	
	_displayTile: function($cell){
		var elementId = $cell.attr('n2-element-id');
		var element = this.elementsById[elementId];
		
		if( element ){
			$cell.empty();

			var $gridCellImage = $('<div>')
				.addClass('n2gridcanvas_cell_image')
				.appendTo($cell);
			
			var $gridCellLabel = $('<div>')
				.addClass('n2gridcanvas_cell_label')
				.appendTo($cell);
						
			// Add image to grid cell if available
			if( element.gridImage ){
				var cellImage = element.gridImage;
				var $GridImage = $('<span>')
				.attr('class','n2s_insertMediaView')
				.attr('nunaliit-document',cellImage.doc)
				.attr('nunaliit-attachment',cellImage.attachment)
				.appendTo($gridCellImage);
			};
		
			// Add label to grid cell if available
			if ( this.elementsById[elementId].id ){
				var $GridLabel = $('<span>')
				.attr('class','n2s_briefDisplay')
				.attr('nunaliit-document',element.id)
				.appendTo($gridCellLabel);
			};

			this.showService.fixElementAndChildren($cell);
		};
	},

	_scrollChanged: function( $canvas ){
		var _this = this;
		
		var scrollTop = $canvas.scrollTop();
		var scrollLeft = $canvas.scrollLeft();

		// Wait a bit before loading images
		this.lastScrollTop = scrollTop;
		this.lastScrollLeft = scrollLeft;
		window.setTimeout(function(){
			if( _this.lastScrollTop === scrollTop 
			 && _this.lastScrollLeft === scrollLeft ){
				_this._reloadTiles();
			};
		},200);
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
 		} else if( 'windowResized' === m.type ) {
 			this._reloadTiles();
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
