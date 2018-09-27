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
		this.indexItems = [];

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

		this._createVerticalTimeline();
		opts.onSuccess();

		$n2.log(this._classname,this);
	 },

 	_createVerticalTimeline: function(){
		var timelineIndexOptions = {
			'canvasId': this.canvasId,
			'sortedElements': this.sortedElements
		};

		var timelineIndex = new TimelineIndex(timelineIndexOptions);
		var range = timelineIndex._getDateRange();
		this.indexItems = timelineIndex._getIndex();
		
		if (this.displayIndex){
			// Add Index if option is turned on
			this._drawIndex();
		}
	 },

	_drawIndex: function(){
		// Remove old index if it already exists
		if( $('#vertical_timeline_index').length > 0 ){
			$('#vertical_timeline_index').remove();
		}

		var indexContainer = $('<div>')
			.attr('id','vertical_timeline_index')
			.appendTo($('#'+this.canvasId));

		var indexList = $('<ul>')
			.appendTo(indexContainer);

		for(var i = 0, e = this.indexItems.length; i < e; i++){
			var indexItem = $('<li>')
				.height(this.itemHeight)
				.attr('class','indexItem')
				.appendTo(indexList);
			
			$('<a>')
				.text(this.indexItems[i])
				.attr('href','#'+this.indexItems[i])
				.appendTo(indexItem);
		}
	},

 	_elementsChanged: function(addedElements, updatedElements, removedElements){
 		var _this = this;
 		
 		// Remove elements that are no longer there
		for(var i=0,e=removedElements.length; i<e; ++i){
			var removed = removedElements[i];
			delete this.elementsById[removed.id];
		}
		
		// Add elements
		for(var j=0,f=addedElements.length; j<f; ++j){
			var addedElement = addedElements[j];
			this.elementsById[addedElement.id] = addedElement;
		}
		
		// Update elements
		for(var k=0,g=updatedElements.length; k<g; ++k){
			var updated = updatedElements[k];
			this.elementsById[ updated.id ] = updated;
		}

		// Keep track of elements in sorted order
		this.sortedElements = [];
		for(var elementId in this.elementsById){
			var element = this.elementsById[elementId];
			this.sortedElements.push(element);
			
			if( typeof element.sort === 'undefined' ){
				element.sort = element.id;
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
		
		this._createVerticalTimeline();
 	},

 	_sourceModelUpdated: function(state){
 		this.elementGenerator.sourceModelUpdated(state);
 	},

 	_handleDispatch: function(m){
 		if( 'modelGetInfo' === m.type ){
 			if( m.modelId === this.modelId ){
 				m.modelInfo = this._getModelInfo();
 			}
 			
 		} else if( 'modelStateUpdated' === m.type ) {
 			if( this.sourceModelId === m.modelId ){
 				if( m.state ){
 					this._sourceModelUpdated(m.state);
 				}
 			}

 		} else if( 'windowResized' === m.type ) {
			this._createVerticalTimeline();
	 	}
 	}
});

var TimelineIndex = $n2.Class('TimelineIndex', {

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
		this.dateRange = {'startDate':null, 'endDate':null};
		this.index = [];
		this.reduceIndex = opts.reduceIndex;

		this._generateIndex();

		opts.onSuccess();

		$n2.log(this._classname,this);
	},

	_generateIndex: function(){

		this.uniqueYears = [];

		for( var i = 0, e = this.sortedElements.length; i < e; i++ ){
			var fragments = this.sortedElements[i].fragments;
			for(var prop in fragments){
				var fragment = fragments[prop];
				var elementDate = new Date(this._getDateFromFragment(fragment));
				this._updateDateRange(elementDate);

				if( this.uniqueYears.indexOf(elementDate.getUTCFullYear()) < 0 && elementDate.getUTCFullYear() ){
					this.uniqueYears.push(elementDate.getUTCFullYear());
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
		if( this.reduceIndex ){
			this._setIndex(this._reduceIndexItems());
		}
	 },

	 _getIndex: function(){
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
	
	_getDateFromFragment: function(fragment){
		if( fragment && fragment.n2_doc ){
			var fragDoc = fragment.n2_doc;
			var schemaName = fragDoc.nunaliit_schema; 
			if( fragDoc[schemaName] && fragDoc[schemaName].date	&& fragDoc[schemaName].date.date ){
				return fragDoc[schemaName].date.date;
			}
		}
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

	_getCanvasHeight: function(){
		var canvasHeight = $('#'+this.canvasId).height();

		if (canvasHeight <= 0 ){
			canvasHeight = 0;
		}

		return canvasHeight;
	},

	_reduceIndexItems: function(){
		var items = this.index;
		var canvasHeight = this._getCanvasHeight();
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

		while( maxIndexItems < items.length ){
			factor *= 10;
			
			for( var i = 0, e = items.length; i < e; i++ ){
				var reducedDate = reduceDate(items[i],factor);

				if( reducedItems.indexOf(reducedDate) < 0 ){
					reducedItems.push(reducedDate);
				}
			}

			if( maxIndexItems < reducedItems.length && maxIndexItems > 1 ){
				reducedItems = [];

			} else if( maxIndexItems <= 1 ) {
				// If window is too small to provide an index, exclude it. 
				items = [];
				break;

			} else {
				items = reducedItems;
			}
		}
		return items;
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
	if( m.canvasType === 'vertical_timeline' ){
		
		var options = {};
		if( m.canvasOptions ){
			for(var key in m.canvasOptions){
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
	VerticalTimelineCanvas: VerticalTimelineCanvas,
	TimelineIndex: TimelineIndex,
	HandleCanvasAvailableRequest: HandleCanvasAvailableRequest,
	HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
