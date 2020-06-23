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
 ,DH = 'n2.model'
 ;

//--------------------------------------------------------------------------
 /**
  * This class manages a parameter based on a model. A parameter supports
  * 3 events:
  * - get
  * - change
  * - set
  * 
  * The "get" event returns the current value of a parameter.
  * The "change" event is sent to the parameter, indicating the new value desired
  * by the user.
  * The "set" event is sent went the parameter value is modified.
  */
var ModelParameter = $n2.Class({

	model: null,
	
	parameterId: null,
	
	type: null,
	
	name: null,
	
	label: null,
	
	setFn: null,
	
	getFn: null,
	
	dispatchService: null,
	
	eventNameSet: null,
	
	eventNameGet: null,
	
	eventNameChange: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			model: null
			,modelId: null // optional
			,type: null
			,name: null
			,label: null
			,setFn: null
			,getFn: null
			,dispatchService: null
		},opts_);
	
		var _this = this;
		
		this.model = opts.model;
		this.type = opts.type;
		this.name = opts.name;
		this.label = opts.label;
		this.setFn = opts.setFn;
		this.getFn = opts.getFn;
		this.dispatchService = opts.dispatchService;
		
		var modelId = opts.modelId;
		if( !modelId ){
			modelId = $n2.getUniqueId('parameter_');
		};
		
		if( !this.label ){
			this.label = this.name;
		};
		
		this.parameterId = modelId + '_' + this.name;
		this.eventNameSet = this.parameterId + '_set';
		this.eventNameGet = this.parameterId + '_get';
		this.eventNameChange = this.parameterId + '_change';
		
		if( this.dispatchService ){
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, this.eventNameSet, fn);
			this.dispatchService.register(DH, this.eventNameGet, fn);
		};
	},

	getInfo: function(){
		var info = {
			parameterId: this.parameterId
			,type: this.type
			,name: this.name
			,label: this.label
			,setEvent: this.eventNameSet
			,getEvent: this.eventNameGet
			,changeEvent: this.eventNameChange
		};
		
		var effectiveValue = this._getValue();
		info.value = effectiveValue;
		
		return info;
	},

	sendUpdate: function(){
		var effectiveValue = this._getValue();
		this.dispatchService.send(DH, {
			type: this.eventNameChange
			,parameterId: this.parameterId
			,value: effectiveValue
		});
	},

	_getValue: function(){
		var value = null;
		
		if( this.getFn ){
			value = this.getFn.call(this.model);
		} else {
			value = this.model[this.name];
		};
		
		return value;
	},

	_setValue: function(value){
		if( this.setFn ){
			this.setFn.call(this.model, value);
		} else {
			this.model[this.name] = value;
			this.sendUpdate();
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( m.type === this.eventNameSet ){
			var value = m.value;
				
			this._setValue(value);
	 			
		} else if( m.type === this.eventNameGet ){
			var effectiveValue = this._getValue();
			m.value = effectiveValue;
		};
	}
});

//--------------------------------------------------------------------------
/**
 * This class implements a generic Observer to monitor a ParameterModel.
 * Build an instance of observer by providing the info structure obtained
 * by a model.
 */
var ModelParameterObserver = $n2.Class({

	dispatchService: null,
	
	onChangeFn: null,

	// Variables obtained from info
	
	parameterId: null,

	type: null,

	name: null,

	label: null,

	setEvent: null,
	
	getEvent: null,
	
	changeEvent: null,
	
	// Cached value that was observed last
	
	lastValue: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			parameterInfo: null
			,dispatchService: null
			,onChangeFn: null
		},opts_);
	
		var _this = this;
		
		this.onChangeFn = opts.onChangeFn;
		this.dispatchService = opts.dispatchService;
		this.lastValue = undefined;

		if( opts.parameterInfo 
		 && typeof opts.parameterInfo === 'object' ){
			this.parameterId = opts.parameterInfo.parameterId;
			this.type = opts.parameterInfo.type;
			this.name = opts.parameterInfo.name;
			this.label = opts.parameterInfo.label;
			this.setEvent = opts.parameterInfo.setEvent;
			this.getEvent = opts.parameterInfo.getEvent;
			this.changeEvent = opts.parameterInfo.changeEvent;
			this.lastValue = opts.parameterInfo.value;
		} else {
			throw new Error('parameterInfo must be provided');
		};

		if( this.dispatchService ){
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, this.changeEvent, fn);
		};
	},
	
	getValue: function(){
		return this.lastValue;
	},
	
	setValue: function(value){
		this.lastValue = value;

		this.dispatchService.send(DH, {
			type: this.setEvent
			,value: value
		});
	},

	_handle: function(m, addr, dispatcher){
		if( m.type === this.changeEvent  
		 && m.parameterId === this.parameterId ){
			var value = m.value;
			
			if( this.lastValue !== value ){
				var previousValue = this.lastValue;
				this.lastValue = value;
				if( typeof this.onChangeFn === 'function' ){
					this.onChangeFn(this.lastValue, previousValue);
				};
			};
		};
	}
});

