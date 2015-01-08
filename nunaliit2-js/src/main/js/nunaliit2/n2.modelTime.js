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
 ,DH = 'n2.modelTime'
 ;
 
//--------------------------------------------------------------------------
var TimeFilter = $n2.Class({
	
	dispatchService: null,
	
	modelId: null,
	
	sourceModelId: null,
	
	docInfosByDocId: null,
	
	autoRange: null,
	
	range: null,
	
	rangeParameter: null,
	
	interval: null,
	
	intervalParameter: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,modelId: null
			,sourceModelId: null
			,rangeStr: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.modelId = opts.modelId;
		this.sourceModelId = opts.sourceModelId;
		
		this.autoRange = true;
		if( opts.rangeStr ){
			this.range = $n2.date.parseUserDate(opts.rangeStr);
			this.filterInterval = this.range;
			this.autoRange = false;
		};

		this.docInfosByDocId = {};
		
		this.rangeParameter = new $n2.model.ModelParameter({
			model: this
			,modelId: this.modelId
			,type: 'dateInterval'
			,name: 'range'
			,label: _loc('Range')
			,setFn: this._setRange
			,getFn: this.getRange
			,dispatchService: this.dispatchService
		});
		
		this.intervalParameter = new $n2.model.ModelParameter({
			model: this
			,modelId: this.modelId
			,type: 'dateInterval'
			,name: 'interval'
			,label: _loc('Interval')
			,setFn: this._setInterval
			,getFn: this.getInterval
			,dispatchService: this.dispatchService
		});
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'modelGetInfo',f);
			this.dispatchService.register(DH, 'modelGetState', f);
			this.dispatchService.register(DH, 'modelStateUpdated', f);
			
			// Initialize state
			var m = {
				type:'modelGetState'
				,modelId: this.sourceModelId
			};
			this.dispatchService.synchronousCall(DH, m);
			if( m.state ){
				this._sourceModelUpdated(m.state);
			};
		};
		
		$n2.log('TimeFilter',this);
	},
	
	getRange: function(){
		return this.range;
	},
	
	_setRange: function(updatedRange){
		var previous = this.getRange();
		
		this.range = updatedRange;
		
		var current = this.getRange();
		
		if( previous && previous.equals(current) ){
			// Nothing to do
		} else {
			this.rangeParameter.sendUpdate();
			
			// Verify if changes are required in interval
			// since interval should always be contained within
			// range.
			if( this.interval ){
				if( this.interval.min < this.range.min 
				 || this.interval.max > this.range.max ){
					// Need to fix interval
					var updatedInterval = this.range.intersection(this.interval);
					this._setInterval(updatedInterval);
				};
			} else {
				// Range has changed. Since interval is null, then the interval
				// has also changed.
				this.intervalParameter.sendUpdate();
				
				// Check all documents to see if visibility has changed
				this._intervalUpdated();
			};
		};
	},
	
	getInterval: function(){
		if( this.interval ){
			return this.interval;
		};
		
		return this.range;
	},
	
	_setInterval: function(updatedInterval){
		var previous = this.getInterval();
		
		this.interval = updatedInterval;
		
		var current = this.getInterval();
		
		if( previous.equals(current) ){
			// Nothing to do
		} else {
			this.intervalParameter.sendUpdate();
			
			// Check all documents to see if visibility has changed
			this._intervalUpdated();
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'modelGetInfo' === m.type ){
			if( this.modelId === m.modelId ){
				m.modelInfo = this._getModelInfo();
			};
			
		} else if( 'modelGetState' === m.type ){
			if( this.modelId === m.modelId ){
				var added = [];
				for(var docId in this.docInfosByDocId){
					var docInfo = this.docInfosByDocId[docId];
					var doc = docInfo.doc;
					if( docInfo.visible ){
						added.push(doc);
					};
				};

				m.state = {
					added: added
					,updated: []
					,removed: []
				};
			};
			
		} else if( 'modelStateUpdated' === m.type ){
			// Does it come from our source?
			if( this.sourceModelId === m.modelId ){
				this._sourceModelUpdated(m.state);
			};
		};
	},
	
	_getModelInfo: function(){
		var info = {
			modelId: this.modelId
			,modelType: 'timeFilter'
			,parameters: {}
		};
		
		info.parameters.range = this.rangeParameter.getInfo();
		info.parameters.interval = this.intervalParameter.getInfo();
		
		return info;
	},
	
	_sourceModelUpdated: function(sourceState){
		var added = []
			,updated = []
			,removed = []
			;
		
		var now = Date.now();
		
		// Loop through all added documents
		if( sourceState.added ){
			for(var i=0,e=sourceState.added.length; i<e; ++i){
				var doc = sourceState.added[i];
				var docId = doc._id;
				var intervals = this._getTimeIntervalsFromDoc(doc);
				var docInfo = {
					id: docId
					,doc: doc
					,intervals: intervals
					,visible: false
				};
				
				// Compute new visibility
				var visibility = this._computeVisibility(docInfo, now);
				
				docInfo.visible = visibility;

				// Save info
				this.docInfosByDocId[docId] = docInfo;
				
				if( docInfo.visible ){
					added.push(doc);
				};
			};
		};
		
		// Loop through all updated documents
		if( sourceState.updated ){
			for(var i=0,e=sourceState.updated.length; i<e; ++i){
				var doc = sourceState.updated[i];
				var docId = doc._id;
				var docInfo = this.docInfosByDocId[docId];
				var intervals = this._getTimeIntervalsFromDoc(doc);
				if( !docInfo ) {
					docInfo = {
						id: docId
						,doc: doc
						,visible: false
					};
					this.docInfosByDocId[docId] = docInfo;
				};

				// Update
				docInfo.doc = doc;
				docInfo.intervals = intervals;
				
				// Compute new visibility
				var visibility = this._computeVisibility(docInfo, now);
				var changeInVisibility = ( visibility !== docInfo.visible );
				docInfo.visible = visibility;

				// Report change in visibility
				if( changeInVisibility ){
					
					if( docInfo.visible ){
						// It used to be hidden. Now, it is visible. Add
						added.push(doc);
					} else {
						// It used to be visible. Now, it is hidden. Remove
						removed.push(doc);
					};
					
				} else if( docInfo.visible ) {
					// In this case, there was an update and it used to
					// be visible and it is still visible. Report update
					updated.push(doc);
				};
			};
		};
		
		// Loop through all removed documents
		if( sourceState.removed ){
			for(var i=0,e=sourceState.removed.length; i<e; ++i){
				var doc = sourceState.removed[i];
				var docId = doc._id;
				var docInfo = this.docInfosByDocId[docId];
				if( docInfo ){
					delete this.docInfosByDocId[docId];
					
					// If previously visible, add to removal list
					if( docInfo.visible ){
						removed.push(doc);
					};
				};
			};
		};

		// Report changes in visibility
		this._reportStateUpdate(added, updated, removed);

		// Recompute range, if necessary
		if( this.autoRange ){
			var updatedRange = null;
			for(var docId in this.docInfosByDocId){
				var docInfo = this.docInfosByDocId[docId];
				if( docInfo 
				 && docInfo.intervals  ){
					
					for(var i=0,e=docInfo.intervals.length; i<e; ++i){
						var interval = docInfo.intervals[i];
						
						if( !updatedRange ){
							updatedRange = interval;
						} else {
							updatedRange = updatedRange.extendTo(interval, now);
						};
					};
				};
			};
			
			if( updatedRange ){
				var updatedMin = updatedRange.getMin();
				var updatedMax = updatedRange.getMax(now);

				if( this.range ) {
					if( updatedMin != this.range.getMin() 
					 || updatedMax != this.range.getMax(now) ){
						updatedRange = new $n2.date.DateInterval({
							min: updatedMin
							,max: updatedMax
							,ongoing: false
						});
						this._setRange(updatedRange);
					};
				} else {
					updatedRange = new $n2.date.DateInterval({
						min: updatedMin
						,max: updatedMax
						,ongoing: false
					});
					this._setRange(updatedRange);
				};
			};
		};
	},
	
	_intervalUpdated: function(){
		var added = []
			,updated = []
			,removed = []
			;
		
		var now = Date.now();
		
		// Loop through all documents
		for(var docId in this.docInfosByDocId){
			var docInfo = this.docInfosByDocId[docId];
			var doc = docInfo.doc;

			// Compute new visibility
			var visibility = this._computeVisibility(docInfo, now);
			var changeInVisibility = ( visibility !== docInfo.visible );
			docInfo.visible = visibility;

			// Report change in visibility
			if( changeInVisibility ){
				
				if( docInfo.visible ){
					// It used to be hidden. Now, it is visible. Add
					added.push(doc);
				} else {
					// It used to be visible. Now, it is hidden. Remove
					removed.push(doc);
				};
			};
		};
		
		this._reportStateUpdate(added, updated, removed);
	},
	
	_reportStateUpdate: function(added, updated, removed){
		if( added.length > 0
		 || updated.length > 0 
		 || removed.length > 0 ){
			var stateUpdate = {
				added: added
				,updated: updated
				,removed: removed
			};

			if( this.dispatchService ){
				this.dispatchService.send(DH,{
					type: 'modelStateUpdated'
					,modelId: this.modelId
					,state: stateUpdate
				});
			};
		};
	},
	
	_computeVisibility: function(docInfo, now){
		var filterInterval = this.getInterval();
		
		if( docInfo 
		 && docInfo.intervals 
		 && filterInterval ){
			
			for(var i=0,e=docInfo.intervals.length; i<e; ++i){
				var interval = docInfo.intervals[i];
				
				if( interval.intersectsWith(filterInterval, now) ){
					return true;
				};
			};
		};
		
		return false;
	},
	
	_getTimeIntervalsFromDoc: function(doc){
		var dates = [];
		$n2.couchUtils.extractSpecificType(doc,'date',dates);
		
		var intervals = [];
		for(var i=0,e=dates.length; i<e; ++i){
			var date = dates[i];
			var interval = $n2.date.parseDateStructure(date);
			if( interval ){
				intervals.push( interval );
			};
		};
		
		return intervals;
	}
});

//--------------------------------------------------------------------------
$n2.modelTime = {
	TimeFilter: TimeFilter
};

})(jQuery,nunaliit2);
