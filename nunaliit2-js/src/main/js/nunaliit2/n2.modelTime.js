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
			
			if( this.range.ongoing ){
				var now = Date.now();
				var min = this.range.getMin();
				var max = this.range.getMax(now);
				
				this.range = new $n2.date.DateInterval({
					min: min
					,max: max
				});
			};

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
		
		if( current === previous ){
			// Nothing to do. This takes care
			// of previous and current being null
		
		} else if( previous && previous.equals(current) ){
			// Nothing to do
		
		} else {
			// Range has changed
			this.rangeParameter.sendUpdate();
			
			// Verify if changes are required in interval
			// since interval should always be contained within
			// range.
			if( this.interval ){
				if( this.range ) {
					if( this.interval.min < this.range.min 
					 || this.interval.max > this.range.max ){
						// Need to fix interval
						var updatedInterval = this.range.intersection(this.interval);
						this._setInterval(updatedInterval);
					};
				} else {
					// Range is now null. Erase interval
					this._setInterval(null);
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
		
		if( previous === current ) {
			// Nothing to do. This takes care of
			// previous and current being null
			
		} else if( previous && previous.equals(current) ){
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
			} else {
				// No longer any document with a date
				this._setRange(null);
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
var TimeTransform = $n2.Class({
	
	dispatchService: null,
	
	modelId: null,
	
	sourceModelId: null,
	
	docInfosByDocId: null,
	
	autoRange: null,
	
	range: null,
	
	rangeParameter: null,
	
	interval: null,
	
	intervalParameter: null,
	
	now: null,
	
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
		this.now = Date.now();
		
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
		
		$n2.log('TimeTransform',this);
	},
	
	getRange: function(){
		return this.range;
	},
	
	_setRange: function(updatedRange){
		var previous = this.getRange();
		
		this.range = updatedRange;
		
		var current = this.getRange();
		
		if( current === previous ){
			// Nothing to do. This takes care
			// of previous and current being null
		
		} else if( previous && previous.equals(current) ){
			// Nothing to do
		
		} else {
			// Range has changed
			this.rangeParameter.sendUpdate();
			
			// Verify if changes are required in interval
			// since interval should always be contained within
			// range.
			if( this.interval ){
				if( this.range ) {
					if( this.interval.min < this.range.min 
					 || this.interval.max > this.range.max ){
						// Need to fix interval
						var updatedInterval = this.range.intersection(this.interval);
						this._setInterval(updatedInterval);
					};
				} else {
					// Range is now null. Erase interval
					this._setInterval(null);
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
		
		if( previous === current ) {
			// Nothing to do. This takes care of
			// previous and current being null
			
		} else if( previous && previous.equals(current) ){
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
			// Is this request intended for this time transform?
			if( this.modelId === m.modelId ){
				var added = [];
				for(var docId in this.docInfosByDocId){
					var docInfo = this.docInfosByDocId[docId];
					var doc = docInfo.doc;
					added.push(doc);
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
		
		var _this = this;
		
		// Loop through all added documents
		if( sourceState.added ){
			for(var i=0,e=sourceState.added.length; i<e; ++i){
				var doc = sourceState.added[i];
				var docId = doc._id;

				var docInfo = createDocInfo(doc);

				// Save info
				this.docInfosByDocId[docId] = docInfo;
				
				added.push(docInfo.doc);
			};
		};
		
		// Loop through all updated documents
		if( sourceState.updated ){
			for(var i=0,e=sourceState.updated.length; i<e; ++i){
				var doc = sourceState.updated[i];
				var docId = doc._id;
				var docInfo = this.docInfosByDocId[docId];
				if( !docInfo ) {
					// Added
					var docInfo = createDocInfo(doc);

					// Save info
					this.docInfosByDocId[docId] = docInfo;
					
					added.push(docInfo.doc);

				} else {
					// Updated
					var intervals = this._getTimeIntervalsFromDoc(doc);
					var transform = this._computeTransform(intervals, this.now);
					
					var myDoc = {
						_n2TimeTransform: transform
					};
					for(var key in doc){
						myDoc[key] = doc[key];
					};

					// Update
					docInfo.doc = myDoc;
					docInfo.intervals = intervals;
					
					updated.push(docInfo.doc);
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
					
					removed.push(doc);
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
							updatedRange = updatedRange.extendTo(interval, this.now);
						};
					};
				};
			};
			
			if( updatedRange ){
				var updatedMin = updatedRange.getMin();
				var updatedMax = updatedRange.getMax(this.now);

				if( this.range ) {
					if( updatedMin != this.range.getMin() 
					 || updatedMax != this.range.getMax(this.now) ){
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
			} else {
				// No longer any document with a date
				this._setRange(null);
			};
		};
		
		function createDocInfo(doc){
			var docId = doc._id;
			var intervals = _this._getTimeIntervalsFromDoc(doc);
			var transform = _this._computeTransform(intervals, _this.now);
			
			var myDoc = {
				_n2TimeTransform: transform
			};
			for(var key in doc){
				myDoc[key] = doc[key];
			};
			
			var docInfo = {
				id: docId
				,doc: myDoc
				,intervals: intervals
			};
			
			return docInfo;
		};
	},
	
	_intervalUpdated: function(){
		var added = []
			,updated = []
			,removed = []
			;
		
		// Loop through all documents
		for(var docId in this.docInfosByDocId){
			var docInfo = this.docInfosByDocId[docId];
			var doc = docInfo.doc;

			// Compute new visibility
			var intervals = docInfo.intervals;
			var updatedTransform = this._computeTransform(intervals, this.now);
			var transformsEqual = this._areTransformsEqual(updatedTransform, doc._n2TimeTransform);
			if( !transformsEqual ){
				doc._n2TimeTransform = updatedTransform;
				updated.push(doc);
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
	
	_computeTransform: function(intervals, now){
		var filterInterval = this.getInterval();
		
		var intersects = false;
		var intervalSize = 0;
		var intersectionSize = 0;
		var filterIntervalSize = 0;
		
		if( filterInterval ){
			filterIntervalSize = filterInterval.size(now);
			
			if( intervals ){
				for(var i=0,e=intervals.length; i<e; ++i){
					var interval = intervals[i];
					
					intervalSize += interval.size(now);
					
					var intersection = interval.intersection(filterInterval, now);
					if( intersection ){
						intersects = true;
						
						intersectionSize += intersection.size(now);
					};
				};
			};
		};
		
		if( !intersects ){
			filterIntervalSize = 0;
		};
		
		var transform = {
			intersects: intersects
			,intervalSize: intervalSize
			,intersectionSize: intersectionSize
			,filterIntervalSize: filterIntervalSize
		};
		
		return transform;
	},
	
	_areTransformsEqual: function(t1,t2){
		if( t1 === t2 ){
			return true;
			
		} else if( !t1 ) {
			return false;
			
		} else if( !t2 ) {
			return false;
		};

		if( t1.intersects !== t2.intersects ) return false;
		if( t1.intervalSize !== t2.intervalSize ) return false;
		if( t1.intersectionSize !== t2.intersectionSize ) return false;
		if( t1.filterIntervalSize !== t2.filterIntervalSize ) return false;
		
		return true;
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

// --------------------------------------------------------------------------
// This is a document transform model. In other words, it accepts documents from
// another model and makes those documents available to listeners. Since it is a
// transform, it modifies the document contents before passing them on.
//
// A dated reference is a reference object that contains a dated. The reference is
// valid only for the specified time interval. A dated reference has the following
// format:
// {
//     nunaliit_type: "reference"
//     ,doc: <string, identifier of referenced document>
//     ,date: {
//        nunaliit_type: "date"
//        ,date: <string>
//        ,min: <number>
//        ,max: <number>
//        ,ongoing: <boolean>
//     }
// }
//
// This time transform removes the references from documents when they do not match
// the selected time interval.
//
// This class uses a dictionay to track all documents received from the source model
// docInfosByDocId = {
//    <docId>: {
//       id: <string> identifier for document
//       ,doc: <object> transformed document
//       ,originalDoc: <object> document received from source model
//    }
// }
var DatedReferenceTransform = $n2.Class({
	
	dispatchService: null,
	
	modelId: null,
	
	sourceModelId: null,
	
	docInfosByDocId: null,
	
	autoRange: null,
	
	range: null,
	
	rangeParameter: null,
	
	interval: null,
	
	intervalParameter: null,
	
	now: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,modelId: null
			,sourceModelId: null
			,range: null
		},opts_);
		
		var _this = this;

		this.docInfosByDocId = {};
		this.now = Date.now();
		
		this.dispatchService = opts.dispatchService;
		this.modelId = opts.modelId;
		this.sourceModelId = opts.sourceModelId;
		
		this.autoRange = true;
		if( opts.range ){
			this.range = $n2.date.parseUserDate(opts.range);
			if( this.range && this.range.ongoing ){
				this.range.ongoing = false;
				this.range.max = this.now;
			};
			this.interval = this.range;
			this.autoRange = false;
		};
		
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
		
		$n2.log('DatedReferenceTransform',this);
	},
	
	getRange: function(){
		return this.range;
	},
	
	_setRange: function(updatedRange){
		var previous = this.getRange();
		
		this.range = updatedRange;
		if( this.range && this.range.ongoing ){
			this.range.max = this.now;
			this.range.ongoing = false;
		};
		
		var current = this.getRange();
		
		if( current === previous ){
			// Nothing to do. This takes care
			// of previous and current being null
		
		} else if( previous && previous.equals(current) ){
			// Nothing to do
		
		} else {
			// Range has changed
			this.rangeParameter.sendUpdate();
			
			// Verify if changes are required in interval
			// since interval should always be contained within
			// range.
			if( this.interval ){
				if( this.range ) {
					if( this.interval.min < this.range.min 
					 || this.interval.max > this.range.max ){
						// Need to fix interval
						var updatedInterval = this.range.intersection(this.interval);
						this._setInterval(updatedInterval);
					};
				} else {
					// Range is now null. Erase interval
					this._setInterval(null);
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
		if( this.interval && this.interval.ongoing ){
			this.interval.max = this.now;
		};
		
		var current = this.getInterval();
		
		if( previous === current ) {
			// Nothing to do. This takes care of
			// previous and current being null
			
		} else if( previous && previous.equals(current) ){
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
			// Is this request intended for this time transform?
			if( this.modelId === m.modelId ){
				var added = [];
				for(var docId in this.docInfosByDocId){
					var docInfo = this.docInfosByDocId[docId];
					var doc = docInfo.doc;
					added.push(doc);
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
		
		var _this = this;
		
		// Loop through all added documents
		if( sourceState.added ){
			for(var i=0,e=sourceState.added.length; i<e; ++i){
				var doc = sourceState.added[i];
				var docId = doc._id;

				var docInfo = createDocInfo(doc);

				// Save info
				this.docInfosByDocId[docId] = docInfo;
				
				added.push(docInfo.doc);
			};
		};
		
		// Loop through all updated documents
		if( sourceState.updated ){
			for(var i=0,e=sourceState.updated.length; i<e; ++i){
				var doc = sourceState.updated[i];
				var docId = doc._id;
				var docInfo = this.docInfosByDocId[docId];
				if( !docInfo ) {
					// Added
					var docInfo = createDocInfo(doc);

					// Save info
					this.docInfosByDocId[docId] = docInfo;
					
					added.push(docInfo.doc);

				} else {
					// Updated
					var intervalInfos = this._getIntervalInfosFromDoc(doc);
					var myDoc = this._computeTransform(doc, intervalInfos);
					
					docInfo.sourceDoc = doc;
					docInfo.doc = myDoc;
					docInfo.intervalInfos = intervalInfos;
					
					updated.push(docInfo.doc);
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
					
					removed.push(doc);
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
				 && docInfo.intervalInfos  ){
					
					for(var i=0,e=docInfo.intervalInfos.length; i<e; ++i){
						var intervalInfo = docInfo.intervalInfos[i];
						var interval = intervalInfo.interval;
						
						if( !updatedRange ){
							updatedRange = interval;
						} else {
							updatedRange = updatedRange.extendTo(interval, this.now);
						};
					};
				};
			};
			
			if( updatedRange ){
				var updatedMin = updatedRange.getMin();
				var updatedMax = updatedRange.getMax(this.now);

				if( this.range ) {
					if( updatedMin != this.range.getMin() 
					 || updatedMax != this.range.getMax(this.now) ){
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
			} else {
				// No longer any document with a date
				this._setRange(null);
			};
		};
		
		function createDocInfo(sourceDoc){
			var docId = doc._id;
			var intervalInfos = _this._getIntervalInfosFromDoc(sourceDoc);

			var myDoc = _this._computeTransform(sourceDoc, intervalInfos);
			
			var docInfo = {
				id: docId
				,doc: myDoc
				,sourceDoc: sourceDoc
				,intervalInfos: intervalInfos
			};
			
			return docInfo;
		};
	},
	
	_intervalUpdated: function(){
		var added = []
			,updated = []
			,removed = []
			;
		
		var filterInterval = this.getInterval();
		
		// Loop through all documents
		for(var docId in this.docInfosByDocId){
			var docInfo = this.docInfosByDocId[docId];
			var doc = docInfo.doc;

			// Compute changes in transforms
			var transformChanged = false;
			var intervalInfos = docInfo.intervalInfos;
			for(var i=0,e=intervalInfos.length; i<e; ++i){
				var intervalInfo = intervalInfos[i];
				var interval = intervalInfo.interval;
				
				var visible = false;
				if( filterInterval && filterInterval.intersectsWith(interval, this.now) ){
					visible = true;
				};
				
				if( intervalInfo.visible !== visible ){
					transformChanged = true;
					intervalInfo.visible = visible;
				};
			};

			// Recompute transform document, if needed
			if( transformChanged ){
				var myDoc = this._computeTransform(docInfo.sourceDoc, intervalInfos);
				docInfo.doc = myDoc;
				updated.push(myDoc);
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
	
	_computeTransform: function(sourceDoc, intervalInfos){
		var myDoc = $n2.extend(true, {}, sourceDoc);
		
		for(var i=0,e=intervalInfos.length; i<e; ++i){
			var intervalInfo = intervalInfos[i];
			if( intervalInfo.visible ){
				// OK
			} else {
				// Remove this reference. Replace it with null
				intervalInfo.selector.setValue(myDoc, null);
			};
		};

		return myDoc;
	},
	
	_getIntervalInfosFromDoc: function(doc){
		var currentInterval = this.getInterval();

		// Find selectors for all dated reference
		var selectors = $n2.objectSelector.findSelectors(doc, function(v){
			if( null !== v 
			 && typeof v === 'object' ){
				if( v.nunaliit_type === 'reference' 
				 && v.date 
				 && v.date.nunaliit_type === 'date' ){
					return true;
				};
			};
			return false;
		});
		
		// Compute interval infos
		var intervalInfos = [];
		for(var i=0,e=selectors.length; i<e; ++i){
			var selector = selectors[i];
			var ref = selector.getValue(doc);
			var dateStr = ref.date;
			var interval = $n2.date.parseDateStructure(dateStr);
			if( interval ){
				var intervalInfo = {
					interval: interval
					,selector: selector
					,visible: false
				};
				
				if( currentInterval ){
					if( currentInterval.intersectsWith(interval, this.now) ){
						intervalInfo.visible = true;
					};
				};
				
				intervalInfos.push( intervalInfo );
			};
		};

		return intervalInfos;
	}
});

//--------------------------------------------------------------------------
// No time
// This filter allows documents that have no time information
var NoTimeFilter = $n2.Class({
	
	dispatchService: null,
	
	modelId: null,
	
	sourceModelId: null,
	
	docInfosByDocId: null,
	
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
		
		this.docInfosByDocId = {};
		
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
		
		$n2.log('NoTimeFilter',this);
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
			,modelType: 'noTimeFilter'
			,parameters: {}
		};
		
		return info;
	},
	
	_sourceModelUpdated: function(sourceState){
		var added = []
			,updated = []
			,removed = []
			;
		
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
				var visibility = this._computeVisibility(docInfo);
				
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
				var visibility = this._computeVisibility(docInfo);
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
	
	_computeVisibility: function(docInfo){

		if( docInfo 
		 && docInfo.intervals
		 && docInfo.intervals.length > 0 ){
			// Any time interval makes the document invisible
			return false;
		};
		
		return true;
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
function handleModelCreate(m, addr, dispatcher){
	if( m.modelType === 'timeFilter' ){
		var options = {
			modelId: m.modelId
		};
		
		if( m && m.modelOptions ){
			if( m.modelOptions.sourceModelId ){
				options.sourceModelId = m.modelOptions.sourceModelId;
			};

			if( m.modelOptions.range ){
				options.rangeStr = m.modelOptions.range;
			};
		};
		
		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		new TimeFilter(options);
		
		m.created = true;
	    
	} else if( m.modelType === 'noTimeFilter' ){
		var options = {
			modelId: m.modelId
		};
		
		if( m && m.modelOptions ){
			if( m.modelOptions.sourceModelId ){
				options.sourceModelId = m.modelOptions.sourceModelId;
			};
		};
		
		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		new NoTimeFilter(options);
		
		m.created = true;
	    
	} else if( m.modelType === 'timeTransform' ){
		var options = {
			modelId: m.modelId
		};
		
		if( m && m.modelOptions ){
			if( m.modelOptions.sourceModelId ){
				options.sourceModelId = m.modelOptions.sourceModelId;
			};

			if( m.modelOptions.range ){
				options.rangeStr = m.modelOptions.range;
			};
		};
		
		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		new TimeTransform(options);
		
		m.created = true;
	    
	} else if( m.modelType === 'datedReferenceTransform' ){
		var options = {
			modelId: m.modelId
		};
		
		if( m.modelOptions ){
			for(var key in m.modelOptions){
				var value = m.modelOptions[key];
				options[key] = value;
			};
		};
		
		if( m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		new DatedReferenceTransform(options);
		
		m.created = true;
    };
};

//--------------------------------------------------------------------------
$n2.modelTime = {
	TimeFilter: TimeFilter
	,NoTimeFilter: NoTimeFilter
	,TimeTransform: TimeTransform
	,DatedReferenceTransform: DatedReferenceTransform
	,handleModelCreate: handleModelCreate
};

})(jQuery,nunaliit2);
