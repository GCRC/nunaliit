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
;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
,DH = 'n2.displayRibbon'
;

function docCreationTimeSort(lhs, rhs) {
	var timeLhs = 0;
	var timeRhs = 0;
	
	if( lhs && lhs.doc && lhs.doc.nunaliit_created && lhs.doc.nunaliit_created.time ) {
		timeLhs = lhs.doc.nunaliit_created.time;
	}
	if( rhs && rhs.doc && rhs.doc.nunaliit_created && rhs.doc.nunaliit_created.time ) {
		timeRhs = rhs.doc.nunaliit_created.time;
	}
	
	if( timeLhs < timeRhs ) return -1;
	if( timeLhs > timeRhs ) return 1;
	return 0;
};

function startsWith(s, prefix) {
	var left = s.substr(0,prefix.length);
	return (left === prefix);
};

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/*
* Template for document display
*/
var GridTemplateDocument = $n2.Class({
	height: null,
	
	tileHeight: null,
	
	initialize: function(height, tileHeight){
		this.height = (height ? height : 0);
		this.tileHeight = (tileHeight ? tileHeight : 150);
	},
	
	get: function(numCols, targetTiles) {
		// Have space to grow
		targetTiles = targetTiles + 12;
		
      var numRows = Math.ceil(targetTiles / numCols),
	        rects = [],
	        x, y, i;
	
      var firstTileHeight = Math.max(1, Math.ceil(this.height / this.tileHeight));
      
      // First tile is 2x1
      var firstTileWidth = 2;
      rects.push(new Tiles.Rectangle(0, 0, firstTileWidth, firstTileHeight));
      
      x = firstTileWidth - 1;
      y = 0;
      
      for(i = 1; i<targetTiles; ++i){
      	x = x + 1;
      	while( x >= numCols ){
      		y = y + 1;
      		x = 0;
      		
      		if( y < firstTileHeight ){
      			x = firstTileWidth;
      		};
      	};
      	
          rects.push(new Tiles.Rectangle(x, y, 1, 1));
      };
	
	    return new Tiles.Template(rects, numCols, numRows);
	}
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

var SchemaFilter = $n2.Class({
	
	elemId: null,
	
	changeCallback: null,
	
	schemaRepository: null,
	
	selectedSchema: null,
	
	initialize: function(elem, changeCallback, schemaRepository){
		var $elem = $(elem);
		this.elemId = $elem.attr('id');
		if( !this.elemId ){
			this.elemId = $n2.getUniqueId();
			$elem.attr('id',this.elemId);
		};
		
		this.changeCallback = changeCallback;
		this.schemaRepository = schemaRepository;
	},
	
	display: function(infos){
		var _this = this;
		
		var schemas = {};
		if( infos ){
			for(var i=0,e=infos.length; i<e; ++i){
				var info = infos[i];
				if( info.schema ){
					schemas[info.schema] = true;
				};
			};
		};
		
		var schemaNames = [];
		for(var schemaName in schemas){
			schemaNames.push(schemaName);
		};
		
		this.schemaRepository.getSchemas({
			names: schemaNames
			,onSuccess: function(schemas){
				_this._displaySchemas(schemas);
			}
			,onError: function(err){
				$n2.log('Error getting schemas for displaying schema filter',err);
			}
		});
	},
	
	filter: function(infos){
		if( this.selectedSchema ){
			var filteredInfos = [];
			
			for(var i=0,e=infos.length; i<e; ++i){
				var info = infos[i];
				
				if( info.schema === this.selectedSchema ){
					filteredInfos.push(info);
				};
			};
			
			return filteredInfos;
			
		} else {
			// Return all
			return infos;
		};
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_displaySchemas: function(schemas){
		var _this = this;
		
		var $elem = this._getElem();
		
		$elem.empty();
		
		var clickFn = function(){
			var $a = $(this);
			
			var schemaName = $a.attr('n2SchemaName');
			schemaName = schemaName ? schemaName : null;
			
			_this._schemaSelected(schemaName);
			
			return false;
		};
		
		$('<a>')
			.attr('href','#')
			.text( _loc('All') )
			.addClass('n2DisplayRibbon_filter')
			.addClass('n2DisplayRibbon_filter_all')
			.appendTo($elem)
			.click(clickFn);

		var keepCurrentSelection = false;
		for(var i=0,e=schemas.length; i<e; ++i){
			var schema = schemas[i];
			
			if( schema.name === this.selectedSchema ){
				keepCurrentSelection = true;
			};
			
			var schemaLabel = schema.name;
			if( schema.label ){
				schemaLabel = _loc(schema.label);
			};

			$('<a>')
				.attr('href','#')
				.attr('n2SchemaName',schema.name)
				.text( schemaLabel )
				.addClass('n2DisplayRibbon_filter_schema')
				.addClass('n2DisplayRibbon_filter_schema_'+$n2.utils.stringToHtmlId(schema.name))
				.appendTo($elem)
				.click(clickFn);
		};
		
		if( !keepCurrentSelection ) {
			this.selectedSchema = null;
		};
		
		this._adjustSelection();
	},
	
	_adjustSelection: function(){
		var $elem = this._getElem();
		
		$elem.find('.n2DisplayRibbon_filter_selected')
			.removeClass('n2DisplayRibbon_filter_selected');
		
		if( this.selectedSchema ){
			$elem.find('.n2DisplayRibbon_filter_schema_'+$n2.utils.stringToHtmlId(this.selectedSchema))
				.addClass('n2DisplayRibbon_filter_selected');
			
		} else {
			$elem.find('.n2DisplayRibbon_filter_all')
				.addClass('n2DisplayRibbon_filter_selected');
		};
	},
	
	_schemaSelected: function(schemaName){
		this.selectedSchema = schemaName;
		this._adjustSelection();
		this.changeCallback();
	}
});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

var SchemaFilterFactory = $n2.Class({
	
	schemaRepository: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			schemaRepository: null
		},opts_);
		
		this.schemaRepository = opts.schemaRepository;
	},

	get: function(elem, changeCallback){
		return new SchemaFilter(elem, changeCallback, this.schemaRepository);
	}
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

var ReferenceRelatedDocumentDiscovery = $n2.Class({
	
	documentSource: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			documentSource: null
		},opts_);
		
		this.documentSource = opts.documentSource;
	},
	
	getRelatedDocumentIds: function(opts_){
		var opts = $n2.extend({
			doc: null
			,onSuccess: function(doc, refDocIds){}
			,onError: function(err){}
		},opts_);
		
		var doc = opts.doc;

		this.documentSource.getReferencesFromId({
			docId: doc._id
			,onSuccess: loadedRefIds
			,onError: function(errorMsg){
				opts.onError(errorMsg);
			}
		});
		
		function loadedRefIds(referenceIds){
			// Map to accumulate all references
			var docIdMap = {};
			
			// Forward references
			var references = [];
			$n2.couchUtils.extractLinks(doc, references);
			for(var i=0, e=references.length; i<e; ++i){
				var linkDocId = references[i].doc;
				docIdMap[linkDocId] = true;
			};
			
			// Reverse links
			for(var i=0, e=referenceIds.length; i<e; ++i){
				var linkDocId = referenceIds[i];
				docIdMap[linkDocId] = true;
			};
			
			// Convert map to array
			var refDocIds = [];
			for(var docId in docIdMap){
				refDocIds.push(docId);
			};
			
			opts.onSuccess(doc, refDocIds);
		};
	},
	
	areDocumentsRelated: function(opts_){
		var opts = $n2.extend({
			selectedDoc: null
			,relatedDoc: null
			,onRelated: function(selectedDoc, relatedDoc){}
			,onNotRelated: function(selectedDoc, relatedDoc){}
			,onError: function(err){}
		},opts_);
		
		var selectedDoc = opts.selectedDoc;
		var relatedDoc = opts.relatedDoc;
		
		// Try to find related document in selected document
		var references = [];
		$n2.couchUtils.extractLinks(selectedDoc, references);
		for(var i=0, e=references.length; i<e; ++i){
			var linkDocId = references[i].doc;
			if( linkDocId === relatedDoc._id ){
				opts.onRelated(selectedDoc, relatedDoc);
				return;
			};
		};
		
		// Try to find selected document in related document
		var references = [];
		$n2.couchUtils.extractLinks(relatedDoc, references);
		for(var i=0, e=references.length; i<e; ++i){
			var linkDocId = references[i].doc;
			if( linkDocId === selectedDoc._id ){
				opts.onRelated(selectedDoc, relatedDoc);
				return;
			};
		};
		
		// At this point, the two documents are deemed not related
		opts.onNotRelated(selectedDoc, relatedDoc);
	}
});

