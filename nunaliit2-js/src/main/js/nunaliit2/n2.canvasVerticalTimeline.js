/*
Copyright (c) 2018, Geomatics and Cartographic Research Centre, Carleton 
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

var loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); },
	DH = 'n2.canvasVerticalTimeline';

// --------------------------------------------------------------------------
/* 
The vertical timeline canvas displays an ordered list of elements.

The attribute for each timeline element is described here:
	- id: String. Unique identifier for this element
	- n2_doc: Document used to create the element item 
	- sort: Optional String. Used to sort the cells in the vertical timeline.
	If no sort value is provided, sort by element date values will be attempted.
 	- fragments: Map map of fragments that make this element. Gives a list of
	documents used to make up this element.

Canvas options: 
	- canvasId: String. Unique identified for the canvas
	- sourceModelId: String. Unique identified of the model used by the canvas
	- elementGeneratorType: Optional String. Name of element generator type
	- elementGeneratorOptions: Optional Object. Element generator options
	- ascendingSortOrder: Boolean. Default value of true 
	- displayIndex: Boolean. Default value of true
*/
var VerticalTimelineCanvas = $n2.Class('VerticalTimelineCanvas',{

	canvasId: null,

	itemWidth: null,

	timelineList: null,

	sourceModelId: null,

	elementGenerator: null,

	dispatchService: null,

	showService: null,

	dateRange: null,

	ascendingSortOrder: null,

	sortedElements: null,

	displayIndex: null,

	timelineIndex: null,

	indexItems: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null,
			displayIndex: true,
			ascendingSortOrder: true,
			sourceModelId: null,
			elementGenerator: null,
			config: null,
			moduleDisplay: null,
			onSuccess: function(){},
			onError: function(err){}
		},opts_);
		
		var _this = this;
		this.canvasId = opts.canvasId;
		this.displayIndex = opts.displayIndex;
		this.ascendingSortOrder = opts.ascendingSortOrder;
		this.sourceModelId = opts.sourceModelId;
		this.elementGenerator = opts.elementGenerator;
		this.elementsById = {};
		this.sortedElements = [];

		var config = opts.config;
		if( config ){
			if( config.directory ){
				this.dispatchService = config.directory.dispatchService;
				this.showService = config.directory.showService;
			}
		}

		// Register to events
		if( this.dispatchService ){
			var f = function(m){
				_this._handleDispatch(m);
			};
			
			this.dispatchService.register(DH,'modelGetInfo',f);
			this.dispatchService.register(DH,'modelStateUpdated',f);
			this.dispatchService.register(DH,'windowResized',f);
		}
		
		// Element generator
		if( this.elementGenerator ){
			this.elementGenerator.setElementsChangedListener(function(added, updated, removed){
				_this._elementsChanged(added, updated, removed);
			});
		}

		this._createTimeline();
		opts.onSuccess();

		$n2.log(this._classname,this);
	},

	_backgroundClicked: function(){
		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'userUnselect'
			});
		}
	},

	_calcItemWidth: function(){
		
		var width;
		var itemPadding = 30;

		width = ($('.timeline_list').width()/2) - itemPadding;
		this.itemWidth = width;
	},

	_linkIdExists: function(id){
		var currentlyExists = false; 

		if ( $('#' + id ).length > 0 ){
			currentlyExists = true;
		}
		return currentlyExists;
	},

	_linkIndexToItems: function(){
		var i, j, e, f,	arrayItem, indexItem, year;
		var itemsArray = $('#' + this.canvasId + ' .timeline_item_label');

		if ( !this.ascendingSortOrder ){
			for ( j = 0, f = itemsArray.length-1; j <= f; f-- ){
				arrayItem = itemsArray[f];
				year = arrayItem.textContent.slice(0,4);
	
				for ( i = 0, e = this.indexItems.length-1; i <= e; e-- ){
					indexItem = String(this.indexItems[e]);
	
					if ( year >= this.indexItems[e] && !this._linkIdExists(indexItem) ){
						arrayItem.id = indexItem;
					}
				}
			}
		} else {
			for ( j = 0, f = itemsArray.length; j < f; j++ ){
				arrayItem = itemsArray[j];
				year = arrayItem.textContent.slice(0,4);
	
				for ( i = 0, e = this.indexItems.length; i < e; i++ ){
					indexItem = String(this.indexItems[i]);
	
					if ( year >= this.indexItems[i] && !this._linkIdExists(indexItem) ){
						arrayItem.id = indexItem;
					}
				}
			}
		}
	},

	_createTimeline: function(){

		var i, e, $target, $canvasTimeline, timelineIndex, timelineItemOptions, timelineIndexOptions; 
		var _this = this;

		// Remove old canvas container if it already exists
		if( $('.vertical_timeline_container').length > 0 ){
			$('.vertical_timeline_container').remove();
		}

		$('<div>')
			.attr('class','vertical_timeline_container')
			.click(function(e){
				$target = $(e.target);
				if( $target.hasClass('timeline_item') ){
					// Ignore
				} else if( $target.parents('.timeline_item').length > 0 ) {
				   	// Ignore
				}	else {
					_this._backgroundClicked();
				}
			})
			.appendTo($('#'+this.canvasId));

		if ( this.displayIndex && this.sortedElements.length > 0 ){

			timelineIndexOptions = {
				'canvasId': this.canvasId,
				'sortedElements': this.sortedElements,
				'ascendingSortOrder': this.ascendingSortOrder
			};

			timelineIndex = new TimelineIndex(timelineIndexOptions);

			this.indexItems = timelineIndex.getIndex();
		}

		$canvasTimeline = $('<div>')
			.attr('class','timeline_list')
			.appendTo($('.vertical_timeline_container'));

		// Re-Calculate Item Width based on available space
		this._calcItemWidth();

		this.timelineList = $('<ul>')
			.appendTo($canvasTimeline);

		for( i = 0, e = this.sortedElements.length; i < e; i++ ){
				
			timelineItemOptions = {
				element: this.sortedElements[i], 
				timelineList: this.timelineList,
				itemWidth: this.itemWidth
			};
			
			new TimelineItem(timelineItemOptions);
		}
		
		this._linkIndexToItems();

		this.showService.fixElementAndChildren(this.timelineList);
	},

	_sortElements: function(){
		var elementId, element, date;

		this.sortedElements = [];

		for( elementId in this.elementsById ){
			element = this.elementsById[elementId];

			this.sortedElements.push(element);

			// If element doesn't provide a sorted value, try to base it on a document date value
			if( typeof element.sort === 'undefined' ){
				date = this.getDateFromDoc(element);

				if ( date ){
					element.sort = date;
				}
			}
		}

		this.sortedElements.sort(function(a,b){
			if( a.sort < b.sort ){
				return -1;
			}
			if( a.sort > b.sort ){
				return 1;
			}
			return 0;
		});

		if ( !this.ascendingSortOrder ){
			this.sortedElements.reverse();
		}
	},

	_elementsChanged: function(addedElements, updatedElements, removedElements){
		var i,e,removed,added,updated; 	
		
		// Remove elements that are no longer there
		for( i=0,e=removedElements.length; i<e; ++i ){
			removed = removedElements[i];
			delete this.elementsById[removed.id];
		}
		
		// Add elements
		for( i=0,e=addedElements.length; i<e; ++i ){
			added = addedElements[i];
			this.elementsById[added.id] = added;
		}
		
		// Update elements
		for( i=0,e=updatedElements.length; i<e; ++i ){
			updated = updatedElements[i];
			this.elementsById[ updated.id ] = updated;
		}

		this._sortElements();

		this._createTimeline();
	},
	
	getDateFromDoc: function(object){

		var date, property, currentProp, slashIndex; 
		var dateRangeRegEx = /([0-9]{4})-([0-9]{2})-([0-9]{2}).*\/([0-9]{4})-([0-9]{2})-([0-9]{2}).*/g;

		for ( property in object ){
			currentProp = object[property];

			if ( typeof currentProp === 'object' ){
				
				if ( currentProp.nunaliit_type === 'date' && currentProp.date ){
					date = currentProp.date;
					
					//if date is in the format of a date range, return only the first part of the range
					if ( dateRangeRegEx.exec(date) ){
						slashIndex = date.indexOf('/');
						return date.slice(0,slashIndex); 
					}
					return date;

				} else {
					return this.getDateFromDoc(currentProp);
				}
			}
		}
		return date;
	},
	
	getCanvasHeight: function(){
		var canvasHeight = $('#'+this.canvasId).height();

		if (canvasHeight <= 0 ){
			canvasHeight = 0;
		}

		return canvasHeight;
	},

	_sourceModelUpdated: function(state){
		this.elementGenerator.sourceModelUpdated(state);
	},

	_handleDispatch: function(m){
		if( 'modelStateUpdated' === m.type ) {
			if( this.sourceModelId === m.modelId ){
				if( m.state ){
					this._sourceModelUpdated(m.state);
				}
			}

		} else if( 'windowResized' === m.type ) {
			this._createTimeline();
		}
	}
});

