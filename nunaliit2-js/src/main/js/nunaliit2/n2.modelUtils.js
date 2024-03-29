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
var ModelUnion = $n2.Class({
	
	dispatchService: null,

	modelId: null,
	
	sourceModelIds: null,
	
	docInfosByDocId: null,
	
	loadingMap: null,
	
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
		this.loadingMap = {};

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
	
	isLoading: function(){
		for(var modelId in this.loadingMap){
			var loading = this.loadingMap[modelId];
			if( loading ){
				return true;
			};
		};
		return false;
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
					,loading: this.isLoading()
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
		
		if( typeof sourceState.loading === 'boolean' ){
			this.loadingMap[sourceModelId] = sourceState.loading;
		};
		
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
			}
			else {
				// Modified
				docInfo.doc = doc;
				docInfo.rev = doc._rev;
				updated.push(doc);
			}
			docInfo.sources[sourceModelId] = true;
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
		var stateUpdate = {
			added: added
			,updated: updated
			,removed: removed
			,loading: this.isLoading()
		};

		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'modelStateUpdated'
				,modelId: this.modelId
				,state: stateUpdate
			});
		};
	}
});

//--------------------------------------------------------------------------
var ModelIntersect = $n2.Class({
	
	dispatchService: null,

	modelId: null,
	
	sourceModelIds: null,
	
	docInfosByDocId: null,
	
	loadingMap: null,
	
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
		this.loadingMap = {};

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
		
		$n2.log('IntersectModel',this);
	},
	
	isLoading: function(){
		for(var modelId in this.loadingMap){
			var loading = this.loadingMap[modelId];
			if( loading ){
				return true;
			};
		};
		return false;
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

					if( docInfo.visible ){
						var doc = docInfo.doc;
						added.push(doc);
					};
				};

				m.state = {
					added: added
					,updated: []
					,removed: []
					,loading: this.isLoading()
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
			,modelType: 'intersect'
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
		
		if( typeof sourceState.loading === 'boolean' ){
			this.loadingMap[sourceModelId] = sourceState.loading;
		};
		
		// Loop through all added and modified documents
		var addedAndModifiedDocs = sourceState.added ? sourceState.added.slice(0) : [];
		if( sourceState.updated ){
			addedAndModifiedDocs.push.apply(addedAndModifiedDocs, sourceState.updated);
		};
		for(var i=0,e=addedAndModifiedDocs.length; i<e; ++i){
			var doc = addedAndModifiedDocs[i];
			var docId = doc._id;
			
			
			// Flag docs to be removed if not in they currently exist in the docsInfoByDocId exist and the model 
			
			
			var docInfo = this.docInfosByDocId[docId];
			if( !docInfo ){
				docInfo = {
					id: docId
					,visible: false
					,doc: doc
					,rev: doc._rev
					,sources: {}
				};
				this.docInfosByDocId[docId] = docInfo;
			};
			docInfo.sources[sourceModelId] = true;
			
			// Check change in visibility
			var visible = this._isDocVisible(doc);
			if( visible && !docInfo.visible ){
				added.push(doc);
			} else if( !visible && docInfo.visible ){
				removed.push(doc);
			} else if( visible && docInfo.visible ) {
				// Modified
				docInfo.doc = doc;
				docInfo.rev = doc._rev;
				updated.push(doc);
			} else {
				// Do not worry about it
			};
			docInfo.visible = visible;
		};
		
		// Loop through all removed documents
		if( sourceState.removed ){
			for(var i=0,e=sourceState.removed.length; i<e; ++i){
				var doc = sourceState.removed[i];
				var docId = doc._id;
				var docInfo = this.docInfosByDocId[docId];
				if( docInfo ){
					// Mark that this source no longer reports it
					docInfo.sources[sourceModelId] = false;

					// Check change in visibility
					if( docInfo.visible ){
						docInfo.visible = false;
						removed.push(doc);
					};
					
					// Check if we keep it
					var removedFlag = true;
					for(var modelId in docInfo.sources){
						if( docInfo.sources[modelId] ){
							removedFlag = false;
						};
					};
					
					if( removedFlag ){
						delete this.docInfosByDocId[docId];
					};
				};
			};
		};

		this._reportStateUpdate(added, updated, removed);
	},
	
	_reportStateUpdate: function(added, updated, removed){
		var stateUpdate = {
			added: added
			,updated: updated
			,removed: removed
			,loading: this.isLoading()
		};

		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'modelStateUpdated'
				,modelId: this.modelId
				,state: stateUpdate
			});
		};
	},
	
	_isDocVisible: function(doc){
		var docId = doc._id;
		var docInfo = this.docInfosByDocId[docId];
		
		for(var sourceModelId in this.sourceModelIds){
			if( !docInfo.sources[sourceModelId] ) {
				return false;
			};
		};
		
		return true;
	}
});