//===================================================================================
// Copied and adapted from http://thinkpixellab.com/tilesjs

var Tile = $n2.Class({

	id: null,
	top: null,
	left: null,
	width: null,
	height: null,
	$el: null,
	parentId: null,
	
	initialize: function(tileId, element){
	    this.id = tileId;

	    // position and dimensions of tile inside the parent panel
	    this.top = 0;
	    this.left = 0;
	    this.width = 0;
	    this.height = 0;

	    // cache the tile container element
	    this.$el = $(element || document.createElement('div'));
	},
	
	appendTo: function($parent, fadeIn, delay, duration) {
		var parentId = $n2.utils.getElementIdentifier($parent);
		if( parentId !== this.parentId ){
			this.parentId = parentId;

			this.$el
		        .hide()
		        .appendTo($parent);
	
		    if (fadeIn) {
		        this.$el.delay(delay).fadeIn(duration);
		    } else {
		        this.$el.show();
		    };
		    
		    return true; // added
		};
		
		return false; // was already in
	},
	
	remove: function(animate, duration) {
	    if( animate ) {
	        this.$el.fadeOut({
	            complete: function() {
	                $(this).remove();
	            }
	        });
	    } else {
	        this.$el.remove();
	    }
	},
	
	// updates the tile layout with optional animation
	resize: function(pixelRect, animate, duration, onComplete) {
	   
	    // store the list of needed changes
	    var cssChanges = {},
	        changed = false;

	    // update position and dimensions
	    if (this.left !== pixelRect.x) {
	        cssChanges.left = pixelRect.x;
	        this.left = pixelRect.x;
	        changed = true;
	    }
	    if (this.top !== pixelRect.y) {
	        cssChanges.top = pixelRect.y;
	        this.top = pixelRect.y;
	        changed = true;
	    }
	    if (this.width !== pixelRect.width) {
	        cssChanges.width = pixelRect.width;
	        this.width = pixelRect.width;
	        changed = true;
	    }
	    if (this.height !== pixelRect.height) {
	        cssChanges.height = pixelRect.height;
	        this.height = pixelRect.height;
	        changed = true;
	    }

	    // Sometimes animation fails to set the css top and left correctly
	    // in webkit. We'll validate upon completion of the animation and
	    // set the properties again if they don't match the expected values.
	    var tile = this,
	        validateChangesAndComplete = function() {
	            var el = tile.$el[0];
	            if (tile.left !== el.offsetLeft) {
	                //console.log ('mismatch left:' + tile.left + ' actual:' + el.offsetLeft + ' id:' + tile.id);
	                tile.$el.css('left', tile.left);
	            }
	            if (tile.top !== el.offsetTop) {
	                //console.log ('mismatch top:' + tile.top + ' actual:' + el.offsetTop + ' id:' + tile.id);
	                tile.$el.css('top', tile.top);
	            }

	            if (onComplete) {
	                onComplete();
	            }
	        };


	    // make css changes with animation when requested
	    if (animate && changed) {

	        this.$el.animate(cssChanges, {
	            duration: duration,
	            easing: 'swing',
	            complete: validateChangesAndComplete
	        });
	    }
	    else {

	        if (changed) {
	            this.$el.css(cssChanges);
	        }

	        setTimeout(validateChangesAndComplete, duration);
	    }
	}
});

