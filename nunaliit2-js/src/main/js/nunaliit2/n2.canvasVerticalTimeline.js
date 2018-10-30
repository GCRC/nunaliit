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

var VerticalTimelineCanvas = $n2.Class('VerticalTimelineCanvas',{

	canvasId: null,

	itemWidth: null,

	timelineList: null,

	sourceModelId: null,

	elementGenerator: null,

	dispatchService: null,

	showService: null,

	dateRange: null,

	sortedElements: null,

	displayIndex: null,

	timelineIndex: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null,
			displayIndex: true,
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

	_createTimeline: function(){

		var i, e, doc, $canvasTimeline, timelineItemOptions, timelineIndexOptions; 
		var _this = this;

		// Remove old canvas container if it already exists
		if( $('.vertical_timeline_container').length > 0 ){
			$('.vertical_timeline_container').remove();
		}

		$('<div>')
			.attr('class','vertical_timeline_container')
			.click(function(e){
				var $target = $(e.target);
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
				'sortedElements': this.sortedElements
			};

			new TimelineIndex(timelineIndexOptions);
		}

		$canvasTimeline = $('<div>')
			.attr('class','timeline_list')
			.appendTo($('.vertical_timeline_container'));

		// Re-Calculate Item Width based on available space
		this._calcItemWidth();

		this.timelineList = $('<ul>')
			.appendTo($canvasTimeline);

		for( i = 0, e = this.sortedElements.length; i < e; i++ ){
			doc = this.sortedElements[i].n2_doc;
	
			timelineItemOptions = {
				doc: doc, 
				timelineList: this.timelineList,
				itemWidth: this.itemWidth,
				indexItems: this.indexItems
			};
			
			new TimelineItem(timelineItemOptions);
		}
		
		this.showService.fixElementAndChildren(this.timelineList);
	},

	_elementsChanged: function(addedElements, updatedElements, removedElements){
		var i,e,removed,added,updated,elementId,element,doc,docSchema,date; 	
		
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

		// Keep track of elements in sorted order
		this.sortedElements = [];
		for( elementId in this.elementsById ){
			element = this.elementsById[elementId];
			
			doc = element.n2_doc;
			docSchema = doc.nunaliit_schema;
			date = null;
			if ( doc[docSchema] && doc[docSchema].date && doc[docSchema].date.date ){
				date = doc[docSchema].date.date;
			}

			this.sortedElements.push(element);
			
			if( typeof element.sort === 'undefined' ){
				if ( date ){
					element.sort = date + "_" + element.id;
				} else {
					element.sort = element.id;
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
		
		this._createTimeline();
	},

	getDateFromDoc: function(object){

		var date, property, currentProp; 

		for ( property in object ){
			currentProp = object[property];

			if ( typeof currentProp === 'object' ){
				
				if ( currentProp.nunaliit_type === 'date' && currentProp.date ){
					date = currentProp.date;
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

	index: null,

	reduceIndex: null,

	uniqueYears: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null,
			timelineItems: null,
			reduceIndex: true,
			onSuccess: function(){},
			onError: function(err){}
		},opts_);

		this.canvasId = opts.canvasId;
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
		this.uniqueYears = [];

		for( i = 0, e = this.sortedElements.length; i < e; i++ ){
			fragments = this.sortedElements[i].fragments;
			for( property in fragments){
				fragment = fragments[property];

				fragmentDate = this.getDateFromDoc(fragment);

				if ( fragmentDate ){

					if (fragmentDate.indexOf('/') >= 0 ){
						// Do nothing
					} else {

						elementDate = new Date(fragmentDate);

						this._updateDateRange(elementDate);

						if( this.uniqueYears.indexOf(elementDate.getUTCFullYear()) < 0 && elementDate.getUTCFullYear() ){
							this.uniqueYears.push(elementDate.getUTCFullYear());
						}
					}
				}
			}
		}

		this.uniqueYears.sort(function(a,b){
			if( a < b ){
				return -1;
			}
			if( a > b ){
				return 1;
			}
			return 0;
		});

		this._setIndex(this.uniqueYears);

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
	
	doc: null, 

	itemWidth: null,

	timelineList: null,

	indexItems: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			doc: null,
			itemWidth: null,
			timelineList: null,
			indexItems: null,
			onSuccess: function(){},
			onError: function(err){}
		},opts_);
	
		this.doc = opts.doc;
		this.itemWidth = opts.itemWidth;
		this.timelineList = opts.timelineList;
		this.indexItems = opts.indexItems; 

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
		var dateLabel = this.getDateFromDoc(this.doc);
		var docId = this._getDocIdFromDoc(this.doc);
		var attachmentName = this._getAttachment(this.doc);

		if ( dateLabel ){

			$timelineItem = $('<li>')
				.attr('class','timeline_item');
			
			$('<div>')
				.attr('class','timeline_item_date')
				.text(dateLabel)
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
				.attr('class', 'n2s_briefDisplay n2s_userEvents')
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
