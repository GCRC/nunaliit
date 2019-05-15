/*
Copyright (c) 2016, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.modelFilter'
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
			var filterOnCondition = function(doc){
				// Re-use same context to avoid generating
				// temporary objects
				ctxt.n2_doc = doc;
				
				var value = condition.getValue(ctxt);

				ctxt.n2_doc = null;
				
				return value;
			};
			filterOnCondition.NAME = "filterOnCondition("+modelConf.condition+")";
			
			return filterOnCondition;
			
		} else if( 'all' === modelConf.useBuiltInFunction ){
			var allDocuments = function(doc){
				return true;
			};
			allDocuments.NAME = "allDocuments";
			
			return allDocuments;
			
		} else if( 'none' === modelConf.useBuiltInFunction ){
			var noDocument = function(doc){
				return false;
			};
			noDocument.NAME = "noDocument";
			
			return noDocument;
			
		} else if( 'withDates' === modelConf.useBuiltInFunction ){
			var withDates = function(doc){
				var dates = [];
				$n2.couchUtils.extractSpecificType(doc,'date',dates);
				return (dates.length > 0);
			};
			withDates.NAME = "withDates";
			
			return withDates;
			
		} else if( 'withoutDates' === modelConf.useBuiltInFunction ){
			var withoutDates = function(doc){
				var dates = [];
				$n2.couchUtils.extractSpecificType(doc,'date',dates);
				return (dates.length < 1);
			};
			withoutDates.NAME = "withoutDates";
			
			return withoutDates;

		} else if( 'withoutGeometry' === modelConf.useBuiltInFunction ){
			var withoutGeometry = function(doc){
				if( doc ){
					if( !doc.nunaliit_geom ){
						return true;
					};
				};
				return false;
			};
			withoutGeometry.NAME = "withoutGeometry";
			
			return withoutGeometry;
		};
	};
	
	return null;
};

//--------------------------------------------------------------------------
var ModelFilter = $n2.Class('ModelFilter',{
		
	dispatchService: null,

	modelId: null,
	
	sourceModelId: null,
	
	docInfosByDocId: null,
	
	modelIsLoading: null,
	
	filterFn: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,filterName: null
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
		if( !this.filterName ){
			this.filterName = this._classname;
		};
		
		this.docInfosByDocId = {};
		this.modelIsLoading = false;

		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handleModelFilterEvents(m, addr, dispatcher);
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
	
	_handleModelFilterEvents: function(m, addr, dispatcher){
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
					,loading: this.modelIsLoading
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

		if( typeof sourceState.loading === 'boolean' 
		 && this.modelIsLoading !== sourceState.loading ){
			this.modelIsLoading = sourceState.loading;
		};

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
				
				if( visible ){
					if( docInfo.visible ){
						// Is visible and used to be visible: update
						updated.push(doc);
					} else {
						// Is visible and did not used to be visible: added
						added.push(doc);
					};
				} else {
					if( docInfo.visible ){
						// Is not visible and used to be visible: remove
						removed.push(doc);
					} else {
						// Is not visible and did not used to be visible: nothing
					};
				};
				
				// Update visibility
				docInfo.visible = visible;
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
						// Has been removed, but used to be visible: remove
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
			
			// Compute new visibility
			var visible = this._computeVisibility(doc);
			
			if( visible ){
				if( docInfo.visible ){
					// Is visible and used to be visible: nothing
				} else {
					// Is visible and did not used to be visible: added
					added.push(doc);
				};
			} else {
				if( docInfo.visible ){
					// Is not visible and used to be visible: remove
					removed.push(doc);
				} else {
					// Is not visible and did not used to be visible: nothing
				};
			};
			
			// Update visibility
			docInfo.visible = visible;
		};

		this._reportStateUpdate(added, updated, removed);
	},
	
	_reportStateUpdate: function(added, updated, removed){
		var stateUpdate = {
			added: added
			,updated: updated
			,removed: removed
			,loading: this.modelIsLoading
		};

		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'modelStateUpdated'
				,modelId: this.modelId
				,state: stateUpdate
			});
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
/*
 * Filter: a Document Model that filters out certain document
 * SchemaFilter: Allows documents that are identified by schema names
 */