//===================================================================================
// Reimplements the grid class from http://thinkpixellab.com/tilesjs
// This instance creates a long horizontal ribbon where the left most location is
// privileged for the current document. Then, all the other documents are positioned
// to the right in a single line. These can be browsed using end arrows
var RibbonGrid = $n2.Class({
	
	// Function to create a new tile
	createTile: null,
	
	// Current size of a cell
	cellSize: null,
	
	cellSizeMin: null,

    cellPadding: null,
    
    numColumnMin: null,
    
	animationDuration: null,
	
	// The identifier for the current element
	elemId: null,
	
	// If set, the left most tile
	currentTile: null,
	
	// Array of tiles that are on the right
	relatedTiles: null,
	
	// Tiles that should be removed on next redraw
	removedTiles: null,
	
	rateOfChange: null,
	
	rateOfChangeEnd: null,
	
	relatedOffset: null,

	relatedOffsetMin: null,
	
	intervalId: null,
	
	initialize: function(element){
        var _this = this;

        var $elem = $(element);
		this.elemId = $n2.utils.getElementIdentifier($elem);
		
		this.createTile = function(tileId){
			var $elem = $('div')
				.css({
					position: 'absolute'
				});
			return new Tile(tileId, $elem);
		};

		// animation lasts 500 ms by default
        this.animationDuration = 500;

        // spacing between tiles
        this.cellPadding = 10;

        // min width and height of a cell in the grid
        this.cellSizeMin = 150;
        
        // Show at least 3 tiles in the given width
        this.numColumnMin = 3;
        
        this.currentTile = undefined;
        this.relatedTiles = [];
        this.removedTiles = [];
        this.rateOfChange = 0;
        this.rateOfChangeEnd = true;
        this.relatedOffset = 0;
        this.relatedOffsetMin = 0;

        this.intervalId = window.setInterval(function(){
        	_this._intervalTask();
        },300);
        	
		$elem
			.empty()
			;
		var currentPosition = $elem.css('position');
		if( !currentPosition ){
			$elem.css('position','relative');
		} else if( 'absolute' === currentPosition ){
			// OK
		} else {
			$elem.css('position','relative');
		};
		$('<div>')
			.addClass('n2DisplayRibbon_grid_current')
			.css({
				position: 'absolute'
				,left: '0'
				,top: '0'
				,bottom: '0'
				,right: 'auto'
				,width: '170px'
			})
			.appendTo($elem);
		var $extra = $('<div>')
			.addClass('n2DisplayRibbon_grid_extra')
			.css({
				position: 'absolute'
				,left: '170px'
				,top: '0'
				,bottom: '0'
				,right: '0'
			})
			.appendTo($elem);
		$('<div>')
			.addClass('n2DisplayRibbon_grid_related')
			.css({
				position: 'absolute'
				,left: '0'
				,top: '0'
				,bottom: '0'
			})
			.appendTo($extra);
		$('<div>')
			.addClass('n2DisplayRibbon_grid_button_previous')
			.appendTo($extra)
			.mousedown(function(){
				_this._buttonChanged('down','previous');
				return false;
			})
			.mouseup(function(){
				_this._buttonChanged('up','previous');
				return false;
			})
			;
		$('<div>')
			.addClass('n2DisplayRibbon_grid_button_next')
			.appendTo($extra)
			.mousedown(function(){
				_this._buttonChanged('down','next');
				return false;
			})
			.mouseup(function(){
				_this._buttonChanged('up','next');
				return false;
			})
			;
		
	},

	updateTiles: function(currentTileId, relatedTileIds){
		// Make a map of all current tiles, for easy access
		var tilesById = {};
		if( this.currentTile ){
			tilesById[this.currentTile.id] = this.currentTile;
		};
		for(var i=0,e=this.relatedTiles.length; i<e; ++i){
			var tile = this.relatedTiles[i];
			tilesById[tile.id] = tile;
		};

		// Load all the ids in a map to remove duplicates
		var newTilesById = {};
		
		var newCurrentTile = undefined;
		if( currentTileId ){
			var id = currentTileId;
			var tile = tilesById[id];
			
			if( !tile ){
				tile = this.createTile(id);
			};

			if( tile ){
				newTilesById[id] = tile;
				newCurrentTile = tile;
			};
		};
		
		var newRelatedTiles = [];
		for(var i=0,e=relatedTileIds.length; i<e; ++i){
			var id = relatedTileIds[i];
			var tile = tilesById[id];
			
			if( !tile ){
				tile = this.createTile(id);
			};
			
			if( tile ){
				newTilesById[id] = tile;
				newRelatedTiles.push(tile);
			};
		};
		
		var newRemovedTiles = [];
		for(var id in tilesById){
			var tile = tilesById[id];
			if( !newTilesById[id] ){
				newRemovedTiles.push(tile);
			};
		};
		
		// Update
		this.currentTile = newCurrentTile;
		this.relatedTiles = newRelatedTiles;
		this.removedTiles = newRemovedTiles;
	},
	
	/*
	 * This function moves the tiles around according to the new state
	 * of the instance (currentTile, relatedTiles, removedTiles)
	 * @param animate Boolean If set, use animation
	 * @param onComplete Function If specified, called when movement is done, or animation is complete
	 */
	redraw: function(animate, onComplete){
        // see if we should redraw
        if( !this._shouldRedraw() ) {
            if (onComplete) {
                onComplete(false); // tell callback that we did not redraw
            }
            return;
        };
        
        var $elem = this._getElem();
        var $currentElem = $elem.find('.n2DisplayRibbon_grid_current');
        var $extraElem = $elem.find('.n2DisplayRibbon_grid_extra');
        var $relatedElem = $elem.find('.n2DisplayRibbon_grid_related');
        
        var height = $elem.height();
        var width = $elem.width();
        
        var cellSizeOnHeight = height - (2 * this.cellPadding);
        if( cellSizeOnHeight < this.cellSizeMin ){
        	cellSizeOnHeight = this.cellSizeMin;
        };

        var cellSizeOnWidth = ((width - this.cellPadding) / this.numColumnMin) - this.cellPadding;
        if( cellSizeOnWidth < this.cellSizeMin ){
        	cellSizeOnWidth = this.cellSizeMin;
        };
        
        this.cellSize = Math.min(cellSizeOnHeight, cellSizeOnWidth);

        var duration = this.animationDuration;

        // Reset position of related div
		this.relatedOffset = 0;
		$elem.find('.n2DisplayRibbon_grid_related').css({
			left: this.relatedOffset
		}); 
        
        // Move the current and related div
    	var currentDivWidth = 0;
        if( this.currentTile ){
        	// Current tile is visible. Show div and
        	// shrink extra
        	currentDivWidth = this.cellSize + (2 * this.cellPadding);
        	$currentElem.css({
        		display: 'block'
        		,width: ''+currentDivWidth+'px'
        	});
        	$extraElem.css({
        		left: ''+currentDivWidth+'px'
        	});
        	
        	// Move current tile to current div
        	this.currentTile.resize(
        		{
        			width: this.cellSize
        			,height: this.cellSize
        			,x: this.cellPadding
        			,y: this.cellPadding
        		}
        		,true // animate
        		,duration
        		,undefined // onComplete
        		);
        	this.currentTile.appendTo($currentElem, false, 0, duration);
        	
        } else {
        	$currentElem.css({
        		display: 'none'
        	});
        	$extraElem.css({
        		left: '0px'
        	});
        };

	    // fade out all removed tiles
	    for(var i=0, e=this.removedTiles.length; i<e; ++i) {
	        var tile = this.removedTiles[i];
	        tile.remove(animate, duration);
	    }
	    this.removedTiles = [];
        
	    // Deal with related tiles
	    var currentLeft = this.cellPadding;
	    for(var i=0,e=this.relatedTiles.length; i<e; ++i){
	    	var tile = this.relatedTiles[i];
        	tile.resize(
        		{
        			width: this.cellSize
        			,height: this.cellSize
        			,x: currentLeft
        			,y: this.cellPadding
        		}
        		,true // animate
        		,duration
        		,undefined // onComplete
        		);
	    	tile.appendTo($relatedElem, false, 0, duration);
	    	
	    	currentLeft += (this.cellSize + this.cellPadding);
	    };
	    
	    this.relatedOffsetMin = width - currentDivWidth - currentLeft;
	    if( this.relatedOffsetMin > 0 ){
	    	this.relatedOffsetMin = 0;
	    };
	    this._updateRelatedOffset(this.relatedOffset);
        
	    if( typeof onComplete === 'function' ) {
	        setTimeout(function() { onComplete(true); }, duration + 10);
	    };
	},
	
	_shouldRedraw: function(){
		return true;
	},
	
	_buttonChanged: function(state, id){
		if( 'up' === state ){
			this.rateOfChangeEnd = true;
		} else {
			this.rateOfChangeEnd = false;
			if( 'next' === id ){
				this.rateOfChange = -250;
			} else {
				this.rateOfChange = 250;
			};
		};
	},
	
	_intervalTask: function(){
		var $elem = this._getElem();
		if( $elem.length < 1 ){
			// This grid is oo longer in use
			window.clearInterval(this.intervalId);
		} else {
			if( this.rateOfChange != 0 ){
				var newOffset = this.relatedOffset;
				
				newOffset += this.rateOfChange;
				
				this._updateRelatedOffset(newOffset);
				
				if( this.rateOfChangeEnd ){
					this.rateOfChange = 0;
				};
			};
		};
	},
	
	_updateRelatedOffset: function(newRelatedOffset){
		if( newRelatedOffset > 0 ){
			newRelatedOffset = 0;
		};
		if( newRelatedOffset < this.relatedOffsetMin ){
			newRelatedOffset = this.relatedOffsetMin;
		};
		
		if( newRelatedOffset != this.relatedOffset ){
			this.relatedOffset = newRelatedOffset;
			var $elem = this._getElem();
			var $related = $elem.find('.n2DisplayRibbon_grid_related');
			var cssChanges = {
				left: this.relatedOffset
			};
			$related.animate(cssChanges, {
	            duration: 300,
	            easing: 'linear'
	        });
		};
		
		var $elem = this._getElem();
		if( this.relatedOffset <= this.relatedOffsetMin ){
			$elem.addClass('n2DisplayRibbon_grid_related_max');
		} else {
			$elem.removeClass('n2DisplayRibbon_grid_related_max');
		};
		if( this.relatedOffset >= 0 ){
			$elem.addClass('n2DisplayRibbon_grid_related_min');
		} else {
			$elem.removeClass('n2DisplayRibbon_grid_related_min');
		};
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	}
});

// ===================================================================================

