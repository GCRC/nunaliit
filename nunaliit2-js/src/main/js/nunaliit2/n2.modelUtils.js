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
 ,DH = 'n2.modelUtils'
 ;

//--------------------------------------------------------------------------
function FilterFunctionFromModelConfiguration(modelConf){
	if( 'filter' === modelConf.modelType ){
		if( modelConf.condition ) {
			var condition = $n2.styleRuleParser.parse(modelConf.condition);
			var ctxt = {
				n2_doc: null
				,n2_selected: false
				,n2_hovered: false
				,n2_found: false
				,n2_intent: null
			};
			return function(doc){
				// Re-use same context to avoid generating
				// temporary objects
				ctxt.n2_doc = doc;
				
				var value = condition.getValue(ctxt);

				ctxt.n2_doc = null;
				
				return value;
			};
			
		} else if( 'all' === modelConf.useBuiltInFunction ){
			return function(doc){
				return true;
			};
			
		} else if( 'none' === modelConf.useBuiltInFunction ){
			return function(doc){
				return false;
			};
			
		} else if( 'withDates' === modelConf.useBuiltInFunction ){
			return function(doc){
				var dates = [];
				$n2.couchUtils.extractSpecificType(doc,'date',dates);
				return (dates.length > 0);
			};
			
		} else if( 'withoutDates' === modelConf.useBuiltInFunction ){
			return function(doc){
				var dates = [];
				$n2.couchUtils.extractSpecificType(doc,'date',dates);
				return (dates.length < 1);
			};
		};
	};
	
	return null;
};