var SchemaFilterLegacy = $n2.Class('SchemaFilterLegacy', ModelFilter, {
		
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
		opts.filterName = 'SchemaFilterLegacy';
		
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
* SingleDocumentFilter: Allows only one specified document
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
/*
* Filter: a Document Model that filters out certain documents
* 
* SelectableDocumentFilter: Allows a user to choose which document to
* allow through using a set of choices. These choices can be changed
* using a widget.
* 
* Abstract Class. Subclasses must implement the following methods:
* - _computeAvailableChoicesFromDocs
* - _isDocVisible
* 
* Sublcasses may implement the following methods (optional):
* - _selectionChanged : Called when a change in selection is detected
* 
* Options:
* - modelId: String. Identifier for this model
* - sourceModelId: String. Identifier for the model where documents are obtained
* - initialSelection: Optional array of strings. If specified, the choices specified in the
*                     array are initially selected. The strings in the array are choice identifiers.
* - saveSelection: Optional object { enabled: <boolean>, name: <string> }. If specified, the 
*                  last selection is saved to local storage. When the model is reloaded, the saved
*                  selection is restored. If this option is enabled and a selection is restored,
*                  then the option "initialSelection" is ignored.
*/
var SelectableDocumentFilter = $n2.Class('SelectableDocumentFilter', {

	dispatchService: undefined,

	modelId: undefined,
	
	sourceModelId: undefined,
	
	saveSelection: undefined,
	
	saveSelectionName: undefined,

	docInfosByDocId: undefined,
	
	selectedChoicesParameter: undefined,

	allSelectedParameter: undefined,
	
	availableChoicesParameter: undefined,
	
	selectedChoiceIdMap: undefined,
	
	allSelected: undefined,

	availableChoices: undefined,
	
	modelIsLoading: undefined,

	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null

			// From configuration
			,modelId: null
			,sourceModelId: null
			,initialSelection: null
			,saveSelection: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.modelId = opts.modelId;
		this.sourceModelId = opts.sourceModelId;
		
		this.saveSelection = false;
		this.saveSelectionName = this.modelId;
		if( typeof opts.saveSelection === 'string' ){
			this.saveSelection = true;
			this.saveSelectionName = opts.saveSelection;

		} else if( typeof opts.saveSelection === 'boolean' ){
			if( opts.saveSelection ){
				this.saveSelection = true;
			};

		} else if( opts.saveSelection === null ){

		} else if( typeof opts.saveSelection === 'object' ){
			if( opts.saveSelection.enabled ){
				this.saveSelection = true;
				if( typeof opts.saveSelection.name === 'string' ){
					this.saveSelectionName = opts.saveSelection.name;
				};
			};
		};
		
		this.docInfosByDocId = {};
		this.selectedChoiceIdMap = {};
		this.allSelected = true;
		this.availableChoices = [];
		this.modelIsLoading = false;

		// Compute initial selection
		var initialSelectionComputed = false;
		var initialSelection;
		if( this.saveSelection ){
			var localStorage = $n2.storage.getLocalStorage();
			var jsonSelection = localStorage.getItem(this.saveSelectionName);
			if( '__ALL__' === jsonSelection ){
				// All was selected.
				initialSelectionComputed = true;
				this.allSelected = true;
				initialSelection = [];
			} else if( jsonSelection ){
				try {
					var loadedSelection = JSON.parse(jsonSelection);
					if( $n2.isArray(loadedSelection) ) {
						initialSelectionComputed = true;
						this.allSelected = false;
						initialSelection = loadedSelection;
					} else {
						$n2.logError('Unexpected initial selection loaded',loadedSelection);
					};
				} catch(e) {
					$n2.logError('Error while parsing JSON selection '+this.saveSelectionName,e);
				};
			};
		};
		if( !initialSelectionComputed && $n2.isArray(opts.initialSelection) ){
			initialSelectionComputed = true;
			this.allSelected = false;
			initialSelection = [];
			opts.initialSelection.forEach(function(choiceId){
				if( typeof choiceId === 'string' ){
					initialSelection.push(choiceId);
				} else {
					$n2.log('Error: SelectableDocumentFilter initialized with initial selection: '+choiceId);
				};
			});
		};
		if( !initialSelectionComputed ){
			// Default behaviour
			initialSelectionComputed = true;
			this.allSelected = true;
			initialSelection = [];
		};
		// Update selection objects
		initialSelection.forEach(function(choiceId){
			if( typeof choiceId === 'string' ){

				if( choiceId === "__ALL_CHOICES__" ){
					_this.allSelected = true;
				} else {
					_this.selectedChoiceIdMap[choiceId] = true;
					_this.availableChoices.push({
						id: choiceId
						,label: choiceId
					});
				};
			};
		});
		
		this.selectedChoicesParameter = new $n2.model.ModelParameter({
			model: this
			,modelId: this.modelId
			,type: 'strings'
			,name: 'selectedChoices'
			,label: _loc('Choices')
			,setFn: this._setSelectedChoices
			,getFn: this.getSelectedChoices
			,dispatchService: this.dispatchService
		});
		
		this.allSelectedParameter = new $n2.model.ModelParameter({
			model: this
			,modelId: this.modelId
			,type: 'boolean'
			,name: 'allSelected'
			,label: _loc('All Selected')
			,setFn: this._setAllSelected
			,getFn: this.getAllSelected
			,dispatchService: this.dispatchService
		});
		
		this.availableChoicesParameter = new $n2.model.ModelParameter({
			model: this
			,modelId: this.modelId
			,type: 'objects'
			,name: 'availableChoices'
			,label: _loc('Available Choices')
			,setFn: this._setAvailableChoices
			,getFn: this.getAvailableChoices
			,dispatchService: this.dispatchService
		});
		

		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handleSelectableDocumentFilterEvents(m, addr, dispatcher);
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
		
		$n2.log(this._classname,this);
	},
	
	getSelectedChoices: function(){
		var selectedChoices = [];
		for(var choiceId in this.selectedChoiceIdMap){
			selectedChoices.push(choiceId);
		};
		selectedChoices.sort();
		return selectedChoices;
	},

	_setSelectedChoices: function(choiceIdArray){
		var _this = this;
		
		if( !$n2.isArray(choiceIdArray) ){
			throw new Error('SelectableDocumentFilter._setSelectedChoices() should be an array of strings');
		};
		
		this.allSelected = false;
		this.selectedChoiceIdMap = {};
		choiceIdArray.forEach(function(choiceId){
			if( typeof choiceId !== 'string' ){
				throw new Error('SelectableDocumentFilter._setSelectedChoices() should be an array of strings');
			};
			_this.selectedChoiceIdMap[choiceId] = true;
		});

		// Save to local storage
		if( this.saveSelection ){
			var jsonSelection = JSON.stringify(choiceIdArray);
			var localStorage = $n2.storage.getLocalStorage();
			localStorage.setItem(this.saveSelectionName,jsonSelection);
		};

		this._selectionChanged(this.selectedChoiceIdMap, this.allSelected);
		this._filterChanged();
		
		this.allSelectedParameter.sendUpdate();
		this.selectedChoicesParameter.sendUpdate();
	},

	getAllSelected: function(){
		return this.allSelected;
	},

	_setAllSelected: function(flag){
		var _this = this;
		
		if( typeof flag !== 'boolean' ){
			throw new Error('SelectableDocumentFilter._setAllSelected() should be a boolean');
		};
		
		this.allSelected = flag;
		
		if( this.allSelected ){
			this.availableChoices.forEach(function(choice){
				_this.selectedChoiceIdMap[choice.id] = true;
			});
		};
		
		// Save to local storage
		if( this.saveSelection ){
			var jsonSelection = null;
			if( this.allSelected ){
				jsonSelection = '__ALL__';
			};
			if( jsonSelection ){
				var localStorage = $n2.storage.getLocalStorage();
				localStorage.setItem(this.saveSelectionName,jsonSelection);
			};
		};

		this._selectionChanged(this.selectedChoiceIdMap, this.allSelected);
		this._filterChanged();
		
		this.allSelectedParameter.sendUpdate();
		this.selectedChoicesParameter.sendUpdate();
	},

	getAvailableChoices: function(){
		return this.availableChoices;
	},

	_setAvailableChoices: function(){
		// Choices are generated by the set of documents, not externally
		throw new Error('SelectableDocumentFilter._setAvailableChoices() should never be called');
	},
	
	_updateAvailableChoices: function(availableChoices){
		var _this = this;

		if( !$n2.isArray(availableChoices) ){
			throw new Error('SelectableDocumentFilter._updateAvailableChoices() should be an array of choices');
		};
		availableChoices.forEach(function(choice){
			if( typeof choice !== 'object' ){
				throw new Error('SelectableDocumentFilter._updateAvailableChoices(): choice must be an object');
			};
			if( typeof choice.id !== 'string' ){
				throw new Error('SelectableDocumentFilter._updateAvailableChoices(): choice.id must be a string');
			};
		});
		this.availableChoices = availableChoices;
		
		this.availableChoicesParameter.sendUpdate();
		
		// If selecting all, then as new available choices arrive,
		// select them as well
		if( this.allSelected ){
			this.selectedChoiceIdMap = {};
			this.availableChoices.forEach(function(choice){
				_this.selectedChoiceIdMap[choice.id] = true;
			});

			this._selectionChanged(this.selectedChoiceIdMap, this.allSelected);
			this._filterChanged();

			this.selectedChoicesParameter.sendUpdate();
		};
	},
	
	_handleSelectableDocumentFilterEvents: function(m, addr, dispatcher){
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
					,loading: this.modelIsLoading
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
		info.parameters.selectedChoices = this.selectedChoicesParameter.getInfo();
		info.parameters.allSelected = this.allSelectedParameter.getInfo();
		info.parameters.availableChoices = this.availableChoicesParameter.getInfo();
	},
	
	_sourceModelUpdated: function(sourceState){
		
		var _this = this;
		
		var added = []
			,updated = []
			,removed = []
			;

		if( typeof sourceState.loading === 'boolean' 
		 && this.modelIsLoading !== sourceState.loading ){
			this.modelIsLoading = sourceState.loading;
		};

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
					if( docInfo.visible ){
						// Is visible and used to be visible: update
						updated.push(doc);
					} else {
						// Is visible and did not used to be visible: added
						added.push(doc);
					};
				} else {
					if( docInfo.visible ){
						// Is not visible and used to be visible: remove
						removed.push(doc);
					} else {
						// Is not visible and did not used to be visible: nothing
					};
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
				
				if( visible ){
					if( docInfo.visible ){
						// Is visible and used to be visible: update
						updated.push(doc);
					} else {
						// Is visible and did not used to be visible: added
						added.push(doc);
					};
				} else {
					if( docInfo.visible ){
						// Is not visible and used to be visible: remove
						removed.push(doc);
					} else {
						// Is not visible and did not used to be visible: nothing
					};
				};
				
				// Update visibility
				docInfo.visible = visible;
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
						// Has been removed, but used to be visible: remove
						removed.push(doc);
					};
				};
			};
		};

		// Report state update
		this._reportStateUpdate(added, updated, removed);
		
		// Recompute available choices from all documents
		var docs = [];
		for(var docId in this.docInfosByDocId){
			var docInfo = this.docInfosByDocId[docId];
			var doc = docInfo.doc;
			docs.push(doc);
		};
		var currentChoiceGeneration = $n2.getUniqueId();
		this.currentChoiceGeneration = currentChoiceGeneration;
		var availableChoices = this._computeAvailableChoicesFromDocs(docs, receiveChoices);
		if( availableChoices ){
			receiveChoices(availableChoices);
		};
		
		function receiveChoices(choices){
			if( _this.currentChoiceGeneration === currentChoiceGeneration ){
				_this._updateAvailableChoices(choices);
			};
		};
	},
	
	/*
	 * Subclasses must re-implement this function
	 * It must return an array of choice objects
	 * {
	 *    id: <string>
	 *    ,label: <string> optional
	 * }
	 * 
	 * There is two ways of implmenting this function:
	 * 1. Return an array of choices
	 * 2. Return null and call the callback function with the computed choices.
	 * 
	 * The second method allows an asynchronous approach
	 */
	_computeAvailableChoicesFromDocs: function(docs, callbackFn){
		throw new Error('Subclasses to SelectableDocumentFilter must implement _computeAvailableChoicesFromDocs()');
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
			
			// Compute new visibility
			var visible = this._computeVisibility(doc);
			
			if( visible ){
				if( docInfo.visible ){
					// Is visible and used to be visible: nothing
				} else {
					// Is visible and did not used to be visible: added
					added.push(doc);
				};
			} else {
				if( docInfo.visible ){
					// Is not visible and used to be visible: remove
					removed.push(doc);
				} else {
					// Is not visible and did not used to be visible: nothing
				};
			};
			
			// Update visibility
			docInfo.visible = visible;
		};

		this._reportStateUpdate(added, updated, removed);
	},
	
	_reportStateUpdate: function(added, updated, removed){
		var stateUpdate = {
			added: added
			,updated: updated
			,removed: removed
			,loading: this.modelIsLoading
		};

		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'modelStateUpdated'
				,modelId: this.modelId
				,state: stateUpdate
			});
		};
	},
	
	_computeVisibility: function(doc){
		return this._isDocVisible(doc, this.selectedChoiceIdMap, this.allSelected);
	},

	_isDocVisible: function(doc, selectedChoiceIdMap, allSelected){
		throw new Error('Subclasses to SelectableDocumentFilter must implement _isDocVisible()');
	},

	_selectionChanged: function(selectedChoiceIdMap, allSelected){
		// This can be implemented by a subclass to detect the changes in selection
	}
});