//--------------------------------------------------------------------------
function getModelInfo(opts_){
	var opts = $n2.extend({
		dispatchService: null
		,modelId: null
	},opts_);
	
	var dispatchService = opts.dispatchService;
	var modelId = opts.modelId;
	
	if( !dispatchService ){
		throw new Error('dispatchService must be specified');
	};
	if( typeof modelId !== 'string' ){
		throw new Error('modelId must be specified');
	};

	var m = {
		type: 'modelGetInfo'
		,modelId: modelId
	};
	dispatchService.synchronousCall(DH,m);
	
	return m.modelInfo;
};

//--------------------------------------------------------------------------
function getModelState(opts_){
	var opts = $n2.extend({
		dispatchService: null
		,modelId: null
	},opts_);
	
	var dispatchService = opts.dispatchService;
	var modelId = opts.modelId;
	
	if( !dispatchService ){
		throw new Error('dispatchService must be specified');
	};
	if( typeof modelId !== 'string' ){
		throw new Error('modelId must be specified');
	};

	var m = {
		type: 'modelGetState'
		,modelId: modelId
	};
	dispatchService.synchronousCall(DH,m);
	
	return m.state;
};

//--------------------------------------------------------------------------
/*
 * This is an abstract class for a document model.
 */
var DocumentModel = $n2.Class('DocumentModel', {

	dispatchService: null,
	
	modelId: null,

	modelType: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,modelId: null
			,modelType: null
		},opts_);
	
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.modelId = opts.modelId;
		this.modelType = opts.modelType;

		if( typeof this.modelId !== 'string' ){
			throw new Error('modelId must be specified and it must be a string');
		};

		if( this.dispatchService ){
			this.dispatchService.register(DH, 'modelGetInfo', function(m, addr, dispatcher){
				if( m.modelId === _this.modelId ){
					m.modelInfo = _this._getModelInfo();
				}
			});
			this.dispatchService.register(DH, 'modelGetState', function(m, addr, dispatcher){
				if( m.modelId === _this.modelId ){
					var currentDocs = _this._getCurrentDocuments();
				
					currentDocs.nunaliit_model = this.modelId;
					m.state = {
						added: currentDocs
						,updated: []
						,removed: []
						,loading: _this._isLoading()
					};
				}
			});
		};
	},

	_getModelInfo: function(){
		var info = {
			modelId: this.modelId
			,modelType: this.modelType
			,parameters: {}
		};
		
		this._addModelInfoParameters(info);
		
		return info;
	},
	
	_addModelInfoParameters: function(info){
	},

	/**
	 * This method should be used by sub-classes to report the changes
	 * in the current state.
	 * @param added Array of documents that were added
	 * @param updated Array of documents that were modified since last state report
	 * @param removed Array of documents that were removed from the state
	 */
	_reportStateUpdate: function(added, updated, removed){
		var stateUpdate = {
			added: added
			,updated: updated
			,removed: removed
			,loading: this._isLoading()
		};

		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'modelStateUpdated'
				,modelId: this.modelId
				,state: stateUpdate
			});
		};
	},
	
	/*
	 * Return an array of documents that represent the current state of the model
	 */
	_getCurrentDocuments: function(){
		throw new Error('Subclasses must implement the method _getCurrentDocuments()');
	},
	
	/*
	 * Returns true if the model is currently loading
	 */
	_isLoading: function(){
		throw new Error('Subclasses must implement the method _isLoading()');
	}
});

//--------------------------------------------------------------------------
/*
 * This is an observer for a document model. It registers to a document model
 * identified by the sourceModelId. The observer can be queried for the currently
 * observed documents. 
 */
var DocumentModelObserver = $n2.Class('DocumentModelObserver', {

	dispatchService: null,
	
	sourceModelId: null,
	
	modelIsLoading: null,
	
	docsById: null,
	
	updatedCallback: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,sourceModelId: null
			,updatedCallback: null
		},opts_);
	
		var _this = this;
		
		this.docsById = {};
		this.modelIsLoading = false;
		
		this.dispatchService = opts.dispatchService;
		this.sourceModelId = opts.sourceModelId;
		this.updatedCallback = opts.updatedCallback;

		if( typeof this.sourceModelId !== 'string' ){
			throw new Error('sourceModelId must be specified and it must be a string');
		};

		if( this.dispatchService ){
			this.dispatchService.register(DH, 'modelStateUpdated', function(m, addr, dispatcher){
				if( _this.sourceModelId === m.modelId ){
					_this._sourceModelUpdated(m.state);
				};
			});
			
			// Get current state
			var state = $n2.model.getModelState({
				dispatchService: this.dispatchService
				,modelId: this.sourceModelId
			});
			if( state ){
				this._sourceModelUpdated(state);
			};
		};
	},
	
	getDocuments: function(){
		var docs = [];
		for(var docId in this.docsById){
			var doc = this.docsById[docId];
			docs[docs.length] = doc;
		};
		return docs;
	},
	
	_sourceModelUpdated: function(sourceState){
		
		var _this = this;
		
		if( typeof sourceState.loading === 'boolean'
		 && this.modelIsLoading !== sourceState.loading ){
			this.modelIsLoading = sourceState.loading;
		};
		
		// Loop through all added documents
		if( $n2.isArray(sourceState.added) ){
			sourceState.added.forEach(function(doc){
				var docId = doc._id;
				
				_this.docsById[docId] = doc;
			});
		};
		
		// Loop through all updated documents
		if( $n2.isArray(sourceState.updated) ){
			sourceState.updated.forEach(function(doc){
				var docId = doc._id;
				
				_this.docsById[docId] = doc;
			});
		};
		
		// Loop through all removed documents
		if( $n2.isArray(sourceState.removed) ){
			sourceState.removed.forEach(function(doc){
				var docId = doc._id;
				
				delete _this.docsById[docId];
			});
		};
		
		this._documentUpdated(sourceState);
	},
	
	isLoading: function(){
		return this.modelIsLoading;
	},
	
	/*
	 * Called when there is a change in the document set
	 */
	_documentUpdated: function(sourceState){
		if( typeof this.updatedCallback === 'function' ){
			this.updatedCallback(sourceState, this.sourceModelId);
		};
	}
});