var TimelineIndex = $n2.Class('TimelineIndex', VerticalTimelineCanvas, {

	canvasId: null,

	dateRange: null,

	sortedElements: null, 

	ascendingSortOrder: null,

	index: null,

	reduceIndex: null,

	uniqueIndexValues: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null,
			ascendingSortOrder: null,
			timelineItems: null,
			reduceIndex: true,
			onSuccess: function(){},
			onError: function(err){}
		},opts_);

		this.canvasId = opts.canvasId;
		this.ascendingSortOrder = opts.ascendingSortOrder;
		this.sortedElements = opts.sortedElements;
		this.dateRange = {'startDate': null, 'endDate': null};
		this.index = [];
		this.reduceIndex = opts.reduceIndex;

		this._generateIndex();

		this._addTimelineIndexToCanvas();

		opts.onSuccess();

		$n2.log(this._classname,this);
	},

	_generateIndex: function(){
		var i, e, fragments, property, fragment, fragmentDate, elementDate;
		this.uniqueIndexValues = [];

		for( i = 0, e = this.sortedElements.length; i < e; i++ ){
			fragments = this.sortedElements[i].fragments;
			for( property in fragments){
				fragment = fragments[property];

				fragmentDate = this.getDateFromDoc(fragment);

				if ( fragmentDate ){
					elementDate = new Date(fragmentDate);

					this._updateDateRange(elementDate);

					if( this.uniqueIndexValues.indexOf(elementDate.getUTCFullYear()) < 0 && elementDate.getUTCFullYear() ){
						this.uniqueIndexValues.push(elementDate.getUTCFullYear());
					}
				}
			}
		}

		this.uniqueIndexValues.sort(function(a,b){
			if( a < b ){
				return -1;
			}
			if( a > b ){
				return 1;
			}
			return 0;
		});

		if ( !this.ascendingSortOrder ){
			this.uniqueIndexValues.reverse();
		}

		this._setIndex(this.uniqueIndexValues);

		// Reduce index items if set to true. 
		if ( this.reduceIndex ){
			this._setIndex(this._reduceIndexItems());
		}
	},

	_addTimelineIndexToCanvas: function(){
		// Remove old index if it already exists
		if( $('.timeline_index').length > 0 ){
			$('.timeline_index').remove();
		}

		var indexContainer = $('<div>')
			.attr('class','timeline_index')
			.appendTo('#' + this.canvasId + ' .vertical_timeline_container');

		var indexList = $('<ul>')
			.appendTo(indexContainer);

		var i, e, indexItem;
		var currentIndex = this.getIndex();

		for( i = 0, e = currentIndex.length; i < e; i++){
			indexItem = $('<li>')
				.attr('class','indexItem')
				.appendTo(indexList);
			
			$('<a>')
				.text(this.index[i])
				.attr('href','#'+this.index[i])
				.appendTo(indexItem);
		}
	},

	getIndex: function(){

		return this.index;
	},

	_setIndex: function(timelineIndex){
		this.index = timelineIndex;
	},

	_getDateRange: function(){
		return this.dateRange;
	},

	_setDateRange: function(startDate,endDate){
		this.dateRange.startDate = startDate;
		this.dateRange.endDate = endDate;
	},
	
	_updateDateRange: function(date){
		var currentDateRange = this._getDateRange();
		
		if( !currentDateRange.startDate && !currentDateRange.endDate ){
			currentDateRange.startDate = date; 
			currentDateRange.endDate = date;
		} else if( date < currentDateRange.startDate ){
			currentDateRange.startDate = date;
		} else if( date > currentDateRange.endDate ){
			currentDateRange.endDate = date;
		}
		
		if( currentDateRange.startDate && currentDateRange.endDate ){
			this._setDateRange(currentDateRange.startDate, currentDateRange.endDate);
		}
	},

	_reduceIndexItems: function(){
		var i, e, reducedDate;
		var indexItems = this.getIndex();
		var canvasHeight = this.getCanvasHeight();
		var itemHeight = 18;
		var itemPadding = 4;
		var itemMargin = 4;
		var listMargin = 20;
		var reducedItems = [];
		var factor = 1;
		var maxIndexItems = Math.round((canvasHeight-listMargin) / (itemHeight + itemMargin + itemPadding));
		
		var reduceDate = function(date, factor){
			return (date - (date % factor));
		};

		while( maxIndexItems < indexItems.length ){
			factor *= 10;
			
			for( i = 0, e = indexItems.length; i < e; i++ ){
				reducedDate = reduceDate(indexItems[i],factor);

				if( reducedItems.indexOf(reducedDate) < 0 ){
					reducedItems.push(reducedDate);
				}
			}

			if( maxIndexItems < reducedItems.length && maxIndexItems > 1 ){
				reducedItems = [];

			} else if( maxIndexItems <= 1 ) {
				// If window is too small to provide an index, exclude it. 
				indexItems = [];
				return indexItems;

			} else {
				indexItems = reducedItems;
			}
		}
		return indexItems;
	}
});