//--------------------------------------------------------------------------
var DocumentFilterByCreator = $n2.Class('DocumentFilterByCreator', SelectableDocumentFilter, {

	userInfoByName: null,
	
	currentChoices: null,

	currentCallback: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			modelId: null
			,sourceModelId: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		$n2.modelFilter.SelectableDocumentFilter.prototype.initialize.call(this,opts);
		
		this.userInfoByName = {};
		this.currentChoices = [];
		this.currentCallback = null;
		
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handleFilterByCreatorEvents(m, addr, dispatcher);
			};
			
			this.dispatchService.register(DH, 'userInfo', f);
		};
	},
	
	_handleFilterByCreatorEvents: function(m, addr, dispatcher){
		if( 'userInfo' === m.type ){
			var userInfo = m.userInfo;
			var userName = userInfo.name;
			
			this.userInfoByName[userName] = userInfo;
			
			this._recomuteAvailableChoices();
		};
	},
	
	_recomuteAvailableChoices: function(){
		var _this = this;

		if( this.currentChoices ){
			var choiceWasChanged = false;
			this.currentChoices.forEach(function(choice){
				var userInfo = _this.userInfoByName[choice.id];
				
				var label;
				if( userInfo ){
					label = userInfo.display;
				};
				if( !label ){
					label = choice.id;
				};
				
				if( label !== choice.label ){
					choice.label = label;
					choiceWasChanged = true;
				};
			});
			
			if( choiceWasChanged ){
				this.currentChoices.sort(function(a,b){
					if( a.label < b.label ){
						return -1;
					};
					if( a.label > b.label ){
						return 1;
					};
					return 0;
				});

				if( typeof this.currentCallback === 'function' ){
					this.currentCallback(this.currentChoices);
				};
			};
		};
	},

	_computeAvailableChoicesFromDocs: function(docs, callbackFn){
		var _this = this;

		var choiceLabelsById = {};
		var userNamesToFetch = [];
		docs.forEach(function(doc){
			if( doc && doc.nunaliit_created ){
				var userName = doc.nunaliit_created.name;
				var userInfo = _this.userInfoByName[userName];
				
				if( userInfo ){
					// OK
				} else {
					userNamesToFetch.push(userName);
				};

				if( userName && !choiceLabelsById[userName] ){
					choiceLabelsById[userName] = userName;
				};
			};
		});

		var availableChoices = [];
		for(var id in choiceLabelsById){
			var label = choiceLabelsById[id];
			availableChoices.push({
				id: id
				,label: label
			});
		};
		availableChoices.sort(function(a,b){
			if( a.label < b.label ){
				return -1;
			};
			if( a.label > b.label ){
				return 1;
			};
			return 0;
		});
		
		this.currentChoices = availableChoices;
		this.currentCallback = callbackFn;
		
		callbackFn(availableChoices);
		
		if( userNamesToFetch.length > 0 ){
			userNamesToFetch.forEach(function(userName){
				_this.dispatchService.send(DH,{
					type: 'requestUserDocument'
					,userId: userName
				});
			});
		};
		
		return null;
	},
	
	_isDocVisible: function(doc, selectedChoiceIdMap){
		if( doc 
		 && doc.nunaliit_created
		 && selectedChoiceIdMap[doc.nunaliit_created.name] ){
			return true;
		};
		
		return false;
	}
});