/*
 * @class
 * A model transform which joins multiple documents of different schemas based
 * on supplied join fields. This transformation functions by copying the copy
 * from schema's document content into the copy to schema's document under a
 * '_<schema-name>' key.
 *
 * @param {string} sourceModelId - Id of the source model.
 * @param {array} joins - list of joins between different schemas.
 * Note: Joins are performed in the order they are listed, and join transforms
 * persist between each process.
 *
 * Example:
 *		"joins": [
 *			{
 *				"copyToSchema": "testatlas_account",
 *				"copyToJoinKey": "doc.testatlas_account.bank.doc",
 *				"copyFromSchema": "testatlas_bank",
 *				"copyFromJoinKey": "doc._id"
 *			},
 *			{
 *				"copyToSchema": "testatlas_account",
 *				"copyToJoinKey": "doc.testatlas_account.person.doc",
 *				"copyFromSchema": "testatlas_person",
 *				"copyFromJoinKey": "doc._id"
 *			}
 *		]
 */
var ModelSchemaJoinTransform = $n2.Class('ModelSchemaJoinTransform', {

	modelType: null,
	dispatchService: null,
	sourceModelId: null,
	joinNum: null,
	joins: null,
	copyToSchema: null,
	copyFromSchema: null,
	copyToJoinKey: null,
	copyFromJoinKey: null,
	keysToCopy: null,
	addedMap: null,
	updatedMap: null,
	removedMap: null,
	docInfosByDocId: null,
	schemaDocsByDocId: null,
	copyToSchemaDocsByDocId: null,
	copyFromSchemaDocsByDocId: null,
	modelIsLoading: null,

	initialize: function(opts_) {
		var dispatchFn, msg;
		var opts = $n2.extend({
			modelId: null,
			sourceModelId: null,
			informationModelIds: null,
			dispatchService: null,
			joinNum: 0,
			joins: null
		},opts_);

		var _this = this;

		this.modelType = 'ModelSchemaJoinTransform';
		this.modelId = opts.modelId;
		this.modelIsLoading = false;
		this.dispatchService = opts.dispatchService;
		this.sourceModelId = opts.sourceModelId;
		this.joinNum = opts.joinNum;

		if ($n2.isArray(opts.joins)
			&& opts.joins.length) {
			this.joins = opts.joins;

			// Set the initial copy to and copy from schemas to be joined
			this._setSchemasToJoin(this.joins[this.joinNum]);

		} else {
			throw new Error('Joins needs to be an array.');
		}

		this.addedMap = {};
		this.updatedMap = {};
		this.removedMap = {};
		this.docInfosByDocId = {};
		this.schemaDocsByDocId = {};
		this.copyToSchemaDocsByDocId = {};
		this.copyFromSchemaDocsByDocId = {};

		// Register to events
		if (this.dispatchService) {
			dispatchFn = function(m, addr, dispatcher) {
				_this._handle(m, addr, dispatcher);
			};

			this.dispatchService.register(DH, 'modelGetInfo', dispatchFn);
			this.dispatchService.register(DH, 'modelGetState', dispatchFn);
			this.dispatchService.register(DH, 'modelStateUpdated', dispatchFn);

			// Initialize state
			msg = {
				type: 'modelGetState',
				modelId: this.sourceModelId
			};

			this.dispatchService.synchronousCall(DH, msg);
			if (msg.state) {
				this._sourceModelUpdated(msg.state);
			}
		}

		$n2.log(this._classname,this);
	},

	// Set schemas and join keys used for the transform.
	_setSchemasToJoin: function(joinInfo) {
		if (joinInfo) {
			if (joinInfo.copyToSchema
				&& typeof joinInfo.copyToSchema === 'string') {
				this.copyToSchema = joinInfo.copyToSchema;
			} else {
				this.copyToSchema = undefined;
			}

			if (joinInfo.copyFromSchema
				&& typeof joinInfo.copyFromSchema === 'string') {
				this.copyFromSchema = joinInfo.copyFromSchema;
			} else {
				this.copyFromSchema = undefined;
			}

			if (joinInfo.copyToJoinKey
				&& typeof joinInfo.copyToJoinKey === 'string') {
				this.copyToJoinKey = joinInfo.copyToJoinKey;
			} else {
				this.copyToJoinKey = undefined;
			}

			if (joinInfo.copyFromJoinKey
				&& typeof joinInfo.copyFromJoinKey === 'string') {
				this.copyFromJoinKey = joinInfo.copyFromJoinKey;
			} else {
				this.copyFromJoinKey = undefined;
			}

			if (joinInfo.keysToCopy
				&& $n2.isArray(joinInfo.keysToCopy)
				&& joinInfo.keysToCopy.length) {
				this.keysToCopy = joinInfo.keysToCopy;

				// Add doc id key if not specified in keys to copy
				if (this.keysToCopy.indexOf('doc._id') < 0) {
					this.keysToCopy.push('doc._id');
				}
			} else {
				this.keysToCopy = undefined;
			}
		}
	},

	_handle: function(m, addr, dispatcher) {
		var added, docInfo, docInfoKeys, doc;
		var _this = this;
		if (m.type === 'modelGetInfo') {
			if (this.modelId === m.modelId) {
				m.modelInfo = this._getModelInfo();
			}

		} else if (m.type === 'modelGetState') {
			if (this.modelId === m.modelId) {
				added = [];
				docInfoKeys = Object.keys(this.docInfosByDocId);
				docInfoKeys.forEach(function(docId) {
					docInfo = _this.docInfosByDocId[docId];
					doc = docInfo.doc;
					added.push(doc);
				});

				m.state = {
					added: added,
					updated: [],
					removed: [],
					loading: this.modelIsLoading
				};
			}

		} else if (m.type === 'modelStateUpdated') {
			// Does it come from our source?
			if (this.sourceModelId === m.modelId) {
				this._sourceModelUpdated(m.state);
			}
		}
	},

	_getModelInfo: function() {
		var modelInfo = {
			modelId: this.modelId,
			modelType: this.modelType,
			parameters: {}
		};
		return modelInfo;
	},

	_sourceModelUpdated: function(sourceState) {
		var i, e, doc, docId, docInfo;
		var added, updated, removed, schema, schemaDocs;
		var processingRequired = false;
		this.addedMap = {};
		this.updatedMap = {};
		this.removedMap = {};
		this.joinNum = 0;

		if (typeof sourceState.loading === 'boolean'
			&& this.modelIsLoading !== sourceState.loading) {
			this.modelIsLoading = sourceState.loading;
		}

		// Loop through all added documents
		if (sourceState.added) {
			for (i = 0, e = sourceState.added.length; i < e; i += 1) {
				doc = sourceState.added[i];
				docId = doc._id;
				docInfo = {
					id: docId,
					doc: doc,
					original: doc
				};

				if (doc.nunaliit_schema) {
					schema = doc.nunaliit_schema;
					if (!Object.hasOwnProperty.call(this.schemaDocsByDocId, schema)) {
						this.schemaDocsByDocId[schema] = {};
					}

					// Divide added documents by schemas
					schemaDocs = this.schemaDocsByDocId[schema];
					schemaDocs[docId] = docInfo;
					this.docInfosByDocId[docId] = docInfo;
					this.addedMap[docId] = doc;
					processingRequired = true;
				}
			}
		}

		// Loop through all updated documents
		if (sourceState.updated) {
			for (i = 0, e = sourceState.updated.length; i < e; i += 1) {
				doc = sourceState.updated[i];
				docId = doc._id;
				docInfo = {
					id: docId,
					doc: doc,
					original: doc
				};

				if (doc.nunaliit_schema) {
					schema = doc.nunaliit_schema;
					if (!Object.hasOwnProperty.call(this.schemaDocsByDocId, schema)) {
						this.schemaDocsByDocId[schema] = {};
					}

					// Divide updated documents by schemas
					schemaDocs = this.schemaDocsByDocId[schema];
					delete schemaDocs[docId];
					schemaDocs[docId] = docInfo;
					this.docInfosByDocId[docId] = docInfo;
					this.updatedMap[docId] = doc;
					processingRequired = true;
				}
			}
		}

		// Loop through all removed documents
		if (sourceState.removed) {
			for (i = 0, e = sourceState.removed.length; i < e; i += 1) {
				doc = sourceState.removed[i];
				docId = doc._id;

				if (doc.nunaliit_schema) {
					schema = doc.nunaliit_schema;

					schemaDocs = this.schemaDocsByDocId[schema];
					delete schemaDocs[docId];
					delete this.docInfosByDocId[docId];
					this.removedMap[docId] = doc;
					processingRequired = true;
				}
			}
		}

		if (processingRequired) {
			if (!this.modelIsLoading) {
				this._joinSchemaDocs();
			}

			// Report changes
			added = $n2.utils.values(this.addedMap);
			updated = $n2.utils.values(this.updatedMap);
			removed = $n2.utils.values(this.removedMap);
			this._reportStateUpdate(added, updated, removed);
		}

	},

	// Entry function to start copy to schema document transformations
	_joinSchemaDocs: function() {
		var docId, docInfo, doc, transform, i, copyToSchemaDocIds;
		var added, updated, removed;
		this.copyToSchemaDocsByDocId = this.schemaDocsByDocId[this.copyToSchema] || {};

		copyToSchemaDocIds = Object.keys(this.copyToSchemaDocsByDocId);

		// Loop over all documents, recomputing doc transforms
		for (i = 0; i < copyToSchemaDocIds.length; i += 1) {
			docId = copyToSchemaDocIds[i];
			docInfo = this.copyToSchemaDocsByDocId[docId];
			doc = docInfo.joined || docInfo.original;

			if (Object.hasOwnProperty.call(this.schemaDocsByDocId, this.copyFromSchema)) {
				this.copyFromSchemaDocsByDocId = this.schemaDocsByDocId[this.copyFromSchema] || {};

				// Check that copyFrom dictionary has items
				if (Object.keys(this.copyFromSchemaDocsByDocId).length) {
					// transform the document
					transform = this._computeTransform(doc);

					if (doc === transform) {
						// No transform
					} else {
						// A transform was computed
						docInfo.doc = undefined;
						docInfo.doc = transform;

						// Update copy to schema original doc for future joins
						docInfo.joined = transform;
						this.copyToSchemaDocsByDocId[docId] = docInfo;

						// Find where it belongs
						if (this.addedMap[docId]) {
							this.addedMap[docId] = transform;
						} else if (this.updatedMap[docId]) {
							this.updatedMap[docId] = transform;
						} else if (this.removedMap[docId]) {
							// just leave previous
						} else {
							// Not already in list. Add to update list
							this.updatedMap[docId] = transform;
						}
					}
				}
			}
		}

		// Perform next schema docs join.
		if (this.joinNum < this.joins.length - 1) {
			this.joinNum += 1;
			this._setSchemasToJoin(this.joins[this.joinNum]);
			this._joinSchemaDocs();

		} else {
			// Report changes if no more transformations are needed.
			added = $n2.utils.values(this.addedMap);
			updated = $n2.utils.values(this.updatedMap);
			removed = $n2.utils.values(this.removedMap);
			this._reportStateUpdate(added, updated, removed);
		}
	},

	// Checks if an object is a Nunaliit reference object
	_isNunaliitRefObj: function(obj) {
		if (typeof obj === 'object'
			&& Object.hasOwnProperty.call(obj, 'nunaliit_type')
			&& obj.nunaliit_type === 'reference'
			&& Object.hasOwnProperty.call(obj, 'doc')
			&& typeof obj.doc === 'string') {
			return true;
		}
	},

	// Update an object with the supplied key structure and value.
	_updateObjWithKeyString: function(obj, keyString, keyValue) {
		var keysSplit = keyString.split('.');
		var firstKey = keysSplit.shift();

		if (keysSplit.length) {
			if (!Object.hasOwnProperty.call(obj, firstKey)) {
				// Add object property if it doesn't exist.
				obj[firstKey] = {};
				this._updateObjWithKeyString(obj[firstKey], keysSplit.join('.'), keyValue);
			} else {
				this._updateObjWithKeyString(obj[firstKey], keysSplit.join('.'), keyValue);
			}
		} else {
			obj[firstKey] = keyValue;
		}
	},

	// Recursive function which gets a join key value from a document object.
	// If the object doesn't have the key, it returns false.
	_getKeyValues: function(obj, keyString) {
		var i, value, keyValue, item, itemValue;
		var keysSplit = keyString.split('.');
		var firstKey = keysSplit.shift();

		if (keysSplit.length) {
			if (Object.hasOwnProperty.call(obj, firstKey)) {
				// Check next property in keysSplit list
				value = this._getKeyValues(obj[firstKey], keysSplit.join('.'));
			} else {
				// Object doesn't include property
				value = false;
			}

		} else {
			// Check final property in object, and handle if its a string,
			// array, or document reference.
			if (Object.hasOwnProperty.call(obj, firstKey)) {
				keyValue = obj[firstKey];
				if (this._isNunaliitRefObj(keyValue)) {
					value = keyValue.doc;
				} else if (typeof keyValue === 'string') {
					value = keyValue;
				} else if ($n2.isArray(keyValue)
					&& keyValue.length) {
					value = [];
					for (i = 0; i < keyValue.length; i += 1) {
						item = keyValue[i];
						if (this._isNunaliitRefObj(item)) {
							itemValue = item.doc;
							value.push(itemValue);
						} else if (typeof item === 'string') {
							value.push(item);
						}
					}
				}
			} else {
				value = false;
			}
		}

		return value;
	},

	// Get specific key content from copyFrom schema document.
	_copyKeyContent: function(doc) {
		var i, key, keyValue;
		var copiedKeysObj = {};

		for (i = 0; i < this.keysToCopy.length; i += 1) {
			key = this.keysToCopy[i];
			keyValue = this._getKeyValues(doc, key);
			if (keyValue) {
				this._updateObjWithKeyString(copiedKeysObj, key, keyValue);
			}
		}
		return copiedKeysObj;
	},

	// Transform of copy to schema document. Copy to schema will include a copy
	// of the copy from schema if the join keys match.
	_computeTransform: function(doc) {
		var i, j, copyToJoinVal;
		var docId, copyFromDoc, copyFromDocs, copyFromJoinVal;
		var transformed = $n2.deepCopy(doc);

		// Get copy to schema document join value if available
		copyToJoinVal = this._getKeyValues(doc, this.copyToJoinKey);
		copyFromDocs = Object.keys(this.copyFromSchemaDocsByDocId);

		// Reset copy from schema before performing schema copy.
		if (Object.hasOwnProperty.call(transformed, '_' + this.copyFromSchema)) {
			transformed['_' + this.copyFromSchema] = undefined;
		}

		if (copyToJoinVal) {
			for (i = 0; i < copyFromDocs.length; i += 1) {
				docId = copyFromDocs[i];
				copyFromDoc = this.copyFromSchemaDocsByDocId[docId];

				// Get copy from schema document join value if available
				copyFromJoinVal = this._getKeyValues(copyFromDoc.original, this.copyFromJoinKey);

				// If join values match, then add a copy of the copy from
				// schema in the copy to schema document transformation.
				if ($n2.isArray(copyToJoinVal)
					&& copyToJoinVal.length
					&& $n2.isArray(copyFromJoinVal)
					&& copyFromJoinVal.length) {
					if (!$n2.isArray(transformed['_' + this.copyFromSchema])) {
						transformed['_' + this.copyFromSchema] = [];
					}

					for (j = 0; j < copyFromJoinVal.length; j += 1) {
						if (copyToJoinVal.indexOf(copyFromJoinVal[j]) >= 0) {
							if (this.keysToCopy) {
								transformed['_' + this.copyFromSchema].push(this._copyKeyContent(copyFromDoc.original));
							} else {
								transformed['_' + this.copyFromSchema].push(copyFromDoc.original);
							}
							break;
						}
					}

				} else if ($n2.isArray(copyToJoinVal)
					&& copyToJoinVal.length
					&& typeof copyFromJoinVal === 'string'
					&& copyToJoinVal.indexOf(copyFromJoinVal) >= 0) {
					if (!$n2.isArray(transformed['_' + this.copyFromSchema])) {
						transformed['_' + this.copyFromSchema] = [];
					}

					if (this.keysToCopy) {
						transformed['_' + this.copyFromSchema].push(this._copyKeyContent(copyFromDoc.original));
					} else {
						transformed['_' + this.copyFromSchema].push(copyFromDoc.original);
					}

				} else if ($n2.isArray(copyFromJoinVal)
					&& copyFromJoinVal.length
					&& typeof copyToJoinVal === 'string'
					&& copyFromJoinVal.indexOf(copyToJoinVal) >= 0) {
					if (!$n2.isArray(transformed['_' + this.copyFromSchema])) {
						transformed['_' + this.copyFromSchema] = [];
					}

					if (this.keysToCopy) {
						transformed['_' + this.copyFromSchema].push(this._copyKeyContent(copyFromDoc.original));
					} else {
						transformed['_' + this.copyFromSchema].push(copyFromDoc.original);
					}

				} else if (copyFromJoinVal && copyToJoinVal === copyFromJoinVal) {
					if (this.keysToCopy) {
						transformed['_' + this.copyFromSchema] = this._copyKeyContent(copyFromDoc.original);
					} else {
						transformed['_' + this.copyFromSchema] = copyFromDoc.original;
					}
					break;
				}
			}
		}
		return transformed;
	},

	_reportStateUpdate: function(added, updated, removed) {
		var stateUpdate = {
			added: added,
			updated: updated,
			removed: removed,
			loading: this.modelIsLoading
		};

		if (this.dispatchService) {
			this.dispatchService.send(DH,{
				type: 'modelStateUpdated',
				modelId: this.modelId,
				state: stateUpdate
			});
		}
	}
});