var RibbonDisplay = $n2.Class({
	
	documentSource: null,
	
	displayPanelName: null,
	
	showService: null,
	
	requestService: null,
	
	schemaRepository: null,
	
	customService: null,
	
	dispatchService: null,
	
	boolOptions: null,
	
	restrictAddRelatedButtonToLoggedIn: null,
	
	currentDetails: null,
	
	displayedDocumentsOrder: null,
	
	displayedDocuments: null,
	
	grid: null,
	
	createDocProcess: null,
	
	defaultSchema: null,
	
	relatedDocumentDiscoveryProcess: null,
	
	documentInfoFunction: null,
	
	sortFunction: null,
	
	filterFactory: null,
	
	filter: null,
	
	hoverInFn: null,
	
	hoverOutFn: null,

	clickFn: null,
	
	hoverDocId: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			documentSource: null
			,displayPanelName: null
			,showService: null
			,requestService: null
			,schemaRepository: null
			,customService: null
			,dispatchService: null
			,createDocProcess: null
			,displayRelatedInfoFunction: null
			
			// Boolean options
			,displayOnlyRelatedSchemas: false
			,displayBriefInRelatedInfo: false
			,restrictAddRelatedButtonToLoggedIn: false
			
			// Process used to discover related information from
			// a document
			,relatedDocumentDiscoveryProcess: null
			
			// Function to obtain document information structures based on
			// document ids
			,documentInfoFunction: null
			
			// Function to sort documents based on info structures
			,sortFunction: null
			
			// Factory to create filters
			,filterFactory: null
		},opts_);

		var _this = this;
		
		/*
			currentDetails = {
				// single document selection
				docId // document identifier
				doc // document content
				schema // schema associated with the document
				height // last detected content height for current document
				referenceDocIds // doc ids of related info
				
				// multiple document selection
				docIds // document identifiers
				docs // map of document contents by id
			}
		 */
		this.currentDetails = {};
		/*
		 	displayedDocuments = {
		 		<doc-id>: {
		 			id: <doc-id>
		 			,info: <info object>
		 			,doc: <content>
		 		}
		 	}
		 */
		this.displayedDocuments = {};
		/*
		 	Array of document ids
		 */
		this.displayedDocumentsOrder = null;
		
		this.documentSource = opts.documentSource;
		this.displayPanelName = opts.displayPanelName;
		this.showService = opts.showService;
		this.requestService = opts.requestService;
		this.schemaRepository = opts.schemaRepository;
		this.customService = opts.customService;
		this.dispatchService = opts.dispatchService;
		this.createDocProcess = opts.createDocProcess;
		
		// Initialize display
		this._getDisplayDiv();
		
		// Boolean options
		this.boolOptions = {
			displayOnlyRelatedSchemas: opts.displayOnlyRelatedSchemas
			,displayBriefInRelatedInfo: opts.displayBriefInRelatedInfo
		};
		this.restrictAddRelatedButtonToLoggedIn = opts.restrictAddRelatedButtonToLoggedIn;
		if( !this.restrictAddRelatedButtonToLoggedIn 
		 && this.customService ){
			this.restrictAddRelatedButtonToLoggedIn = 
				this.customService.getOption('restrictAddRelatedButtonToLoggedIn',false);
		};

		var dispatcher = this.dispatchService;
		if( dispatcher ) {
			var f = function(msg, addr, d){
				_this._handleDispatch(msg, addr, d);
			};
			dispatcher.register(DH, 'selected', f);
			dispatcher.register(DH, 'searchResults', f);
			dispatcher.register(DH, 'documentDeleted', f);
			dispatcher.register(DH, 'authLoggedIn', f);
			dispatcher.register(DH, 'authLoggedOut', f);
			dispatcher.register(DH, 'editClosed', f);
			dispatcher.register(DH, 'documentContent', f);
			dispatcher.register(DH, 'documentContentCreated', f);
			dispatcher.register(DH, 'documentContentUpdated', f);
		};
		
		if( !opts.displayRelatedInfoFunction ) {
			var flag = this._getBooleanOption('displayOnlyRelatedSchemas');
			if( flag ) {
				opts.displayRelatedInfoFunction = function(opts_){
					_this._displayRelatedInfo(opts_);
				};
			} else {
				opts.displayRelatedInfoFunction = function(opts_){
					_this._displayLinkedInfo(opts_);
				};
			};
		};
		
		// Related document discovery process
		this.relatedDocumentDiscoveryProcess = opts.relatedDocumentDiscoveryProcess;
		if( !this.relatedDocumentDiscoveryProcess 
		 && this.customService ){
			this.relatedDocumentDiscoveryProcess = 
				this.customService.getOption('relatedDocumentDiscoveryProcess',null);
		};
		if( !this.relatedDocumentDiscoveryProcess ){
			this.relatedDocumentDiscoveryProcess = new ReferenceRelatedDocumentDiscovery({
				documentSource: this.documentSource
			});
		};
		
		// Document info function
		this.documentInfoFunction = opts.documentInfoFunction;
		if( !this.documentInfoFunction 
		 && this.customService ){
			var docInfoFn = this.customService.getOption('displayDocumentInfoFunction');
			if( typeof docInfoFn === 'function' ){
				this.documentInfoFunction = docInfoFn;
			};
		};
		if( !this.documentInfoFunction ){
			this.documentInfoFunction = function(opts_){
				var opts = $n2.extend({
					docIds: null
					,display: null
					,onSuccess: function(docInfos){}
					,onError: function(err){}
				},opts_);
				
				var ds = opts.display.documentSource;
				ds.getDocumentInfoFromIds({
					docIds: opts.docIds
					,onSuccess: opts.onSuccess
					,onError: opts.onError
				});
			};
		};
		
		// Sort function
		this.sortFunction = opts.sortFunction;
		if( !this.sortFunction 
		 && this.customService ){
			var sortFn = this.customService.getOption('displaySortFunction');
			if( typeof sortFn === 'function' ){
				this.sortFunction = sortFn;
			};
		};
		if( !this.sortFunction ){
			this.sortFunction = function(infos){
				infos.sort(function(a,b){
					if( a.updatedTime && b.updatedTime ){
						if( a.updatedTime > b.updatedTime ){
							return -1;
						};
						if( a.updatedTime < b.updatedTime ){
							return 1;
						};
					};

					if( a.id > b.id ){
						return -1;
					};
					if( a.id < b.id ){
						return 1;
					};
					
					return 0;
				});
			};
		};
		
		// Filter factory
		this.filterFactory = opts.filterFactory;
		if( !this.filterFactory 
		 && this.customService ){
			var factory = this.customService.getOption('displayFilterFactory');
			if( factory && typeof factory.get === 'function' ){
				this.filterFactory = factory;
			};
		};
		if( !this.filterFactory ){
			this.filterFactory = new SchemaFilterFactory({
				schemaRepository: this.schemaRepository
			});
		};
		
		// Hover in and out
		this.hoverInFn = function(){
			var $tile = $(this);
			_this._hoverInTile($tile);
			return false;
		};
		this.hoverOutFn = function(){
			var $tile = $(this);
			_this._hoverOutTile($tile);
			return false;
		};
		
		// Click function
		this.clickFn = function(){
			var $tile = $(this);
			_this._clickedTile($tile);
			return false;
		};
		
		// Detect changes in displayed current content size
		var intervalID = window.setInterval(function(){
			var $set = _this._getDisplayDiv();
			if( $set.length < 0 ) {
				window.clearInterval(intervalID);
			} else {
				_this._performIntervalTask();
			};
		}, 500);

		$('body').addClass('n2_display_format_ribbon');
		
		$n2.log('DisplayRibbon',this);
	},

	// external
	setSchema: function(schema) {
		this.defaultSchema = schema;
	},
	
	_handleDispatch: function(msg, addr, dispatcher){
		var $div = this._getDisplayDiv();
		if( $div.length < 1 ){
			// No longer displaying. Un-register this event.
			dispatcher.deregister(addr);
			return;
		};
		
		// Selected document
		if( msg.type === 'selected' ) {
			if( msg.doc ) {
				this._displayDocument(msg.doc._id, msg.doc);
				
			} else if( msg.docId ) {
				this._displayDocument(msg.docId, null);
				
			} else if( msg.docs ) {
				var ids = [];
				for(var i=0, e=msg.docs.length; i<e; ++i){
					ids.push( msg.docs[i]._id );
				};
				this._displayMultipleDocuments(ids, msg.docs);
				
			} else if( msg.docIds ) {
				this._displayMultipleDocuments(msg.docIds, null);
			};
			
		} else if( msg.type === 'searchResults' ) {
			this._displaySearchResults(msg.results);
			
		} else if( msg.type === 'documentDeleted' ) {
	//		var docId = msg.docId;
	//		this._handleDocumentDeletion(docId);
			
		} else if( msg.type === 'authLoggedIn' 
			|| msg.type === 'authLoggedOut' ) {
			
			// Redisplay buttons
			if( this.currentDetails 
			 && this.currentDetails.docId 
			 && this.currentDetails.doc ){
				this._receiveDocumentContent(this.currentDetails.doc);
				this._displayDocumentButtons(this.currentDetails.doc, this.currentDetails.schema);
			};
			
		} else if( msg.type === 'editClosed' ) {
			var deleted = msg.deleted;
			if( !deleted ) {
				var doc = msg.doc;
				if( doc ) {
					this._displayDocument(doc._id, doc);
				};
			};
			
		} else if( msg.type === 'documentContent' ) {
			this._receiveDocumentContent(msg.doc);
			
		} else if( msg.type === 'documentContentCreated' ) {
			this._receiveDocumentContent(msg.doc);
			
		} else if( msg.type === 'documentContentUpdated' ) {
			this._receiveDocumentContent(msg.doc);
		};
	},
	
	_displayDocument: function(docId, doc) {
	
	//	var _this = this;
		
		this._reclaimDisplayDiv();
		
		if( this.currentDetails
		 && this.currentDetails.docId === docId ){
			// Already in process of displaying this document
			return;
		};
		
		this.currentDetails = {
			docId: docId
		};
	
		this._addDisplayedDocument(docId, doc);
	
		var $set = this._getDisplayDiv();
	
		var $current = $set.find('.n2DisplayRibbon_info');
		$current.hide();
	
		this._adjustCurrentTile(docId);
		
		// Request document
		if( doc ){
			this._receiveDocumentContent(doc);
		} else {
			this._requestDocumentWithId(docId);
		};
	},
	
	/*
	 * Accepts search results and display them in tiled mode
	 */
	_displaySearchResults: function(results){
		
		this._reclaimDisplayDiv();
		
		var ids = [];
		if( results && results.sorted && results.sorted.length ) {
			for(var i=0,e=results.sorted.length; i<e; ++i){
				ids.push(results.sorted[i].id);
			};
		};
		
		this._displayMultipleDocuments(ids, null);
		
		if( ids.length < 1 ){
			var $set = this._getDisplayDiv();
			var $current = $set.find('.n2DisplayRibbon_info');
			$current
				.text( _loc('Empty search results') )
				.show();
		};
	},
	
	/*
	 * Displays multiple documents
	 */
	_displayMultipleDocuments: function(ids, docs){
		
		this._reclaimDisplayDiv();
	
		var $set = this._getDisplayDiv();
		var $current = $set.find('.n2DisplayRibbon_info');
		$current.hide();
		
		this.currentDetails = {
			docIds: ids
			,docs: {}
		};
		
		this._adjustCurrentTile(null);
		
		var docsById = {};
		if( docs ){
			for(var i=0,e=docs.length; i<e; ++i){
				var doc = docs[i];
				this.currentDetails.docs[doc._id] = doc;
				docsById[doc._id] = doc;
			};
		};
	
		this._changeDisplayedDocuments(ids, docsById);
	},
	
	_displayDocumentButtons: function(doc, schema){
		
		var _this = this;
		
		if( doc 
		 && doc._id 
		 && this.currentDetails.docId === doc._id ){
			var $set = this._getDisplayDiv();
			var $btnDiv = $set.find('.n2DisplayRibbon_current_buttons')
				.empty();
	
	 		// 'edit' button
	 		if( $n2.couchMap.canEditDoc(doc) ) {
	 			$('<a href="#"></a>')
	 				.addClass('n2DisplayRibbon_current_button n2DisplayRibbon_current_button_edit')
	 				.text( _loc('Edit') )
	 				.appendTo($btnDiv)
	 				.click(function(){
						_this._performDocumentEdit(doc);
						return false;
					});
	 		};
	
	 		// Show 'delete' button
	 		if( $n2.couchMap.canDeleteDoc(doc) ) {
	 			$('<a href="#"></a>')
	 				.addClass('n2DisplayRibbon_current_button n2DisplayRibbon_current_button_delete')
	 				.text( _loc('Delete') )
	 				.appendTo($btnDiv)
	 				.click(function(){
						_this._performDocumentDelete(doc);
						return false;
					});
	 		};
	
	 		// 'add related' button
			if( schema
			 && schema.relatedSchemaNames 
			 && schema.relatedSchemaNames.length
			 ) {
				var showAddRelatedButton = true;
				if( this.restrictAddRelatedButtonToLoggedIn ){
					var isLoggedIn = false;
	
					if( this.dispatchService ){
						var m = {
							type: 'authIsLoggedIn'
							,isLoggedIn: false
						};
						this.dispatchService.synchronousCall(DH,m);
						isLoggedIn = m.isLoggedIn;
					};
					
					if( !isLoggedIn ){
						showAddRelatedButton = false;
					};
				};
				
				if( showAddRelatedButton ) {
					var $placeHolder = $('<span>')
						.appendTo($btnDiv);
					this.createDocProcess.insertAddRelatedSelection({
						placeHolderElem: $placeHolder
						,doc: doc
						,onElementCreated: function($elem){
							$elem.addClass('n2DisplayRibbon_current_button n2DisplayRibbon_current_button_add_related_item');
						}
					});
				}; // show button
			};
			
	 		// Show 'find on map' button
			if( this.dispatchService 
			 && this.dispatchService.isEventTypeRegistered('findIsAvailable')
			 && this.dispatchService.isEventTypeRegistered('find')
			 ) {
				// Check if document can be displayed on a map
				var showFindOnMapButton = false;
				var m = {
					type: 'findIsAvailable'
					,doc: doc
					,isAvailable: false
				};
				this.dispatchService.synchronousCall(DH,m);
				if( m.isAvailable ){
					showFindOnMapButton = true;
				};
	
				if( showFindOnMapButton ) {
					$('<a href="#"></a>')
						.addClass('n2DisplayRibbon_current_button n2DisplayRibbon_current_button_find_on_map')
		 				.text( _loc('Find on Map') )
		 				.appendTo($btnDiv)
		 				.click(function(){
		 					_this._dispatch({
		 						type: 'find'
	 							,docId: doc._id
	 							,doc: doc
	 						});
							return false;
						});
				};
			};
	
			// Show 'Add Layer' button
			if( doc
			 && doc.nunaliit_layer_definition
			 && this.dispatchService
			 && this.dispatchService.isEventTypeRegistered('addLayerToMap')
			 ) {
				$('<a href="#"></a>')
					.addClass('n2DisplayRibbon_current_button n2DisplayRibbon_current_button_add_layer')
	 				.text( _loc('Add Layer') )
	 				.appendTo($btnDiv)
	 				.click(function(){
	 					_this._performAddLayerToMap(doc);
						return false;
					});
			};
	
			// Show 'Tree View' button
			if( doc ) {
				$('<a href="#"></a>')
					.addClass('n2DisplayRibbon_current_button n2DisplayRibbon_current_button_tree_view')
	 				.text( _loc('Tree View') )
	 				.appendTo($btnDiv)
	 				.click(function(){
	 					_this._performTreeView(doc);
						return false;
					});
			};
		};
	},
	
	_currentDocReferencesUpdated: function(){
		if( this.currentDetails 
		 && this.currentDetails.doc 
		 && this.currentDetails.referenceDocIds ){
			// Accumulate all references
			var refDocIds = {};
			for(var i=0, e=this.currentDetails.referenceDocIds.length; i<e; ++i){
				var linkDocId = this.currentDetails.referenceDocIds[i];
				refDocIds[linkDocId] = true;
			};
			
			// Figure out information that must be removed
			var idsToRemove = [];
			for(var docId in this.displayedDocuments){
				if( docId === this.currentDetails.docId ) {
					// OK
				} else if( !refDocIds[docId] ){
					idsToRemove.push(docId);
				};
			};
			for(var i=0,e=idsToRemove.length; i<e; ++i){
				this._removeDisplayedDocument(idsToRemove[i]);
			};
			
			// Add new ones
			for(var docId in refDocIds){
				this._addDisplayedDocument(docId);
			};
			
			// Use dynamic sorting
			this.displayedDocumentsOrder = null;
	
			// Perform updates
			this._updateDisplayedDocuments();
		};
	},
	
	/*
	 * Verify information found in the instance variable displayedDocuments
	 * and affect the displaying accordingly
	 */
	_updateDisplayedDocuments: function(){
		var _this = this;
		
		// Get all the required info
		var neededInfoIds = [];
		for(var docId in this.displayedDocuments){
			if( !this.displayedDocuments[docId].info ) {
				neededInfoIds.push(docId);
			};
		};
		if( neededInfoIds.length > 0 ) {
			this.documentInfoFunction({
				docIds: neededInfoIds
				,display: this
				,onSuccess: function(docInfos){
					for(var i=0, e=docInfos.length; i<e; ++i){
						var docInfo = docInfos[i];
						var docId = docInfo.id;
						if( _this.displayedDocuments[docId] ){
							_this.displayedDocuments[docId].info = docInfo;
						};
					};
					performUpdate();
				}
				,onError: function(errorMsg){
					$n2.log('Unable to obtain document information',errorMsg);
				}
			});
		} else {
			performUpdate();
		};
	
		function performUpdate() {
			// Ensure we have display
			_this._getDisplayDiv();
	
			// Sort
			var currentDocId = null;
			var sortedDocIds = null;
			if( _this.displayedDocumentsOrder ){
				sortedDocIds = _this.displayedDocumentsOrder;
	
				var infos = [];
				for(var i=0,e=sortedDocIds.length; i<e; ++i){
					var docId = sortedDocIds[i];
					if( _this.displayedDocuments[docId] 
					 && _this.displayedDocuments[docId].info ){
						infos.push( _this.displayedDocuments[docId].info );
					};
				};
				
				_this.filter.display(infos,_this);
				infos = _this.filter.filter(infos,_this);
	
				sortedDocIds = [];
				for(var i=0,e=infos.length; i<e; ++i){
					var info = infos[i];
					sortedDocIds.push(info.id);
				};
				
			} else {
				var infos = [];
				for(var docId in _this.displayedDocuments){
					if( _this.displayedDocuments[docId].info ){
						infos.push( _this.displayedDocuments[docId].info );
					};
				};
	
				_this.filter.display(infos,_this);
				infos = _this.filter.filter(infos,_this);
				
				_this.sortFunction(infos);
	
				var alreadySorted = {};
				sortedDocIds = [];
				if( _this.currentDetails
				 && _this.currentDetails.docId ){
					currentDocId = _this.currentDetails.docId;
					alreadySorted[_this.currentDetails.docId] = true;
				};
				
				for(var i=0,e=infos.length; i<e; ++i){
					var docId = infos[i].id;
					
					// Remove duplicates
					if( !alreadySorted[docId] ) {
						sortedDocIds.push(docId);
						alreadySorted[docId] = true;
					};
				};
			};
			
			_this.grid.updateTiles(currentDocId, sortedDocIds);
			_this.grid.isDirty = true; // force redraw to reflect change in order
	        _this.grid.redraw(true);
	
	        // Request content for documents
	        if( currentDocId ){
	        	_this._requestDocumentWithId(currentDocId);
	        };
			for(var i=0,e=sortedDocIds.length; i<e; ++i){
				var docId = sortedDocIds[i];
				_this._requestDocumentWithId(docId);
			};
		};
	},
	
	/*
	 * Changes the list of displayed documents
	 */
	_changeDisplayedDocuments: function(docIds, docsById){
		var displayDocsByIds = {};
		for(var i=0,e=docIds.length; i<e; ++i){
			var docId = docIds[i];
			displayDocsByIds[docId] = true;
		};
		
		for(var docId in this.displayedDocuments){
			if( !displayDocsByIds[docId] ){
				this._removeDisplayedDocument(docId);
			};
		};
		
		for(var i=0,e=docIds.length; i<e; ++i){
			var docId = docIds[i];
			var doc = null;
			if( docsById && docsById[docId] ){
				doc = docsById[docId];
			};
			
			this._addDisplayedDocument(docId, doc);
		};
		
		this.displayedDocumentsOrder = docIds;
		
		this._updateDisplayedDocuments();
	},
	
	/*
	 * This function adds a new document to be displayed among the related items
	 * of the display. _updateDisplayedDocuments should be called, next.
	 */
	_addDisplayedDocument: function(docId, doc){
		if( !this.displayedDocuments[docId] ){
			this.displayedDocuments[docId] = {
				id: docId
			};
		};
		
		if( doc ){
			this.displayedDocuments[docId].doc = doc;
		};
	},
	
	/*
	 * This function removes the information relating to the document
	 * associated with the given document id. _updateDisplayedDocuments
	 * should be called, next.
	 */
	_removeDisplayedDocument: function(docId){
		// Remove information
		if( this.displayedDocuments[docId] ){
			delete this.displayedDocuments[docId];
		};
	},
	
	_receiveDocumentContent: function(doc){
		var _this = this;
	
		var $set = this._getDisplayDiv();
		
		var docId = doc._id;
		if( this.displayedDocuments[docId] ){
			// We are interested in this document. Save the content
			this.displayedDocuments[docId].doc = doc;
		};
	
		// Currently displayed document?
		if( doc._id === this.currentDetails.docId ){
			
			var update = false;
			
			if( !this.currentDetails.doc ) {
				// We do not yet have the content of the current document
				this.currentDetails.doc = doc;
				update = true;
				
			} else {
				// We already have the content. Check for update.
				
				if( doc._rev !== this.currentDetails.doc._rev ) {
					this.currentDetails.doc = doc;
					update = true;
				};
			};
			
			if( update ){
				// Renew related document ids
				this.relatedDocumentDiscoveryProcess.getRelatedDocumentIds({
					doc: doc
					,onSuccess: function(doc, refDocIds){
						if( _this.currentDetails.docId === doc._id ){
							_this.currentDetails.referenceDocIds = refDocIds;
							_this._currentDocReferencesUpdated();
						};
					}
					,onError: function(err){
						$n2.log('Error obtaining reference ids',err);
					}
				});
			};
		};
		
		// Display brief associated with the document
		var waitClassName = 'n2DisplayRibbon_wait_brief_' + $n2.utils.stringToHtmlId(docId);
		$set.find('.'+waitClassName).each(function(){
			var $div = $(this);
			if( _this.showService ) {
				_this.showService.displayBriefDescription($div, {}, doc);
			};
			$div.removeClass(waitClassName);
		});
		
		// Display full document for currently selected document
		var waitClassName = 'n2DisplayRibbon_wait_current_' + $n2.utils.stringToHtmlId(docId);
		var buttonClassName = 'n2DisplayRibbon_current_buttons_' + $n2.utils.stringToHtmlId(docId);
		$set.find('.'+waitClassName).each(function(){
			var $div = $(this)
				.empty();
	
			$('<div>')
				.addClass('n2DisplayRibbon_current_buttons')
				.addClass(buttonClassName)
				.appendTo($div);			
	
			var $content = $('<div>')
				.appendTo($div);
			if( _this.showService ) {
				_this.showService.displayDocument($content, {}, doc);
			} else {
				$content.text( doc._id );
			};
			
			$div.removeClass(waitClassName);
		});
		
		// Refresh buttons
		$('.'+buttonClassName).each(function(){
			var $div = $(this);
			
			_this._displayDocumentButtons(doc, _this.currentDetails.schema);
		});
		
		// Set tile classes based on media associated with document, and schema name
		var includesImage = false;
		var includesAudio = false;
		var includesVideo = false;
		var thumbnailName = null;
		var schemaName = null;
		if( doc.nunaliit_attachments 
		 && doc.nunaliit_attachments.files ){
			for(var attName in doc.nunaliit_attachments.files){
				var att = doc.nunaliit_attachments.files[attName];
				if( att.source ) {
					// discount thumbnails
				} else {
					if( 'image' === att.fileClass ) {
						includesImage = true;
					} else if( 'audio' === att.fileClass ) {
						includesAudio = true;
					} else if( 'video' === att.fileClass ) {
						includesVideo = true;
					};
					if( att.thumbnail ){
						thumbnailName = att.thumbnail;
					};
				};
			};
		};
		if( doc.nunaliit_schema ){
			schemaName = doc.nunaliit_schema;
		};
		$set.find('.n2DisplayRibbon_tile_' + $n2.utils.stringToHtmlId(docId)).each(function(){
			var $tile = $(this);
			
			$tile.removeClass('n2DisplayRibbon_tile_image n2DisplayRibbon_tile_audio n2DisplayRibbon_tile_video');
			if(includesVideo){
				$tile.addClass('n2DisplayRibbon_tile_video');
			} else if(includesAudio){
				$tile.addClass('n2DisplayRibbon_tile_audio');
			} else if(includesImage){
				$tile.addClass('n2DisplayRibbon_tile_image');
			};
			
			if( schemaName ){
				$tile.addClass('n2DisplayRibbon_tile_schema_'+$n2.utils.stringToHtmlId(schemaName));
			};
		});
		if( thumbnailName ){
			// Check that thumbnail is attached
			if( doc.nunaliit_attachments.files[thumbnailName]
			 && doc.nunaliit_attachments.files[thumbnailName].status === 'attached' ){
				// OK
			} else {
				thumbnailName = null;
			};
		};
		if( thumbnailName ){
			var url = this.documentSource.getDocumentAttachmentUrl(doc,thumbnailName);
			if( url ){
				$set.find('.n2DisplayRibbon_wait_thumb_' + $n2.utils.stringToHtmlId(docId)).each(function(){
					var $div = $(this);
					$div.empty();
					$('<img>')
						.attr('src',url)
						.appendTo($div);
				});
			};
		};
		
	
		// Obtain the schema associated with the document
		if( doc.nunaliit_schema 
		 && this.schemaRepository ){
			this.schemaRepository.getSchema({
				name: doc.nunaliit_schema
				,onSuccess: function(schema){
					schemaLoaded(doc, schema);
				}
				,onError: function(err){
					schemaLoaded(doc, null);
				}
			});
		} else {
			schemaLoaded(doc, null);
		};
		
		// Check if the given document contains links to the currently
		// displayed document
		if( this.currentDetails.doc 
		 && doc._id !== this.currentDetails.docId ){
			
			this.relatedDocumentDiscoveryProcess.areDocumentsRelated({
				selectedDoc: this.currentDetails.doc
				,relatedDoc: doc
				,onRelated: function(selectedDoc, relatedDoc){
					// Check validity of callback
					if( selectedDoc._id === _this.currentDetails.docId ){
						var refIndex = -1;
						if( _this.currentDetails.referenceDocIds ) {
							refIndex = _this.currentDetails.referenceDocIds.indexOf(doc._id);
						};
						
						if( refIndex < 0 ) {
							// The previous time we saw this document, there were no reference to the
							// currently displayed document. Now, this new version of the document
							// contains a reference to the displayed document. Add reference and
							// re-display.
							if( !_this.currentDetails.referenceDocIds ){
								_this.currentDetails.referenceDocIds = [];
							};
							_this.currentDetails.referenceDocIds.push(doc._id);
							_this._currentDocReferencesUpdated();
						};
					};
				}
				,onNotRelated: function(selectedDoc, relatedDoc){
					// Check validity of callback
					if( selectedDoc._id === _this.currentDetails.docId ){
						var refIndex = -1;
						if( _this.currentDetails.referenceDocIds ) {
							refIndex = _this.currentDetails.referenceDocIds.indexOf(doc._id);
						};
	
						if( refIndex >= 0 ) {
							// The previous time we saw this document, it had a reference to the
							// currently displayed document. Now, this reference is no longer there.
							// Remove the reference and redisplay
							_this.currentDetails.referenceDocIds.splice(refIndex,1);
							_this._currentDocReferencesUpdated();
						};
					};
				}
				,onError: function(err){
					$n2.log('Error in displayTiled. Unable to check relation.',err);
				}
			});
		};
		
		function schemaLoaded(doc, schema){
			if( _this.currentDetails.docId === doc._id ){
				// This is the schema associated with the current
				// document.
				if( schema && !_this.currentDetails.schema ){
					_this.currentDetails.schema = schema;
					_this._displayDocumentButtons(doc, schema);
					
				} else if( _this.currentDetails.schema && !schema ) {
					_this.currentDetails.schema = null;
					_this._displayDocumentButtons(doc, null);
				
				} else if( _this.currentDetails.schema 
				 && schema
				 && _this.currentDetails.schema.name !== schema.name
				 ) {
					// Schema is changed
					_this.currentDetails.schema = schema;
					_this._displayDocumentButtons(doc, schema);
				};
			};
		};
	},
	
	/*
	 * Initiates the editing of a document
	 */
	_performDocumentEdit: function(doc){
		var _this = this;
		
		this.documentSource.getDocument({
			docId: doc._id
			,onSuccess: function(doc){
				_this._dispatch({
					type: 'editInitiate'
					,doc: doc
				});
			}
			,onError: function(errorMsg){
				$n2.log('Unable to load document: '+errorMsg);
			}
		});
	},
	
	/*
	 * Initiates the deletion of a document
	 */
	_performDocumentDelete: function(doc){
		if( confirm( _loc('You are about to delete this document. Do you want to proceed?') ) ) {
			this.documentSource.deleteDocument({
				doc: doc
				,onSuccess: function() {}
			});
		};
	},
	
	/*
	 * Initiates the 'Add Layer to Map' action for the button
	 */
	_performAddLayerToMap: function(doc){
		var layerDefinition = doc.nunaliit_layer_definition;
		var layerId = layerDefinition.id;
		if( !layerId ){
			layerId = doc._id;
		};
		var layerDef = {
			name: layerDefinition.name
			,type: 'couchdb'
			,options: {
				layerName: layerId
				,documentSource: this.documentSource
			}
		};
		
		this._dispatch({
			type: 'addLayerToMap'
			,layer: layerDef
			,options: {
				setExtent: {
					bounds: layerDefinition.bbox
					,crs: 'EPSG:4326'
				}
			}
		});
	},
	
	/*
	 * Opens a tree view dialog
	 */
	_performTreeView: function(doc){
		new $n2.couchDisplay.TreeDocumentViewer({
			doc: doc
		});
	},
	
	/*
	 * This function should be called before any displaying is performed.
	 * This ensures that the div element in use still contains the required
	 * elements for performing display.
	 */
	_reclaimDisplayDiv: function() {
		var _this = this;
		
		var $set = this._getDisplayDiv();
		
		var $filters = $set.find('.n2DisplayRibbon_filters');
		var $buttons = $set.find('.n2DisplayRibbon_buttons');
		var $current = $set.find('.n2DisplayRibbon_info');
		var $docs = $set.find('.n2DisplayRibbon_documents');
		if( $filters.length < 1
		 || $buttons.length < 1 
		 || $current.length < 1
		 || $docs.length < 1 ){
			$set.empty();
			$filters = $('<div>')
				.addClass('n2DisplayRibbon_filters')
			$buttons = $('<div>')
				.addClass('n2DisplayRibbon_buttons')
				.appendTo($set);
			$current = $('<div>')
				.addClass('n2DisplayRibbon_info')
				.appendTo($set);
			$docs = $('<div>')
				.addClass('n2DisplayRibbon_documents')
				.appendTo($set);
			
			// When the side panel must be re-claimed, then we must
			// forget what is currently displayed since it has to be
			// re-computed
			this.currentDetails = {};
			
			// Create grid
			this.grid = new RibbonGrid($docs);
			this.grid.createTile = function(docId) {
				return _this._createTile(docId);
		    };
		    
			// Create document filter
		    this.filter = this.filterFactory.get($filters,function(){
		    	_this._documentFilterChanged();
		    });
		    		    
		    // Create navigation buttons
		    new $n2.widgetNavigation.NavigationWidget({
				elem: $buttons
				,dispatchService: this.dispatchService
		    });
		};
	},
	
	_createTile: function(docId){
        var $elem = $('<div>')
	    	.addClass('n2DisplayRibbon_tile')
	    	.addClass('n2DisplayRibbon_tile_' + $n2.utils.stringToHtmlId(docId))
	    	.attr('n2DocId',docId);
	    
	    $elem.hover(
			this.hoverInFn
			,this.hoverOutFn
	    );
		
		$elem.click(this.clickFn);
	
	    var tile = new Tile(docId, $elem);
	    
	    if( this.currentDetails
	     && this.currentDetails.docId === docId ){
	    	// Current document
	    	$elem.addClass('n2DisplayRibbon_tile_current');
	    	this._generateCurrentDocumentContent($elem, docId);
	
	    } else {
	    	// Not current document
	    	$elem.removeClass('n2DisplayRibbon_tile_current');
	    	this._generateRelatedDocumentContent($elem, docId);
	    };

	    return tile;
	},
	
	_clickedTile: function($tile){
		var docId = $tile.attr('n2DocId');
		
		if( this.currentDetails
		 && this.currentDetails.docId === docId ){
//			var $menu = $tile.find('.n2DisplayRibbon_tile_menu');
//			if( $menu.length < 1 ){
//				$menu = $('<div>')
//					.addClass('n2DisplayRibbon_tile_menu n2DisplayRibbon_current_buttons')
//					.appendTo($tile);
//				
//				if( this.currentDetails 
//				 && this.currentDetails.doc 
//				 && this.currentDetails.schema ){
//					this._displayDocumentButtons(this.currentDetails.doc, this.currentDetails.schema);
//				};
//			};
			
			this._showCurrentPopUp();
			
		} else {
			// Related tile, select document
			this._dispatch({
				type:'userSelect'
				,docId: docId
			});
		};
	},
	
	_hoverInTile: function($tile){
		var docId = $tile.attr('n2DocId');
		if( docId && docId !== this.hoverDocId ) {
			this.hoverDocId = docId;
			this._dispatch({
				type: 'userFocusOn'
				,docId: docId
			});
		};
	},
	
	_hoverOutTile: function($tile){
		var docId = $tile.attr('n2DocId');
		if( docId && docId === this.hoverDocId ) {
			this.hoverDocId = null;
			this._dispatch({
				type: 'userFocusOff'
				,docId: docId
			});
		};
		
		$tile.find('.n2DisplayRibbon_tile_menu').remove();
	},
	
	_showCurrentPopUp: function(){
		if( this.currentDetails
		 && this.currentDetails.docId ){
			var docId = this.currentDetails.docId;
	    	var tileClass = '.n2DisplayRibbon_tile_' + $n2.utils.stringToHtmlId(docId);

	    	var $display = this._getDisplayDiv();
	    	var $tile = $display.find(tileClass);

	    	if( $tile.length > 0 ){
	    		// Look if pop-up is already showing
	    		var $popup = $tile.find('.n2DisplayRibbon_popup');
	    		if( $popup.length < 1 ){
	    			$popup = $('<div>')
	    				.addClass('n2DisplayRibbon_popup')
	    				.appendTo($tile);
	    			
	    			this._populateCurrentPopUp(docId, $popup);
	    		} else {
	    			// Toggle off
	    			$popup.remove();
	    		};
	    	};
		};
	},
	
	_hideCurrentPopUp: function(){
    	var $display = this._getDisplayDiv();
		$display.find('.n2DisplayRibbon_popup').remove();
	},
	
	_populateCurrentPopUp: function(docId, $popup){
		var _this = this;
		
		var $layout = $('<div>')
			.addClass('n2DisplayRibbon_popup_layout')
			.appendTo($popup);
		var $container = $('<div>')
			.addClass('n2DisplayRibbon_popup_container')
			.appendTo($layout);
		
		var $content = $('<div>')
			.addClass('n2DisplayRibbon_popup_content')
			.appendTo($container);

		if( this.showService ) {
			this.showService.printDocument($content, docId);
		} else {
			$content.text( docId );
		};

		var $buttons = $('<div>')
			.addClass('n2DisplayRibbon_popup_buttons')
			.appendTo($container);
		
		$('<a>')
			.attr('href','#')
			.addClass('n2DisplayRibbon_popup_button n2DisplayRibbon_popup_button_close')
			.text( _loc('Close') )
			.click(function(){
				var $a = $(this);
				$a.parents('.n2DisplayRibbon_popup').first().remove();
				return false;
			})
			.appendTo($buttons);
	},
	
	/*
	 * Goes over all the tiles and remove the class 'n2DisplayRibbon_tile_current'
	 * to from tiles that should not have it. Also, it adds the class to the tile
	 * that should have it, if it exists.
	 * 
	 * When adding and removing the class, adjust the content accordingly.
	 */
	_adjustCurrentTile: function(docId){
		var _this = this;
		
		var $set = this._getDisplayDiv();
		var $docs = $set.find('.n2DisplayRibbon_documents');
		
		var targetClass = null;
		if( docId ){
			targetClass = 'n2DisplayRibbon_tile_' + $n2.utils.stringToHtmlId(docId);
		};
		
		// Remove
		$docs.find('.n2DisplayRibbon_tile_current').each(function(){
			var $elem = $(this);
			if( targetClass && $elem.hasClass(targetClass) ) {
				// That's OK. Leave it
			} else {
				$elem.removeClass('n2DisplayRibbon_tile_current');
				var id = $elem.attr('n2DocId');
				_this._generateRelatedDocumentContent($elem, id);
			};
		});
		
		// Add
		if( targetClass ) {
			$docs.find('.'+targetClass).each(function(){
				var $elem = $(this);
				if( $elem.hasClass('n2DisplayRibbon_tile_current') ) {
					// That's OK. Leave it
				} else {
					$elem.addClass('n2DisplayRibbon_tile_current');
					var id = $elem.attr('n2DocId');
					_this._generateCurrentDocumentContent($elem, id);
				};
			});
		};
	},
	
	_getDisplayDiv: function(){
		var divId = this.displayPanelName;
		return $('#'+divId);
	},
	
	_dispatch: function(m){
		var dispatcher = this.dispatchService;
		if( dispatcher ) {
			dispatcher.send(DH,m);
		};
	},
	
	/*
	 * Get a boolean option based on a name and return it. Defaults
	 * to false. If the option is found set in either the options map
	 * or the custom service, then the result is true.
	 */
	_getBooleanOption: function(optionName){
		var flag = false;
		
		if( this.boolOptions[optionName] ){
			flag = true;
		};
		
		var cs = this.customService;
		if( cs && !flag ){
			var o = cs.getOption(optionName);
			if( o ){
				flag = true;
			};
		};
		
		return flag;
	},
	
	/*
	 * Look at documents stored in display code and return if one
	 * found with the correct identifier.
	 */
	_getCachedDocumentFromId: function(docId){
		if( this.displayedDocuments 
		 && this.displayedDocuments[docId]
		 && this.displayedDocuments[docId].doc ){
			return this.displayedDocuments[docId].doc;
		};
		
		if( this.currentDetails 
		 && this.currentDetails.docId === docId 
		 && this.currentDetails.doc ){
			return this.currentDetails.doc;
		};
		
		return null;
	},
	
	/*
	 * Given a document identifier, request the document content.
	 */
	_requestDocumentWithId: function(docId){
		// Look internally, first
		var doc = this._getCachedDocumentFromId(docId);
		if( doc ){
			this._receiveDocumentContent(doc);
			return;
		};
		
		if( this.requestService ){
			this.requestService.requestDocument(docId);
		};
	},
	
	_generateCurrentDocumentContent: function($elem, docId){
		$elem.empty();

		var $container = $('<div>')
	    	.addClass('n2DisplayRibbon_tile_container')
	    	.appendTo($elem);
		
		$('<div>')
			.addClass('n2DisplayRibbon_thumb n2DisplayRibbon_wait_thumb_' + $n2.utils.stringToHtmlId(docId))
			.appendTo($container);
		
		$('<div>')
			.addClass('n2DisplayRibbon_wait_brief_' + $n2.utils.stringToHtmlId(docId))
			.addClass('n2DisplayRibbon_tile_brief')
			.text(docId)
			.appendTo($container);
	},
	
	_generateRelatedDocumentContent: function($elem, docId){
		var _this = this;
		
		$elem.empty();
	    
	    var $container = $('<div>')
	    	.addClass('n2DisplayRibbon_tile_container')
	    	.appendTo($elem);
		
		$('<div>')
			.addClass('n2DisplayRibbon_thumb n2DisplayRibbon_wait_thumb_' + $n2.utils.stringToHtmlId(docId))
			.appendTo($container);
		
		$('<div>')
			.addClass('n2DisplayRibbon_wait_brief_' + $n2.utils.stringToHtmlId(docId))
			.addClass('n2DisplayRibbon_tile_brief')
			.text(docId)
			.appendTo($container);
	},
	
	_performIntervalTask: function(){
		var $set = this._getDisplayDiv();
		var $docs = $set.find('.n2DisplayRibbon_documents');
	
//		if( this.currentDetails
//		 && this.currentDetails.docId ){
//			var $currentTile = $docs.find('.n2DisplayRibbon_tile_current')
//				.find('.n2DisplayRibbon_tile_content');
//			if( $currentTile.length > 0 ){
//				var height = $currentTile.height();
//				if( height != this.currentDetails.height ){
//					this.currentDetails.height = height;
//					var cellSize = this.grid.cellSize;
//					this.grid.template = null;
//					this.grid.templateFactory = new GridTemplateDocument(height,cellSize);
//					this.grid.redraw(true);
//				};
//			};
//		};
	},
	
	_documentFilterChanged: function(){
		this._updateDisplayedDocuments();
	}
});

//===================================================================================
function HandleDisplayAvailableRequest(m){
	if( m.displayType === 'ribbon' ){
		m.isAvailable = true;
	};
};

function HandleDisplayRenderRequest(m){
	if( m.displayType === 'ribbon' ){
		var options = {};
		if( m.displayOptions ){
			for(var key in m.displayOptions){
				options[key] = m.displayOptions[key];
			};
		};
		
		options.documentSource = m.config.documentSource;
		options.displayPanelName = m.displayId;
		options.showService = m.config.directory.showService;
		options.createDocProcess = m.config.directory.createDocProcess;
		options.requestService = m.config.directory.requestService;
		options.schemaRepository = m.config.directory.schemaRepository;
		options.customService = m.config.directory.customService;
		options.dispatchService = m.config.directory.dispatchService;
		
		var displayControl = new RibbonDisplay(options);

		m.onSuccess();
	};
};

//===================================================================================

// Exports
$n2.displayRibbon = {
	RibbonDisplay: RibbonDisplay
	,HandleDisplayAvailableRequest: HandleDisplayAvailableRequest
	,HandleDisplayRenderRequest: HandleDisplayRenderRequest
};

})(jQuery,nunaliit2);
