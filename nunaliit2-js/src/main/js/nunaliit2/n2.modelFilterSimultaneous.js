/*
Copyright (c) 2017, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.modelFilterSimultaneous'
 ;

//--------------------------------------------------------------------------

var counter = 0;
function getUnique(){
	var unique = 'simul_filter_'+counter;
	++counter;
	return unique;
};
 
//--------------------------------------------------------------------------
var ModelInput = $n2.Class('ModelInput', $n2.model.DocumentModel, {
	
	sourceModelId: null,
	
	docsById: null,
	
	loading: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: undefined
			
			// From configuration
			,modelId: undefined
			,sourceModelId: undefined
		},opts_);
		
		opts.modelType = 'SimultaneousFilterInput';
		
		$n2.model.DocumentModel.prototype.initialize.call(this, opts)
		
		var _this = this;
		
		this.sourceModelId = opts.sourceModelId;
		if( !this.sourceModelId ){
			throw new Error('Attribute "sourceModelId" must be specified for SimultaneousFilters:ModelInput');
		};

		this.docsById = {};
		this.loading = false;

		// Listen to source model
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, 'modelStateUpdated', f);
			
			// Initialize state
			var state = $n2.model.getModelState({
				dispatchService: this.dispatchService
				,modelId: this.sourceModelId
			});
			if( state ){
				this._sourceModelUpdated(state);
			};
		};
		
		$n2.log(this._classname,this);
	},
	
	_isLoading: function(){
		return this.loading;
	},
	
	_getCurrentDocuments: function(){
		var docs = [];
		for(var docId in this.docsById){
			var doc = this.docsById[docId];
			docs.push(doc);
		};
		return docs;
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'modelStateUpdated' === m.type ){
			// Does it come from from our source?
			if( this.sourceModelId === m.modelId ){
				this._sourceModelUpdated(m.state);
			};
		};
	},
	
	_sourceModelUpdated: function(sourceState){
		
		var added = []
			,updated = []
			,removed = []
			;
		
		if( typeof sourceState.loading === 'boolean' ){
			this.loading = sourceState.loading;
		};
		
		// Loop through all added and modified documents
		var addedAndModifiedDocs = sourceState.added ? sourceState.added.slice(0) : [];
		if( sourceState.updated ){
			addedAndModifiedDocs.push.apply(addedAndModifiedDocs, sourceState.updated);
		};
		for(var i=0,e=addedAndModifiedDocs.length; i<e; ++i){
			var doc = addedAndModifiedDocs[i];
			var docId = doc._id;

			var prevDoc = this.docsById[docId];
			if( !prevDoc ){
				added.push(doc);
			} else {
				if( prevDoc._rev !== doc._rev ){
					updated.push(doc);
				};
			};
			
			this.docsById[docId] = doc;
		};
		
		// Loop through all removed documents
		if( sourceState.removed ){
			for(var i=0,e=sourceState.removed.length; i<e; ++i){
				var doc = sourceState.removed[i];
				var docId = doc._id;
				var prevDoc = this.docsById[docId];
				if( prevDoc ){
					delete this.docsById[docId];
					removed.push(prevDoc);
				};
			};
		};

		this._reportStateUpdate(added, updated, removed);
	}
});

//--------------------------------------------------------------------------
// The point of this filter is to accept a number of filters and let
// them operate in parallel.
// All the contained filters should work on the same input (sourceModelId).
// The output of all filters should be combined in an intersection. This
// intersection is the end result of the instance of SimultaneousFilters.
var SimultaneousFilters = $n2.Class('SimultaneousFilters',{
		
	config: null,

	dispatchService: null,

	modelId: null,
	
	sourceModelId: null,
	
	inputModelId: null,

	inputModel: null,
	
	filterInfosByModelId: null,
	
	intersectionModel: null,
	
	unionModel: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			config: undefined
			,dispatchService: undefined

			// From configuration
			,modelId: undefined
			,sourceModelId: undefined
			,filters: undefined
		},opts_);
		
		var _this = this;
		
		this.config = opts.config;
		this.dispatchService = opts.dispatchService;
		this.modelId = opts.modelId;
		this.sourceModelId = opts.sourceModelId;
		
		if( !this.dispatchService ){
			throw new Error('Dispatch Service required for SimultaneousFilters');
		};
		
		// Create a model to consume the source model
		this.inputModelId = this.modelId + '_input';
		this.inputModel = new ModelInput({
			dispatchService: this.dispatchService
			,modelId: this.inputModelId
			,sourceModelId: this.sourceModelId
		});

		// Create filters from filter definitions
		this.filterInfosByModelId = {};
		if( opts.filters && $n2.isArray(opts.filters) ){
			opts.filters.forEach(function(filterDefinition, defIndex){
				if( typeof filterDefinition === 'object' ){
					var declaredModelId = undefined;
					var effectiveModelId = _this.modelId+'_filter_'+defIndex;
					var modelType = undefined;

					// Create an alternate definition for the purpose of
					// this construct
					var altDefinition = {};
					
					// Copy most attributes
					for(var key in filterDefinition){
						var value = filterDefinition[key];
						if( 'sourceModelId' === key ){
							$n2.log('Attribute "sourceModelId" should not be specified in a filter definition within "simultaneousFilters"');
						} else if( 'modelId' === key ) {
							declaredModelId = value;
						} else if( 'modelType' === key ) {
							modelType = value;
							altDefinition[key] = value;
						} else {
							altDefinition[key] = value;
						};
					};
					
					// Check that all needed attributes are provided
					if( !declaredModelId ){
						throw new Error('Attribute "modelId" must be provided for filter definitions within "simultaneousFilters"');
					};
					if( !modelType ){
						throw new Error('Attribute "modelType" must be provided for filter definitions within "simultaneousFilters"');
					};

					// Just for now
					effectiveModelId = declaredModelId;
					
					altDefinition.sourceModelId = _this.inputModelId;
					altDefinition.modelId = effectiveModelId;
					
					// Create filter
					var msg = {
						type: 'modelCreate'
						,modelId: effectiveModelId
						,modelType: modelType
						,modelOptions: altDefinition
						,config: _this.config
					};
					_this.dispatchService.synchronousCall(DH, msg);
					
					if( !msg.created ){
						throw new Error('Unknown modelType: '+modelType);
					};
					if( !msg.model ){
						throw new Error('Invalid modelType: '+modelType);
					};
					
					// Save filter info
					var filterInfo = {
						declaredModelId: declaredModelId
						,effectiveModelId: effectiveModelId
						,modelType: modelType
						,model: msg.model
					};
					_this.filterInfosByModelId[declaredModelId] = filterInfo;

				} else {
					throw new Error('Filter definitions must be objects');
				};
			});
		};
		
		// Make a list of all effective filter ids
		var allFilterIds = [];
		for(var key in this.filterInfosByModelId){
			var filterInfo = this.filterInfosByModelId[key];
			allFilterIds.push(filterInfo.effectiveModelId);
		};

		// Create an intersection model based on all filter models
		this.intersectionModel = new $n2.modelUtils.ModelIntersect({
			dispatchService: this.dispatchService
			,modelId: this.modelId
			,sourceModelIds: allFilterIds
		});

		// Create an union model based on all filter models
		this.unionModelId = this.modelId + '_union';
		this.unionModel = new $n2.modelUtils.ModelUnion({
			dispatchService: this.dispatchService
			,modelId: this.unionModelId
			,sourceModelIds: allFilterIds
		});
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'modelGetInfo',f);
			this.dispatchService.register(DH, 'modelGetState', f);
		};
		
		$n2.log(this._classname,this);
	},
	
	_handle: function(m, addr, dispatcher){
//		if( 'modelGetInfo' === m.type ){
//			// Answer on behalf of our filters
//			var filterInfo = this.filterInfosByModelId[m.modelId];
//			if( filterInfo ){
//				var modelInfo = $n2.model.getModelInfo({
//					dispatchService: this.dispatchService
//					,modelId: filterInfo.effectiveModelId
//				});
//				if( modelInfo ){
//					m.modelInfo = modelInfo;
//				};
//			};
//			
//		} else if( 'modelGetState' === m.type ){
//			// Answer on behalf of our filters
//			var filterInfo = this.filterInfosByModelId[m.modelId];
//			if( filterInfo ){
//				var modelState = $n2.model.getModelState({
//					dispatchService: this.dispatchService
//					,modelId: filterInfo.effectiveModelId
//				});
//				if( modelState ){
//					m.state = modelState;
//				};
//			};
//		};
	}
});

//--------------------------------------------------------------------------
function handleModelCreate(m, addr, dispatcher){
	if( m.modelType === 'simultaneousFilters' ){
		try {
			var options = {};
			
			if( m && m.modelOptions ){
				for(var key in m.modelOptions){
					var value = m.modelOptions[key];
					options[key] = value;
				};
			};
	
			options.modelId = m.modelId;
			options.modelType = m.modelType;
			
			if( m && m.config ){
				options.config = m.config;

				if( m.config.directory ){
					options.dispatchService = m.config.directory.dispatchService;
				};
			};
		
			m.model = new SimultaneousFilters(options);
			
			m.created = true;

		} catch(err) {
			$n2.logError('Error while creating SimultaneousFilters',err);
		};
	};
};


//--------------------------------------------------------------------------
$n2.modelFilterSimultaneous = {
	SimultaneousFilters: SimultaneousFilters
	,handleModelCreate: handleModelCreate 
};

})(jQuery,nunaliit2);