//--------------------------------------------------------------------------
var ModelFilter = $n2.Class({
		
	dispatchService: null,

	modelId: null,
	
	sourceModelId: null,
	
	docInfosByDocId: null,
	
	filterFn: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,filterName: 'FilterModel'
			,filterFn: null

			// From configuration
			,modelId: null
			,sourceModelId: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.modelId = opts.modelId;
		this.sourceModelId = opts.sourceModelId;
		this.filterFn = opts.filterFn;
		this.filterName = opts.filterName;
		
		this.docInfosByDocId = {};

		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'modelGetInfo',f);
			this.dispatchService.register(DH, 'modelGetState', f);
			this.dispatchService.register(DH, 'modelStateUpdated', f);
			
			if( this.sourceModelId ){
				// Initialize state
				var state = $n2.model.getModelState({
					dispatchService: this.dispatchService
					,modelId: this.sourceModelId
				});
				if( state ){
					this._sourceModelUpdated(state);
				};
			};
		};
		
		$n2.log(this.filterName,this);
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'modelGetInfo' === m.type ){
			if( this.modelId === m.modelId ){
				m.modelInfo = this._getModelInfo();
				m.modelInstance = this;
			};
			
		} else if( 'modelGetState' === m.type ){
			if( this.modelId === m.modelId ){
				var added = [];
				for(var docId in this.docInfosByDocId){
					var docInfo = this.docInfosByDocId[docId];
					if( docInfo.visible ){
						var doc = docInfo.doc;
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
			// Does it come from one of our sources?
			if( this.sourceModelId === m.modelId ){
				this._sourceModelUpdated(m.state);
			};
		};
	},
	
	_getModelInfo: function(){
		var info = {
			modelId: this.modelId
			,modelType: 'filter'
			,parameters: {}
		};
		
		this._addModelInfoParameters(info);
		
		return info;
	},
	
	_addModelInfoParameters: function(info){
		// Used by sub-classes to add parameters
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
	
				var docInfo = this.docInfosByDocId[docId];
				if( !docInfo ){
					docInfo = {
						id: docId
						,doc: doc
						,visible: false
					};
					this.docInfosByDocId[docId] = docInfo;
				};
				
				var visible = this._computeVisibility(doc);
				
				if( visible ){
					docInfo.visible = visible;
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
				if( !docInfo ){
					docInfo = {
						id: docId
						,doc: doc
						,visible: false
					};
					this.docInfosByDocId[docId] = docInfo;
				};
				
				// Update document
				docInfo.doc = doc;
				
				// Compute new visibility
				var visible = this._computeVisibility(doc);
				
				if( visible !== docInfo.visible ){
					if( visible ){
						added.push(doc);
					} else {
						removed.push(doc);
					};
					
				} else if(visible) {
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
					
					if( docInfo.visible ){
						removed.push(doc);
					};
				};
			};
		};

		this._reportStateUpdate(added, updated, removed);
	},
	
	/*
	 * This function should be called if the conditions of the underlying filter
	 * have changed. Recompute visibility on all documents and report a state update
	 */
	_filterChanged: function(){
		
		var added = []
			,updated = []
			,removed = []
			;

		// Loop through all documents
		for(var docId in this.docInfosByDocId){
			var docInfo = this.docInfosByDocId[docId];
			var doc = docInfo.doc;
			var visible = this._computeVisibility(doc);
			
			if( visible !== docInfo.visible ){
				if( visible ){
					added.push(doc);
				} else {
					removed.push(doc);
				};
				docInfo.visible = visible;
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
	
	_computeVisibility: function(doc){
		var visible = false;
		
		if( this.filterFn ){
			if( this.filterFn(doc) ){
				visible = true;
			};
		};
		
		return visible;
	}
});


//--------------------------------------------------------------------------
var ModelUnion = $n2.Class({
	
	dispatchService: null,

	modelId: null,
	
	sourceModelIds: null,
	
	docInfosByDocId: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			
			// From configuration
			,modelId: null
			,sourceModelIds: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.modelId = opts.modelId;

		// Source models
		this.sourceModelIds = {};
		if( opts.sourceModelIds ){
			for(var i=0,e=opts.sourceModelIds.length; i<e; ++i){
				var sourceModelId = opts.sourceModelIds[i];
				this.sourceModelIds[sourceModelId] = {};
			};
		};
		
		this.docInfosByDocId = {};

		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'modelGetInfo',f);
			this.dispatchService.register(DH, 'modelGetState', f);
			this.dispatchService.register(DH, 'modelStateUpdated', f);
			
			for(var sourceModelId in this.sourceModelIds){
				// Initialize state
				var state = $n2.model.getModelState({
					dispatchService: this.dispatchService
					,modelId: sourceModelId
				});
				if( state ){
					this._sourceModelUpdated(sourceModelId, state);
				};
			};
		};
		
		$n2.log('UnionModel',this);
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
					added.push(doc);
				};

				m.state = {
					added: added
					,updated: []
					,removed: []
				};
			};
			
		} else if( 'modelStateUpdated' === m.type ){
			// Does it come from one of our sources?
			if( this.sourceModelIds[m.modelId] ){
				this._sourceModelUpdated(m.modelId, m.state);
			};
		};
	},
	
	_getModelInfo: function(){
		var info = {
			modelId: this.modelId
			,modelType: 'union'
			,parameters: {}
		};
		
		return info;
	},
	
	_sourceModelUpdated: function(sourceModelId, sourceState){
		
		if( !this.sourceModelIds[sourceModelId] ){
			// Not one of our source models
			return;
		};
		
		var added = []
			,updated = []
			,removed = []
			;
		
		// Loop through all added and modified documents
		var addedAndModifiedDocs = sourceState.added ? sourceState.added.slice(0) : [];
		if( sourceState.updated ){
			addedAndModifiedDocs.push.apply(addedAndModifiedDocs, sourceState.updated);
		};
		for(var i=0,e=addedAndModifiedDocs.length; i<e; ++i){
			var doc = addedAndModifiedDocs[i];
			var docId = doc._id;

			var docInfo = this.docInfosByDocId[docId];
			if( !docInfo ){
				docInfo = {
					id: docId
					,doc: doc
					,rev: doc._rev
					,sources: {}
				};
				this.docInfosByDocId[docId] = docInfo;
				
				added.push(doc);
			};
			
			docInfo.sources[sourceModelId] = true;
			
			// Check if new revision
			if( docInfo.rev !== doc._rev ){
				// Modified
				docInfo.doc = doc;
				docInfo.rev = doc._rev;
				
				updated.push(doc);
			};
		};
		
		// Loop through all removed documents
		if( sourceState.removed ){
			for(var i=0,e=sourceState.removed.length; i<e; ++i){
				var doc = sourceState.removed[i];
				var docId = doc._id;
				var docInfo = this.docInfosByDocId[docId];
				if( docInfo ){
					docInfo.sources[sourceModelId] = false;
					
					var removedFlag = true;
					for(var modelId in docInfo.sources){
						if( docInfo.sources[modelId] ){
							removedFlag = false;
						};
					};
					
					if( removedFlag ){
						delete this.docInfosByDocId[docId];
						removed.push(doc);
					};
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
	}
});

//--------------------------------------------------------------------------
/*
 * Filter: a Document Model that filters out certain document
 * SchemaFilter: Allows documents that are identified by schema names
 */
var SchemaFilter = $n2.Class(ModelFilter, {
		
	schemaNameMap: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null

			// From configuration
			,modelId: null
			,sourceModelId: null
			,schemaName: null
			,schemaNames: null
		},opts_);
		
		var _this = this;
		
		this.schemaNameMap = {};
		if( typeof opts.schemaName === 'string' ){
			this.schemaNameMap[opts.schemaName] = true;
		};
		if( $n2.isArray(opts.schemaNames) ){
			for(var i=0,e=opts.schemaNames.length; i<e; ++i){
				var schemaName = opts.schemaNames[i];
				if( typeof schemaName === 'string' ){
					this.schemaNameMap[schemaName] = true;
				};
			};
		};
		
		opts.filterFn = function(doc){
			return _this._isDocVisible(doc);
		};
		opts.filterName = 'SchemaFilter';
		
		ModelFilter.prototype.initialize.call(this,opts);
	},
	
	_isDocVisible: function(doc){
		if( doc && doc.nunaliit_schema ){
			if( this.schemaNameMap[doc.nunaliit_schema] ){
				return true;
			};
		};
		return false;
	}
});