//--------------------------------------------------------------------------
/*
* This class is a document source model. This means that it is a document model
* (a model that makes documents available to other entities), but it does not
* connect to a source model. Instead, being a source, it generates a stream of
* documents for other entities.
* 
* This document model is static, meaning that it does not change over time. It
* has a set of documents that it manages in memory and makes it available.
*/
var StaticDocumentSource = $n2.Class('StaticDocumentSource', $n2.model.DocumentModel, {

	docsById: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null

			// From configuration
			,modelId: null
			,modelType: null
			,docs: null
		},opts_);
		
		$n2.model.DocumentModel.prototype.initialize.call(this,opts);

		this.docsById = {};
		
		$n2.log('StaticDocumentSource', this);

		if( $n2.isArray(opts.docs) ){
			this.setDocuments(opts.docs);
		};
	},
	
	setDocuments: function(docs){
		var _this = this;
		
		var added = [];
		var updated = [];
		var removed = [];
		
		var newDocsById = {};
		docs.forEach(function(doc){
			if( doc && doc._id ){
				var docId = doc._id;

				newDocsById[docId] = doc;
				
				if( _this.docsById ){
					updated.push(doc);
				} else {
					added.push(doc);
				};
			};
		});
		
		// Figure out removed document
		for(var docId in this.docsById){
			var doc = this.docsById[docId];
			if( !newDocsById[docId] ){
				removed.push(doc);
			};
		};
		
		// Install new document map
		this.docsById = newDocsById;
		
		this._reportStateUpdate(added, updated, removed);
	},
	
	_getCurrentDocuments: function(){
		var docs = [];
		
		for(var docId in this.docsById){
			var doc = this.docsById[docId];
			docs[docs.length] = doc;
		};
		
		return docs;
	},

	_isLoading: function(){
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
		options.modelType = m.modelType;
		
		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		m.model = new ModelUnion(options);
		
		m.created = true;

	} else if( m.modelType === 'intersect' ){
		var options = {};
		
		if( m && m.modelOptions ){
			if( m.modelOptions.sourceModelIds 
			 && m.modelOptions.sourceModelIds.length ){
				options.sourceModelIds = m.modelOptions.sourceModelIds;
			};
		};

		options.modelId = m.modelId;
		options.modelType = m.modelType;
		
		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		m.model = new ModelIntersect(options);
		
		m.created = true;

	} else if (m.modelType === 'schemaDocsJoin') {
		var optionKeys, i, key;
		var options = {};
		
		if (m && m.modelOptions) {
			optionKeys = Object.keys(m.modelOptions);
			for (i = 0; i < optionKeys.length; i += 1) {
				key = optionKeys[i];
				options[key] = m.modelOptions[key];
			}
		}

		options.modelId = m.modelId;
		options.modelType = m.modelType;
		
		if (m && m.config) {
			if (m.config.directory) {
				options.dispatchService = m.config.directory.dispatchService;
			}
		}
		
		m.model = new ModelSchemaJoinTransform(options);
		
		m.created = true;

	} else if( m.modelType === 'staticDocumentSource' ){
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
		
		m.model = new StaticDocumentSource(options);
		
		m.created = true;
	};
};

//--------------------------------------------------------------------------
$n2.modelUtils = {
	ModelUnion: ModelUnion
	,ModelIntersect: ModelIntersect
	,ModelSchemaJoinTransform: ModelSchemaJoinTransform
	,StaticDocumentSource: StaticDocumentSource
	,handleModelCreate: handleModelCreate 
};

})(jQuery,nunaliit2);