//--------------------------------------------------------------------------
var LayerFilter2 = $n2.Class('LayerFilter2', SelectableDocumentFilter, {

	layerDefinitionByLayerId: null,

	layerIdByDocId: null,

	currentChoices: null,

	currentCallback: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			modelId: null
			,sourceModelId: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		$n2.modelFilter.SelectableDocumentFilter.prototype.initialize.call(this,opts);
		
		this.layerDefinitionByLayerId = {};
		this.layerIdByDocId = {};
		this.currentChoices = [];
		this.currentCallback = null;
		
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handleLayerFilterEvents(m, addr, dispatcher);
			};
			
			this.dispatchService.register(DH,'documentContent',f);
			this.dispatchService.register(DH,'documentContentCreated',f);
			this.dispatchService.register(DH,'documentContentUpdated',f);
			this.dispatchService.register(DH,'documentDeleted',f);
		};
	},
	
	_handleLayerFilterEvents: function(m, addr, dispatcher){
		if( 'documentContent' === m.type 
		 || 'documentContentCreated' === m.type
		 || 'documentContentUpdated' === m.type ){
			if( m.doc ){
				if( m.doc.nunaliit_layer_definition ){
					var layerId = m.doc.nunaliit_layer_definition.id;
					if( !layerId ){
						layerId = m.doc._id;
					};
					this.layerIdByDocId[m.doc._id] = layerId;
					this.layerDefinitionByLayerId[layerId] = m.doc;
					this._recomuteAvailableChoices();

				} else if( this.layerIdByDocId[m.doc._id] ){
					var layerId = this.layerIdByDocId[m.doc._id];
					delete this.layerIdByDocId[m.doc._id];
					delete this.layerDefinitionByLayerId[layerId];
					this._recomuteAvailableChoices();
				};
			};

		} else if( 'documentDeleted' === m.type ){
			if( this.layerIdByDocId[m.docId] ){
				var layerId = this.layerIdByDocId[m.docId];
				delete this.layerIdByDocId[m.docId];
				delete this.layerDefinitionByLayerId[layerId];
				this._recomuteAvailableChoices();
			};
		};
	},
	
	_recomuteAvailableChoices: function(){
		var _this = this;

		if( this.currentChoices ){
			var choiceWasChanged = false;
			this.currentChoices.forEach(function(choice){
				var layerDefinition = _this.layerDefinitionByLayerId[choice.id];
				
				var label;
				if( layerDefinition 
				 && layerDefinition.nunaliit_layer_definition 
				 && layerDefinition.nunaliit_layer_definition.name ){
					label = _loc(layerDefinition.nunaliit_layer_definition.name);
				};
				if( !label ){
					label = choice.id;
				};
				
				if( label !== choice.label ){
					choice.label = label;
					choiceWasChanged = true;
				};
			});
			
			if( choiceWasChanged ){
				this.currentChoices.sort(function(a,b){
					if( a.label < b.label ){
						return -1;
					};
					if( a.label > b.label ){
						return 1;
					};
					return 0;
				});

				if( typeof this.currentCallback === 'function' ){
					this.currentCallback(this.currentChoices);
				};
			};
		};
	},

	_computeAvailableChoicesFromDocs: function(docs, callbackFn){
		var _this = this;

		var choiceLabelsById = {};
		var layerIdsToFetch = [];
		docs.forEach(function(doc){
			if( doc && $n2.isArray(doc.nunaliit_layers) ){
				doc.nunaliit_layers.forEach(function(layerId){
					var layerDefinition = _this.layerDefinitionByLayerId[layerId];

					if( layerDefinition ){
						// OK
					} else {
						layerIdsToFetch.push(layerId);
					};

					if( layerId && !choiceLabelsById[layerId] ){
						if( layerDefinition 
						 && layerDefinition.nunaliit_layer_definition
						 && layerDefinition.nunaliit_layer_definition.name ){
							choiceLabelsById[layerId] = _loc(layerDefinition.nunaliit_layer_definition.name);
						} else {
							choiceLabelsById[layerId] = layerId;
						};
					};
				});
			};
		});

		var availableChoices = [];
		for(var id in choiceLabelsById){
			var label = choiceLabelsById[id];
			availableChoices.push({
				id: id
				,label: label
			});
		};
		availableChoices.sort(function(a,b){
			if( a.label < b.label ){
				return -1;
			};
			if( a.label > b.label ){
				return 1;
			};
			return 0;
		});
		
		this.currentChoices = availableChoices;
		this.currentCallback = callbackFn;
		
		callbackFn(availableChoices);
		
		if( layerIdsToFetch.length > 0 ){
			this.dispatchService.send(DH,{
				type: 'requestLayerDefinitions'
				,layerIds: layerIdsToFetch
			});
		};
		
		return null;
	},
	
	_isDocVisible: function(doc, selectedChoiceIdMap){
		if( doc 
		 && $n2.isArray(doc.nunaliit_layers) ){
			for(var i in doc.nunaliit_layers){
				var layerId = doc.nunaliit_layers[i];
				if( selectedChoiceIdMap[layerId] ){
					return true;
				};
			};
		};
		
		return false;
	}
});