//--------------------------------------------------------------------------
/*
* Filter: a Document Model that filters out certain documents
* ReferenceFilter: Allows documents that are identified by references
*/
var ReferenceFilter = $n2.Class(ModelFilter, {
		
	referenceMap: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null

			// From configuration
			,modelId: null
			,sourceModelId: null
			,reference: null
			,references: null
		},opts_);
		
		var _this = this;
		
		this.referenceMap = {};
		if( typeof opts.reference === 'string' ){
			this.referenceMap[opts.reference] = true;
		};
		if( $n2.isArray(opts.references) ){
			for(var i=0,e=opts.references.length; i<e; ++i){
				var reference = opts.references[i];
				if( typeof reference === 'string' ){
					this.referenceMap[reference] = true;
				};
			};
		};
		
		opts.filterFn = function(doc){
			return _this._isDocVisible(doc);
		};
		opts.filterName = 'ReferenceFilter';
		
		ModelFilter.prototype.initialize.call(this,opts);
	},

	getReferences: function(){
		var references = [];
		for(var ref in this.referenceMap){
			references.push(ref);
		};
		return references;
	},

	setReferences: function(references){
		this.referenceMap = {};
		for(var i=0,e=references.length; i<e; ++i){
			var ref = references[i];
			this.referenceMap[ref] = true;
		};

		this._filterChanged();
	},
	
	_isDocVisible: function(doc){
		if( doc ){
			var links = [];
			$n2.couchUtils.extractLinks(doc, links);
			for(var i=0,e=links.length; i<e; ++i){
				var refId = links[i].doc;
				if( this.referenceMap[refId] ){
					return true;
				};
			};
		};
		return false;
	}
});

