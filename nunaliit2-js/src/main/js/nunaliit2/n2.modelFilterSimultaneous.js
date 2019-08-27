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
// Wraps a ModelParameter for the purpose of re-writing the available
// choices for a filter within the SimultaneousFilters construct.
// This wrapper is dependent on two models:
// 1. the filter model, used to call the _computeAvailableChoicesFromDocs()
// 2. the doc model, to get all currently displayed document
// It is important to note that this parameter does not support "setting the
// value" by the client. This parameter only updates value for clients.
var AvailableChoicesWrapper = $n2.Class({

	dispatchService: null,

	wrappingModelId: null,

	docModelId: null,

	filterModel: null,
	
	modelParameter: null,
	
	currentChoices: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: undefined
			,wrappingModelId: undefined
			,docModelId: undefined
			,filterModel: undefined
		},opts_);
		
		this.dispatchService = opts.dispatchService;
		this.wrappingModelId = opts.wrappingModelId;
		this.docModelId = opts.docModelId;
		this.filterModel = opts.filterModel;
		
		var _this = this;

		if( !this.dispatchService ){
			throw new Error('AvailableChoicesWrapper requires dispatchService');
		};
		
		// Check that filter model supports what we need
		if( !this.filterModel ){
			throw new Error('Option "filterModel" must be provided');
		};
		if( typeof this.filterModel._computeAvailableChoicesFromDocs != 'function' ){
			throw new Error('The instance of "filterModel" must support _computeAvailableChoicesFromDocs(): '+this.filterModel._classname);
		};
		
		this.currentChoices = [];
		
		// Create supporting model parameter
		this.modelParameter = new $n2.model.ModelParameter({
			model: this
			,modelId: this.wrappingModelId
			,type: 'objects'
			,name: 'availableChoices'
			,label: _loc('Available Choices')
			,setFn: this._setAvailableChoices
			,getFn: this._getAvailableChoices
			,dispatchService: this.dispatchService
		});

		// Listen to source model
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, 'modelStateUpdated', f);
			
			// Initialize state
			this._sourceModelUpdated();
		};
	},
	
	getInfo: function(){
		return this.modelParameter.getInfo();
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'modelStateUpdated' === m.type ){
			// Does it come from from our source?
			if( this.sourceModelId === m.docModelId ){
				this._sourceModelUpdated();
			};
		};
	},
	
	_sourceModelUpdated: function(){
		var _this = this;

		var state = $n2.model.getModelState({
			dispatchService: this.dispatchService
			,modelId: this.docModelId
		});
		if( state && state.added ){
			this.filterModel._computeAvailableChoicesFromDocs(state.added, function(choices){
				_this._choicesUpdated(choices);
			});
		};
	},
	
	_choicesUpdated: function(choices){
		this.currentChoices = choices;
		this.modelParameter.sendUpdate();
	},

	_setAvailableChoices: function(){
		throw new Error('This function should never be called');
	},

	_getAvailableChoices: function(){
		return this.currentChoices;
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
	
	filterInfosByModelId: null,
	
	intersectionModel: null,
	
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
		
		// Create filters from filter definitions
		this.filterInfosByModelId = {};
		var filterCount = 0;
		if( opts.filters && $n2.isArray(opts.filters) ){
			opts.filters.forEach(function(filterDefinition, defIndex){
				if( typeof filterDefinition === 'object' ){
					var declaredModelId = undefined;
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

					var effectiveModelId = _this.modelId+'_filter_'+declaredModelId;
					altDefinition.sourceModelId = _this.sourceModelId;
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
					
					// Count this filter
					++filterCount;

				} else {
					throw new Error('Filter definitions must be objects');
				};
			});
		};
		
		// Check that enough filters are defined
		if( filterCount <= 1 ){
			throw new Error('Requires at least two filters');
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

		// For each filter, create an intersection of the other filters combined, and 
		// an available parameter to represent it
		for(var filterId in this.filterInfosByModelId){
			var filterInfo = this.filterInfosByModelId[filterId];
			
			var otherSourceIds = [];
			for(var otherSourceId in this.filterInfosByModelId){
				if( otherSourceId !== filterId ){
					var otherSourceInfo = this.filterInfosByModelId[otherSourceId];
					otherSourceIds.push(otherSourceInfo.effectiveModelId);
				};
			};
			
			var docModelId = this.modelId + '_inter_' + filterInfo.declaredModelId;
			filterInfo.availableChoicesModel = new $n2.modelUtils.ModelIntersect({
				dispatchService: this.dispatchService
				,modelId: docModelId
				,sourceModelIds: otherSourceIds
			});

			var availableChoicesParameter = new AvailableChoicesWrapper({
				dispatchService: this.dispatchService
				,wrappingModelId: filterId
				,docModelId: docModelId
				,filterModel: filterInfo.model
			});
			
			filterInfo.availableChoicesParameter = availableChoicesParameter;
		};
		
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
		if( 'modelGetInfo' === m.type ){
			// Answer on behalf of our filters
			var filterInfo = this.filterInfosByModelId[m.modelId];
			if( filterInfo ){
				var modelInfo = $n2.model.getModelInfo({
					dispatchService: this.dispatchService
					,modelId: filterInfo.effectiveModelId
				});
				if( modelInfo ){
					// Replace available choices parameter
					if( modelInfo.parameters 
					 && modelInfo.parameters.availableChoices ){
						modelInfo.parameters.availableChoices = 
							filterInfo.availableChoicesParameter.getInfo();
					} else {
						$n2.logError('Underlying filter model is supposed to report "availableChoices" parameter: '+m.modelId);
					};

					m.modelInfo = modelInfo;
				};
			};
			
		} else if( 'modelGetState' === m.type ){
			// Answer on behalf of our filters
			var filterInfo = this.filterInfosByModelId[m.modelId];
			if( filterInfo ){
				var modelState = $n2.model.getModelState({
					dispatchService: this.dispatchService
					,modelId: filterInfo.effectiveModelId
				});
				if( modelState ){
					m.state = modelState;
				};
			};
		};
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