//--------------------------------------------------------------------------
var SchemaFilter = $n2.Class('SchemaFilter', SelectableDocumentFilter, {

	schemaRepository: null,

	schemasByName: null,

	currentChoices: null,

	currentCallback: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			modelId: undefined
			,sourceModelId: undefined
			,dispatchService: undefined
			,schemaRepository: undefined
			
			// From options
			,initialSelection: undefined
			,schemaName: undefined
			,schemaNames: undefined
		},opts_);
		
		var _this = this;
		
		// For compatibility with older version of SchemaFilter, schemaName and schemaNames are mapped on
		// initialSelection
		if( typeof opts.schemaName === 'string' ){
			if( !opts.initialSelection ){
				opts.initialSelection = [];
			};
			opts.initialSelection.push(opts.schemaName);
		};
		if( $n2.isArray(opts.schemaNames) ){
			if( !opts.initialSelection ){
				opts.initialSelection = [];
			};
			opts.schemaNames.forEach(function(schemaName){
				if( typeof schemaName === 'string' ){
					opts.initialSelection.push(schemaName);
				};
			});
		};
		
		$n2.modelFilter.SelectableDocumentFilter.prototype.initialize.call(this,opts);
		
		this.schemaRepository = opts.schemaRepository;
		this.schemasByName = {};
		this.currentChoices = [];
		this.currentCallback = null;
	},
	
	_recomuteAvailableChoices: function(){
		var _this = this;

		if( this.currentChoices ){
			var choiceWasChanged = false;
			this.currentChoices.forEach(function(choice){
				var schema = _this.schemasByName[choice.id];
				
				var label;
				if( schema ){
					label = schema.getLabel();
				};
				if( !label ){
					label = choice.id;
				};
				
				if( label !== choice.label ){
					choice.label = label;
					choiceWasChanged = true;
				};
			});
			
			if( choiceWasChanged ){
				this.currentChoices.sort(function(a,b){
					if( a.label < b.label ){
						return -1;
					};
					if( a.label > b.label ){
						return 1;
					};
					return 0;
				});

				if( typeof this.currentCallback === 'function' ){
					this.currentCallback(this.currentChoices);
				};
			};
		};
	},

	_computeAvailableChoicesFromDocs: function(docs, callbackFn){
		var _this = this;

		var choiceLabelByName = {};
		var fetchSchemaNamesMap = {};
		docs.forEach(function(doc){
			if( doc 
			 && typeof doc.nunaliit_schema === 'string' ){
				var name = doc.nunaliit_schema;
				var schema = _this.schemasByName[name];

				if( schema ){
					// OK
				} else {
					fetchSchemaNamesMap[name] = true;
				};

				if( name && !choiceLabelByName[name] ){
					if( schema ){
						choiceLabelByName[name] = schema.getLabel();
					} else {
						choiceLabelByName[name] = name;
					};
				};
			};
		});

		var availableChoices = [];
		for(var id in choiceLabelByName){
			var label = choiceLabelByName[id];
			availableChoices.push({
				id: id
				,label: label
			});
		};
		availableChoices.sort(function(a,b){
			if( a.label < b.label ){
				return -1;
			};
			if( a.label > b.label ){
				return 1;
			};
			return 0;
		});
		
		this.currentChoices = availableChoices;
		this.currentCallback = callbackFn;
		
		callbackFn(availableChoices);
		
		var fetchSchemaNames = $n2.utils.keys(fetchSchemaNamesMap);
		if( fetchSchemaNames.length > 0 
		 && this.schemaRepository ){
			this.schemaRepository.getSchemas({
				names: fetchSchemaNames
				,onSuccess: function(schemas){
					schemas.forEach(function(schema){
						var name = schema.name;
						_this.schemasByName[name] = schema;
					});
					
					_this._recomuteAvailableChoices();
				}
				,onError: function(err){
					// ignore
				}
			});
		};
		
		return null;
	},
	
	_isDocVisible: function(doc, selectedChoiceIdMap){
		if( doc 
		 && typeof doc.nunaliit_schema === 'string' ){
			if( selectedChoiceIdMap[doc.nunaliit_schema] ){
				return true;
			};
			
			return false;
		};
		
		return true;
	}
});