//--------------------------------------------------------------------------
var MODEL_CONFIRMED = '__confirmed__';
var MODEL_SUSPECTED = '__suspected__';
var Service = $n2.Class({
	
	dispatchService: null,
	
	modelIdMap: null,
	
	modelIds: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;

		this.modelIdMap = {};
		this.modelIds = [];
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'modelCreate',f);
			this.dispatchService.register(DH,'modelStateUpdated',f);
			this.dispatchService.register(DH,'modelGetList',f);
			this.dispatchService.register(DH,'modelGetState',f);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'modelCreate' === m.type ){
			if( ! m.modelType ){
				$n2.log('modelType must be provided when creating a model');
				return;
			};
			
			if( ! m.modelId ){
				$n2.log('modelId must be provided when creating a model: '+m.modelType);
				return;
			};
			
			// Suspect this model id
			if( !this.modelIdMap[m.modelId] ){
				this.modelIdMap[m.modelId] = MODEL_SUSPECTED;
			};

			if( $n2.modelFilter && typeof $n2.modelFilter.handleModelCreate === 'function' ){
				$n2.modelFilter.handleModelCreate(m, addr, dispatcher);
			};
			
			if( $n2.modelUtils && typeof $n2.modelUtils.handleModelCreate === 'function' ){
				$n2.modelUtils.handleModelCreate(m, addr, dispatcher);
			};

			if( $n2.modelTime && typeof $n2.modelTime.handleModelCreate === 'function' ){
				$n2.modelTime.handleModelCreate(m, addr, dispatcher);
			};

			if( $n2.modelLayer && typeof $n2.modelLayer.handleModelCreate === 'function' ){
				$n2.modelLayer.handleModelCreate(m, addr, dispatcher);
			};

			if( $n2.couchDbPerspective && typeof $n2.couchDbPerspective.handleModelCreate === 'function' ){
				$n2.couchDbPerspective.handleModelCreate(m, addr, dispatcher);
			};

			if( $n2.modelFilterSimultaneous && typeof $n2.modelFilterSimultaneous.handleModelCreate === 'function' ){
				$n2.modelFilterSimultaneous.handleModelCreate(m, addr, dispatcher);
			};

		} else if( 'modelGetState' === m.type ){
			var modelId = m.modelId;

			// Suspect this model id
			if( !this.modelIdMap[m.modelId] ){
				this.modelIdMap[m.modelId] = MODEL_SUSPECTED;
			};
			
		} else if( 'modelStateUpdated' === m.type ){
			// Keep track of model identifiers
			var modelId = m.modelId;
			if( modelId ){
				if( this.modelIdMap[modelId] !== MODEL_CONFIRMED ){
					this.modelIdMap[modelId] = MODEL_CONFIRMED;
					this.modelIds.push(modelId);
				};
			};

		} else if( 'modelGetList' === m.type ){
			// This is a synchronous request to find all model identifiers
			if( !m.modelIds ){
				m.modelIds = [];
			};
			
			// Attempt to confirm suspected models
			for(var modelId in this.modelIdMap){
				var state = this.modelIdMap[modelId];
				if( MODEL_SUSPECTED === state ){
					var msg = {
						type: 'modelGetInfo'
						,modelId: modelId
					};
					this.dispatchService.synchronousCall(DH,msg);
					
					if( msg.modelInfo ){
						this.modelIdMap[modelId] = MODEL_CONFIRMED;
						this.modelIds.push(modelId);
					};
				};
			};
			
			this.modelIds.forEach(function(modelId){
				m.modelIds.push(modelId);
			});
		};
	}
});

//--------------------------------------------------------------------------
$n2.model = {
	Service: Service
	,DocumentModel: DocumentModel
	,DocumentModelObserver: DocumentModelObserver
	,ModelParameter: ModelParameter
	,ModelParameterObserver: ModelParameterObserver
	,getModelInfo: getModelInfo
	,getModelState: getModelState
};

})(jQuery,nunaliit2);