var TimelineItem = $n2.Class('TimelineItem', VerticalTimelineCanvas, {
	
	element: null, 

	itemWidth: null,

	timelineList: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			element: null,
			itemWidth: null,
			timelineList: null,
			onSuccess: function(){},
			onError: function(err){}
		},opts_);
	
		this.element = opts.element;
		this.itemWidth = opts.itemWidth;
		this.timelineList = opts.timelineList;

		this._addItemToList();

		opts.onSuccess();
	},
	
	_getDocIdFromDoc: function(doc){
		if ( doc && doc._id ){
			return doc._id;
		}
	},

	_getAttachment: function(doc){
		var file; 
		if (doc && doc.nunaliit_attachments && doc.nunaliit_attachments.files ){
			for ( file in doc.nunaliit_attachments.files ){
				if ( doc.nunaliit_attachments.files[file].originalName ){
					return doc.nunaliit_attachments.files[file].originalName;
				}
			}
		}
	},

	_addItemToList: function(){

		var $timelineItem, $timelineItemContent, $timelineItemContentText;
		var sortLabel = this.element.sort;
		var docId = this._getDocIdFromDoc(this.element.n2_doc);
		var attachmentName = this._getAttachment(this.element.n2_doc);

		if ( sortLabel ){
			
			$timelineItem = $('<li>')
				.attr('class','timeline_item n2s_userEvents')
				.attr('nunaliit-document', docId);
			
			$('<div>')
				.attr('class','timeline_item_label')
				.text(sortLabel)
				.appendTo($timelineItem);

			$('<div>')
				.attr('class','timeline_item_node')
				.appendTo($timelineItem);


			$timelineItemContent = $('<div>')
				.attr('class','timeline_item_content')
				.css('width',this.itemWidth+'px')
				.css('transform','translateX(-' + this.itemWidth + 'px)')
				.appendTo($timelineItem);

			if ( attachmentName ){
				$('<div>')
					.attr('class', 'n2s_insertMediaView')
					.attr('nunaliit-document', docId)
					.attr('nunaliit-attachment', attachmentName)
					.appendTo($timelineItemContent); 
			}

			$timelineItemContentText = $('<div>')
				.attr('class','timeline_item_content_text')
				.appendTo($timelineItemContent);

			$('<div>')
				.attr('class', 'n2s_briefDisplay')
				.attr('nunaliit-document', docId)
				.appendTo($timelineItemContentText);

			$timelineItem.appendTo(this.timelineList);
		}
	}
});


//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'vertical_timeline' ){
		m.isAvailable = true;
	}
}

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	var key, options; 

	if( m.canvasType === 'vertical_timeline' ){
		
		options = {};
		if( m.canvasOptions ){
			for( key in m.canvasOptions){
				options[key] = m.canvasOptions[key];
			}
		}
		
		if( !options.elementGenerator ){
			// If not defined, use the one specified by type
				options.elementGenerator = $n2.canvasElementGenerator.CreateElementGenerator({
				type: options.elementGeneratorType,
				options: options.elementGeneratorOptions,
				config: m.config
			});
		}
		
		options.canvasId = m.canvasId;
		options.config = m.config;
		options.onSuccess = m.onSuccess;
		options.onError = m.onError;
		
		new VerticalTimelineCanvas(options);
	}
}

//--------------------------------------------------------------------------
$n2.canvasVerticalTimeline = {
	TimelineIndex: TimelineIndex,
	TimelineItem: TimelineItem,	
	VerticalTimelineCanvas: VerticalTimelineCanvas,
	HandleCanvasAvailableRequest: HandleCanvasAvailableRequest,
	HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

}(jQuery,nunaliit2));