//--------------------------------------------------------------------------
/*
* Filter: a Document Model that filters out certain documents
* SingleDocumentFilter: Allows only one designed document
*/
var SingleDocumentFilter = $n2.Class(ModelFilter, {

	selectedDocParameter: null,

	selectedDocId: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null

			// From configuration
			,modelId: null
			,sourceModelId: null
			,selectedDocId: null
		},opts_);
		
		var _this = this;
		
		this.selectedDocId = opts.selectedDocId;
		
		this.selectedDocParameter = new $n2.model.ModelParameter({
			model: this
			,type: 'string'
			,name: 'selectedDocumentId'
			,label: 'Selected Document Id'
			,setFn: function(docId){
				_this._setSelectedDocId(docId);
			}
			,getFn: function(){
				return _this._getSelectedDocId();
			}
			,dispatchService: opts.dispatchService
		});
		
		opts.filterFn = function(doc){
			return _this._isDocVisible(doc);
		};
		opts.filterName = 'SingleDocumentFilter';
		
		ModelFilter.prototype.initialize.call(this,opts);
	},
	
	_getSelectedDocId: function(){
		return this.selectedDocId;
	},
	
	_setSelectedDocId: function(docId){
		this.selectedDocId = docId;
		
		this._filterChanged();
	},
	
	_addModelInfoParameters: function(info){
		info.parameters.selectedDocumentId = this.selectedDocParameter.getInfo();
	},
	
	_isDocVisible: function(doc){
		if( doc && doc._id === this.selectedDocId ){
			return true;
		};
		return false;
	}
});

//--------------------------------------------------------------------------
function handleModelCreate(m, addr, dispatcher){
	if( m.modelType === 'union' ){
		var options = {};
		
		if( m && m.modelOptions ){
			if( m.modelOptions.sourceModelIds 
			 && m.modelOptions.sourceModelIds.length ){
				options.sourceModelIds = m.modelOptions.sourceModelIds;
			};
		};

		options.modelId = m.modelId;
		
		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		new ModelUnion(options);
		
		m.created = true;

	} else if( m.modelType === 'filter' ){
		var options = {};
		
		if( m && m.modelOptions ){
			if( m.modelOptions.sourceModelId ){
				options.sourceModelId = m.modelOptions.sourceModelId;
			};
		};

		options.modelId = m.modelId;
		
		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		var filterFn = null;
		if( $n2.modelUtils.FilterFunctionFromModelConfiguration ){
			filterFn = $n2.modelUtils.FilterFunctionFromModelConfiguration(m.modelOptions);
		};
		if( filterFn ){
			options.filterFn = filterFn;
		} else {
			throw 'Unable to find function for filter model';
		};
		
		new ModelFilter(options);
		
		m.created = true;

	} else if( m.modelType === 'schemaFilter' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};
		
		options.modelId = m.modelId;

		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		new SchemaFilter(options);
		
		m.created = true;

	} else if( m.modelType === 'referenceFilter' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};
		
		options.modelId = m.modelId;

		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		new ReferenceFilter(options);
		
		m.created = true;

	} else if( m.modelType === 'singleDocumentFilter' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};
		
		options.modelId = m.modelId;

		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		new SingleDocumentFilter(options);
		
		m.created = true;
	};
};

//--------------------------------------------------------------------------
$n2.modelUtils = {
	ModelUnion: ModelUnion
	,ModelFilter: ModelFilter
	,FilterFunctionFromModelConfiguration: FilterFunctionFromModelConfiguration
	,SchemaFilter: SchemaFilter
	,ReferenceFilter: ReferenceFilter
	,handleModelCreate: handleModelCreate 
};

})(jQuery,nunaliit2);