// --------------------------------------------------------------------------
// Filter: a Document Model that filters out certain documents                                                      |         ----------------------------------------------------------------------------------------------------------------
// MultiDocumentFilter: Allows only specified documents  
var MultiDocumentFilter = $n2.Class('MultiDocumentFilter', SelectableDocumentFilter, {

	selectedDocIds: null,

	selectionById: null,

	currentChoices: null,

	currentCallback: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			modelId: undefined
			,sourceModelId: undefined
			,dispatchService: undefined
			,schemaRepository: undefined
			,selectedDocIds: undefined
		},opts_);
		
		var _this = this;
		
		if ($n2.isArray(opts.selectedDocIds)) {
			this.selectedDocIds = opts.selectedDocIds;
		} else {
			throw new Error('MultiDocumentFilter requires a selectedDocIds property');
		}
		
		$n2.modelFilter.SelectableDocumentFilter.prototype.initialize.call(this,opts);
		
		this.currentChoices = [];
		this.currentCallback = null;
	},

	_computeAvailableChoicesFromDocs: function(docs, callbackFn){
		var _this = this;

		var choiceLabelById = [];
		docs.forEach(function(doc){
			if (doc && doc._id) {
				if (_this.selectedDocIds.indexOf(doc._id) >= 0) {
					choiceLabelById.push(doc._id);
				}
			}
		});

		var availableChoices = [];
		choiceLabelById.forEach(function(id) {
			var label = choiceLabelById[id];
			availableChoices.push({
				id: id
				,label: id
			});
		});

		availableChoices.sort(function(a,b){
			if (a.label < b.label) {
				return -1;
			}

			if (a.label > b.label) {
				return 1;
			}

			return 0;
		});
		
		this.currentChoices = availableChoices;
		this.currentCallback = callbackFn;
		
		callbackFn(availableChoices);
		
		return null;
	},

	_isDocVisible: function(doc, selectedChoiceIdMap){
		var i, e;
			
		if (doc && doc._id) {
			if (selectedChoiceIdMap[doc._id]) {
				return true;
			}
		}
		return false;
	}
});

//--------------------------------------------------------------------------
function handleModelCreate(m, addr, dispatcher){
	if( m.modelType === 'filter' ){
		var options = {};
		
		if( m && m.modelOptions ){
			if( m.modelOptions.sourceModelId ){
				options.sourceModelId = m.modelOptions.sourceModelId;
			};
		};

		options.modelId = m.modelId;
		options.modelType = m.modelType;
		
		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		var filterFn = null;
		if( $n2.modelUtils.FilterFunctionFromModelConfiguration ){
			filterFn = $n2.modelUtils.FilterFunctionFromModelConfiguration(m.modelOptions);
			if( filterFn.NAME ){
				options.filterName = 'FilterModel - ' + filterFn.NAME;
			};
		};
		if( filterFn ){
			options.filterFn = filterFn;
		} else {
			throw 'Unable to find function for filter model';
		};
		
		m.model = new ModelFilter(options);
		
		m.created = true;

	} else if( m.modelType === 'schemaFilterLegacy' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};
		
		options.modelId = m.modelId;
		options.modelType = m.modelType;

		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		m.model = new SchemaFilterLegacy(options);
		
		m.created = true;

	} else if( m.modelType === 'referenceFilter' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};
		
		options.modelId = m.modelId;
		options.modelType = m.modelType;

		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		m.model = new ReferenceFilter(options);
		
		m.created = true;

	} else if( m.modelType === 'singleDocumentFilter' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};
		
		options.modelId = m.modelId;
		options.modelType = m.modelType;

		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		m.model = new SingleDocumentFilter(options);
		
		m.created = true;

	} else if( m.modelType === 'documentFilterByCreator' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};
		
		options.modelId = m.modelId;
		options.modelType = m.modelType;

		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		m.model = new DocumentFilterByCreator(options);
		
		m.created = true;

	} else if( m.modelType === 'layerFilter2' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};
		
		options.modelId = m.modelId;
		options.modelType = m.modelType;

		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		m.model = new LayerFilter2(options);
		
		m.created = true;

	} else if( m.modelType === 'schemaFilter' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};
		
		options.modelId = m.modelId;
		options.modelType = m.modelType;

		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
				options.schemaRepository = m.config.directory.schemaRepository;
			};
		};
		
		m.model = new SchemaFilter(options);
		
		m.created = true;

	} else if( m.modelType === 'multiDocumentFilter' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};
		
		options.modelId = m.modelId;
		options.modelType = m.modelType;

		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		m.model = new MultiDocumentFilter(options);
		
		m.created = true;
	};
};

//--------------------------------------------------------------------------
$n2.modelFilter = {
	ModelFilter: ModelFilter
	,FilterFunctionFromModelConfiguration: FilterFunctionFromModelConfiguration
	,SchemaFilterLegacy: SchemaFilterLegacy
	,ReferenceFilter: ReferenceFilter
	,SelectableDocumentFilter: SelectableDocumentFilter
	,LayerFilter2: LayerFilter2
	,SchemaFilter: SchemaFilter
	,handleModelCreate: handleModelCreate 
};

})(jQuery,nunaliit2);
