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
	_loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
	,DH = 'n2.couchDbPerspective'
	,NOT_VALID_NOT_VISIBLE = { valid:false, visible:false }
	,VALID_NOT_VISIBLE     = { valid:true,  visible:false }
	,VALID_VISIBLE         = { valid:true,  visible:true }
	;

//--------------------------------------------------------------------------
var DbSelector = $n2.Class({
	initialize: function(opts_){
		var opts = $n2.extend({
		}, opts_);
		
	},
	
	load: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(docs){}
			,onError: function(err){}
		}, opts_);
		
		throw 'Subclasses of DbSelector must implement function load()';
	},
	
	isDocValid: function(doc){
		throw 'Subclasses of DbSelector must implement function isValidDoc()';
	},
	
	getLabel: function(){
		throw 'Subclasses of DbSelector must implement function getLabel()';
	}
});

//--------------------------------------------------------------------------
var CouchLayerDbSelector = $n2.Class(DbSelector, {
	layerId: null,
	
	name: null,
	
	atlasDesign: null,
	
	documentSource: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			layer: null
			,name: null
			,atlasDesign: null
			,documentSource: null
		}, opts_);

		DbSelector.prototype.initialize.call(this, opts_);
		
		this.layerId = opts.layer;
		this.name = opts.name;
		this.atlasDesign = opts.atlasDesign;
		this.documentSource = opts.documentSource;
	},
	
	load: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(docs){}
			,onError: function(err){}
		}, opts_);
		
		var _this = this;
		
		this.atlasDesign.queryView({
			viewName: 'layers'
			,include_docs: true
			,startkey: this.layerId
			,endkey: this.layerId
			,onSuccess: function(rows){
				var docs = [];
				for(var i=0,e=rows.length; i<e; ++i){
					var doc = rows[i].doc;
					if( doc && _this.isDocValid(doc) ){
						// Associate document source
						if( _this.documentSource ){
							_this.documentSource.adoptDocument(doc);
						};
						
						docs.push(doc);
					};
				};
				opts.onSuccess(docs);
			}
			,onError: opts.onError
		});
	},
	
	isDocValid: function(doc){
		if( doc && doc.nunaliit_layers ){
			if( doc.nunaliit_layers.indexOf(this.layerId) >= 0 ){
				return true;
			};
		};
		
		return false;
	},
	
	getLabel: function(){
		if( this.name ){
			return this.name;
		};
		
		return this.layerId;
	}
});

//--------------------------------------------------------------------------
var CouchSchemaDbSelector = $n2.Class(DbSelector, {
	schemaName: null,
	
	name: null,
	
	atlasDesign: null,
	
	documentSource: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			schemaName: null
			,name: null
			,atlasDesign: null
			,documentSource: null
		}, opts_);

		DbSelector.prototype.initialize.call(this, opts_);
		
		this.schemaName = opts.schemaName;
		this.name = opts.name;
		this.atlasDesign = opts.atlasDesign;
		this.documentSource = opts.documentSource;
	},
	
	load: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(docs){}
			,onError: function(err){}
		}, opts_);
		
		var _this = this;
		
		this.atlasDesign.queryView({
			viewName: 'nunaliit-schema'
			,include_docs: true
			,startkey: this.schemaName
			,endkey: this.schemaName
			,onSuccess: function(rows){
				var docs = [];
				for(var i=0,e=rows.length; i<e; ++i){
					var doc = rows[i].doc;
					if( doc && _this.isDocValid(doc) ){
						// Associate document source
						if( _this.documentSource ){
							_this.documentSource.adoptDocument(doc);
						};
						
						docs.push(doc);
					};
				};
				opts.onSuccess(docs);
			}
			,onError: opts.onError
		});
	},
	
	isDocValid: function(doc){
		if( doc 
		 && this.schemaName === doc.nunaliit_schema ){
			return true;
		};
		
		return false;
	},
	
	getLabel: function(){
		if( this.name ){
			return this.name;
		};
		
		return this.schemaName;
	}
});

//--------------------------------------------------------------------------
/**
 * This class accepts a number of instances of DbSelector and manages the content
 * found from the database, via those selectors. It also accepts listeners
 * and provide them with updates from the database. On each updates, the
 * created, updated and removed documents are provided.
 * 
 * The database perspective also offers caching of documents, via events from the
 * dispatcher.
 */
var DbPerspective = $n2.Class({
	dispatchService: null,
	
	atlasDesign: null,
	
	siteDesign: null,
	
	documentSource: null,
	
	modelId: null,
	
	dbSelectors: null,
	
	selectorListeners: null,
	
	docInfosByDocId: null,
	
	docListeners: null,
	
	loadingCount: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,atlasDesign: null
			,siteDesign: null
			,documentSource: null
			,modelId: null
		}, opts_);

		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.atlasDesign = opts.atlasDesign;
		this.siteDesign = opts.siteDesign;
		this.documentSource = opts.documentSource;
		this.modelId = opts.modelId;
		
		this.dbSelectors = [];
		this.selectorListeners = [];
		this.docInfosByDocId = {};
		this.docListeners = [];
		this.loadingCount = 0;
		
		if( !this.modelId ){
			this.modelId = $n2.getUniqueId();
		};
		
		if( this.dispatchService ) {
			var fn = function(m){
				_this._handleMessage(m);
			};
			
			this.dispatchService.register(DH, 'documentContentCreated', fn);
			this.dispatchService.register(DH, 'documentContentUpdated', fn);
			this.dispatchService.register(DH, 'documentDeleted', fn);
//			this.dispatchService.register(DH, 'findIsAvailable', fn);
			this.dispatchService.register(DH, 'documentVersion', fn);
			this.dispatchService.register(DH, 'cacheRetrieveDocument', fn);
			this.dispatchService.register(DH, 'modelGetInfo', fn);
			this.dispatchService.register(DH, 'modelGetState', fn);
		};
		
		$n2.log('DbPerspective',this);
	},
	
	addDbSelector: function(dbSelector, opts_){
		var opts = $n2.extend({
			visibility: true
		},opts_);
		
		var _this = this;
		
		var dbSelectorInfo = {
			selector: dbSelector
			,visible: opts.visibility
			,id: $n2.getUniqueId()
		};
		this.dbSelectors.push(dbSelectorInfo);
		
		++this.loadingCount;
		this._reportStateUpdate([], [], []);
		
		dbSelector.load({
			onSuccess: function(docs){
				--_this.loadingCount;
				_this._docsLoaded(docs);
			},
			onError: function(err){
				--_this.loadingCount;
				_this._reportStateUpdate([], [], []);
			}
		});
	},
	
	addDbSelectorFromConfigObject: function(selectorConfig){
		var dbSelector = null;
		
		if( selectorConfig ){
			if( 'couchDbLayer' === selectorConfig.type ){
				var dbSelectorOptions = {
					layer: null
					,atlasDesign: this.atlasDesign
					,documentSource: this.documentSource
				};
				
				if( selectorConfig.options 
				 && selectorConfig.options.layerId ){
					dbSelectorOptions.layer = selectorConfig.options.layerId;
				} else {
					$n2.log('DbPerspective unable to create selector. "layerId" required for "couchDbLayer"');
					return null;
				};

				if( selectorConfig.name ){
					dbSelectorOptions.name = selectorConfig.name;
				};
				
				dbSelector = new CouchLayerDbSelector(dbSelectorOptions);
				
			} else if( 'couchDbSchema' === selectorConfig.type ){
					var dbSelectorOptions = {
						schemaName: null
						,atlasDesign: this.atlasDesign
						,documentSource: this.documentSource
					};
					
					if( selectorConfig.options 
					 && selectorConfig.options.schemaName ){
						dbSelectorOptions.schemaName = selectorConfig.options.schemaName;
					} else {
						$n2.log('DbPerspective unable to create selector. "schemaName" required for "couchDbSchema"');
						return null;
					};

					if( selectorConfig.name ){
						dbSelectorOptions.name = selectorConfig.name;
					};
					
					dbSelector = new CouchSchemaDbSelector(dbSelectorOptions);
				
			} else {
				$n2.log('Unknown DbPerspective selector type: '+selectorConfig.type);
			};
		};

		if( dbSelector ){
			this.addDbSelector(dbSelector, selectorConfig);
		};
		
		return dbSelector;
	},
	
	addSelectorListener: function(listener){
		this.selectorListeners.push(listener);
		
		var selectorInfos = this.getDbSelectorInfos();
		listener(selectorInfos);
	},
	
	getDbSelectorInfos: function(){
		var infos = [];
		
		for(var i=0,e=this.dbSelectors.length; i<e; ++i){
			var selectorInfo = this.dbSelectors[i];
			var selector = selectorInfo.selector;
			var s = {
				id: selectorInfo.id
				,visible: selectorInfo.visible
				,name: selector.getLabel()
			};
			infos.push(s);
		};
		
		return infos;
	},
	
	setDbSelectorVisibility: function(selectorId, visibility){
		var changed = false;
		for(var i=0,e=this.dbSelectors.length; i<e; ++i){
			var selectorInfo = this.dbSelectors[i];
			if( selectorInfo.id === selectorId ){
				if( visibility !== selectorInfo.visible ){
					selectorInfo.visible = visibility;
					changed = true;
				};
			};
		};
		
		if( changed ){
			this._selectorVisibilityChanged();

			var selectorInfos = this.getDbSelectorInfos();
			for(var i=0,e=this.selectorListeners.length; i<e; ++i){
				var listener = this.selectorListeners[i];
				listener(selectorInfos);
			};
		};
	},
	
	addListener: function(listener){
		this.docListeners.push(listener);
		
		var added = [];
		for(var docId in this.docInfosByDocId){
			var docInfo = this.docInfosByDocId[docId];
			var doc = docInfo.doc;
			var visibilityStatus = this._getDocVisibility(doc);
			if( visibilityStatus.visible ){
				added.push(doc);
			};
		};

		if( added.length > 0 ){
			listener({
				added: added
				,updated: []
				,removed: []
			});
		};
	},

	isDocValid: function(doc){
		for(var i=0,e=this.dbSelectors.length; i<e; ++i){
			var selectorInfo = this.dbSelectors[i];
			var s = selectorInfo.selector;
			if( s.isDocValid(doc) ){
				return true;
			};
		};

		return false;
	},
	
	isLoading: function(){
		return (this.loadingCount > 0);
	},
	
	_selectorVisibilityChanged: function(){
		var added = [];
		var updated = [];
		var removed = [];
		
		for(var docId in this.docInfosByDocId){
			var docInfo = this.docInfosByDocId[docId];
			var doc = docInfo.doc;
			
			var visibilityStatus = this._getDocVisibility(doc);
			
			if( !docInfo.visible && visibilityStatus.visible ){
				added.push(doc);
			
			} else if( docInfo.visible && !visibilityStatus.visible ){
				removed.push(doc);
			};
			
			docInfo.visible = visibilityStatus.visible;
		};
		
		this._reportStateUpdate(added, updated, removed);
	},
	
	_getDocVisibility: function(doc){
		var status = NOT_VALID_NOT_VISIBLE;
		
		for(var i=0,e=this.dbSelectors.length; i<e; ++i){
			var selectorInfo = this.dbSelectors[i];
			var s = selectorInfo.selector;
			if( s.isDocValid(doc) ){
				status = VALID_NOT_VISIBLE;
				
				if( selectorInfo.visible ){
					return VALID_VISIBLE;
				};
			};
		};

		return status;
	},

	_docsLoaded: function(loadedDocs){
		var added = [];
		var updated = [];
		var removed = [];
		
		for(var i=0,e=loadedDocs.length; i<e; ++i){
			var loadedDoc = loadedDocs[i];
			
			var visibilityStatus = this._getDocVisibility(loadedDoc);
			
			var docInfo = this.docInfosByDocId[loadedDoc._id];
			
			if( !docInfo && visibilityStatus.valid ){
				// Not previously in cache, but now valid: add
				this.docInfosByDocId[loadedDoc._id] = {
					doc: loadedDoc
					,cacheValid: true
					,visible: visibilityStatus.visible
				};
				
				// Call listeners only if document is visible
				if( visibilityStatus.visible ){
					added.push(loadedDoc);
				};

			} else if( docInfo && !visibilityStatus.valid ) {
				// Previously in cache, but no longer valid
				delete this.docInfosByDocId[loadedDoc._id];

				// If listeners were previously informed of this document,
				// report removal
				if( docInfo.visible ) {
					removed.push(docInfo.doc);
				};

			} else if( docInfo && visibilityStatus.valid ) {
				// Previously in cache. Still valid. Update.
				
				// It is not an update if the reported document is the
				// same version as the one in cache
				var revUpdated = false;
				if( docInfo.doc._rev !== loadedDoc._rev ) {
					// Updated. Keep track of this new version of the document.
					// Assume that it is valid
					docInfo.doc = loadedDoc;
					docInfo.cacheValid = true;
					revUpdated = true;
				};

				if( docInfo.visible && visibilityStatus.visible ){
					if( revUpdated ){
						updated.push(loadedDoc);
					};

				} else if( !docInfo.visible && visibilityStatus.visible ){
					added.push(loadedDoc);
					docInfo.visible = true;
				
				} else if( docInfo.visible && !visibilityStatus.visible ){
					removed.push(loadedDoc);
					docInfo.visible = false;
				};
			};
		};
		
		this._reportStateUpdate(added, updated, removed);
	},
	
	_handleMessage: function(m){
		if( 'documentContentCreated' === m.type 
		 || 'documentContentUpdated' === m.type ){
			if( m.doc ){
				this._docsLoaded([m.doc]);
			};

		} else if( 'documentDeleted' === m.type ){
			var docId = m.docId;
			var docInfo = this.docInfosByDocId[docId];
			if( docInfo ){
				delete this.docInfosByDocId[docId];
				
				var removed = [docInfo.doc];
				this._reportStateUpdate([], [], removed);
			};

		} else if( 'documentVersion' === m.type ) {
			var docInfo = this.docInfosByDocId[m.docId];
			if( docInfo 
			 && docInfo.doc 
			 && docInfo.cacheValid 
			 && docInfo.doc._rev !== m.rev ){
				docInfo.cacheValid = false;
			};

		} else if( 'cacheRetrieveDocument' === m.type ) {
			var docInfo = this.docInfosByDocId[m.docId];
			if( docInfo 
			 && docInfo.doc 
			 && docInfo.cacheValid ){
				m.doc = docInfo.doc;
			};
			
		} else if( 'modelGetInfo' === m.type ) {
			if( m.modelId === this.modelId ){
				m.modelInfo = {
					modelId: this.modelId
					,modelType: 'couchDb'
					,parameters: {}
					,_instance: this
				};
			};
			
		} else if( 'modelGetState' === m.type ) {
			if( m.modelId === this.modelId ){
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
		};
	},
	
	_reportStateUpdate: function(added, updated, removed){
		var stateUpdate = {
			added: added
			,updated: updated
			,removed: removed
			,loading: this.isLoading()
		};

		for(var i=0,e=this.docListeners.length; i<e; ++i){
			var listener = this.docListeners[i];
			listener(stateUpdate);
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
/**
 * This class is a document source (document model that fetches documents
 * remotely) that loads documents given a specified view.
 */
var ModelCouchDbView = $n2.Class({
	dispatchService: null,
	
	atlasDesign: null,
	
	siteDesign: null,
	
	modelId: null,
	
	viewName: null,

	isSiteView: null,

	includeValues: null,
	
	designDoc: null,
	
	atlasDb: null,

	cacheByDocId: null,

	docsById: null,
	
	loadingCount: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,atlasDesign: null
			,modelId: null
			,view: null
			,isSiteView: false
			,includeValues: true
		}, opts_);

		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.atlasDesign = opts.atlasDesign;
		this.siteDesign = opts.siteDesign;
		this.modelId = opts.modelId;
		this.viewName = opts.view;
		this.isSiteView = opts.isSiteView;
		this.includeValues = opts.includeValues;
		
		if( typeof this.viewName !== 'string' ){
			throw new Error('Model "couchDbView" requires a string parameter "view"');
		};
		
		this.designDoc = this.atlasDesign;
		if( this.isSiteView ){
			this.designDoc = this.siteDesign;
		};
		
		this.atlasDb = this.designDoc.getDatabase();
		
		this.docsById = {};
		this.cacheByDocId = {};
		this.loadingCount = 0;
		
		if( !this.modelId ){
			this.modelId = $n2.getUniqueId();
		};
		
		if( this.dispatchService ) {
			var fn = function(m){
				_this._handleMessage(m);
			};
			
			this.dispatchService.register(DH, 'documentContentCreated', fn);
			this.dispatchService.register(DH, 'documentContentUpdated', fn);
			this.dispatchService.register(DH, 'documentDeleted', fn);
//			this.dispatchService.register(DH, 'findIsAvailable', fn);
			this.dispatchService.register(DH, 'documentVersion', fn);
			this.dispatchService.register(DH, 'cacheRetrieveDocument', fn);
			this.dispatchService.register(DH, 'modelGetInfo', fn);
			this.dispatchService.register(DH, 'modelGetState', fn);
		};
		
		this._loadView();
		
		$n2.log('ModelCouchDbView',this);
	},
	
	
	isLoading: function(){
		return (this.loadingCount > 0);
	},
	
	_loadView: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(docInfoByDocId){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;

		++this.loadingCount;
		this._reportStateUpdate([],[],[]);
		
		this.designDoc.queryView({
			viewName: this.viewName
			,include_docs: false
			,onSuccess: function(rows){
				var docMap = {};

				rows.forEach(function(row){
					var docId = row.id;
					if( !docMap[docId] ){
						docMap[docId] = [];
					};
					docMap[docId].push(row);
				});

				loadDocsFromMap(docMap);
			}
			,onError: function(err){
				$n2.log('Unable to load CouchDb view: '+_this.viewName, err);
				--this.loadingCount;
				this._reportStateUpdate([],[],[]);
			}
		});
		
		function loadDocsFromMap(docMap){
			// Make array of docIds from map
			var docIds = [];
			for(var docId in docMap){
				docIds.push(docId);
			};

			_this.atlasDb.getDocuments({
				docIds: docIds
				,onSuccess: function(docs){
					_this.cacheByDocId = {};
					var docInfoByDocId = {};
					docs.forEach(function(doc){
						var docId = doc._id;

						_this.cacheByDocId[docId] = doc;

						// Clone document to add view information
						var values = docMap[docId];
						var clone = _this._computeClone(doc, values);
						docInfoByDocId[docId] = {
							doc: doc
							,clone: clone
							,values: values
						};
					});

					--_this.loadingCount;

					_this._docInfoMapLoaded(docInfoByDocId);
				}
				,onError: function(err){
					$n2.log('Unable to fetch documents for CouchDb view: '+_this.viewName, err);
					--this.loadingCount;
					this._reportStateUpdate([],[],[]);
				}
			});
		};
	},
	
	_computeClone: function(doc, values){
		if( this.includeValues ){
			var clone = $n2.extend({},doc);
			clone.__view = {};
			clone.__view[this.viewName] = values;
			return clone;
		} else {
			return doc;
		};
	},

	_docInfoMapLoaded: function(docInfoMap){
		var added = [];
		var updated = [];
		var removed = [];
		
		// Detect updated and removed documents
		for(var docId in this.docsById){
			var oldDoc;
			if( this.docsById[docId] ){
				oldDoc = this.docsById[docId].clone;
			};
			var newDoc;
			if( docInfoMap[docId] ){
				newDoc = docInfoMap[docId].clone;
			};

			if( newDoc ){
				// This document persists. Check if revision changed
				if( newDoc._rev === oldDoc._rev ){
					// Nothing changed
				} else {
					// This document has changed
					updated.push(newDoc);
				};
				
			} else {
				// This is a removed document
				removed.push(oldDoc);
			};
		};
		
		// Detect added documents
		for(var docId in docInfoMap){
			var oldDoc;
			if( this.docsById[docId] ){
				oldDoc = this.docsById[docId].clone;
			};
			var newDoc;
			if( docInfoMap[docId] ){
				newDoc = docInfoMap[docId].clone;
			};

			if( !oldDoc ){
				// This was added
				added.push(newDoc);
			};
		};
		
		// Swap to new map
		this.docsById = docInfoMap;
		
		this._reportStateUpdate(added, updated, removed);
	},
	
	_handleMessage: function(m){
		if( 'documentContentCreated' === m.type 
		 || 'documentContentUpdated' === m.type ){
			if( m.doc ){
				var docId = m.docId;
				if( this.cacheByDocId[docId] ){
					this.cacheByDocId[docId] = m.doc;
				};
				
				// Need to reload view
				this._loadView();
			};

		} else if( 'documentDeleted' === m.type ){
			var docId = m.docId;
			if( this.cacheByDocId[docId] ){
				delete this.cacheByDocId[docId];
			};

			var docInfo = this.docsById[docId];
			if( docInfo ){
				delete this.docsById[docId];
				
				var removed = [docInfo.clone];
				this._reportStateUpdate([], [], removed);
			};

		} else if( 'documentVersion' === m.type ) {
			var cachedDoc = this.cacheByDocId[m.docId];
			if( cachedDoc 
			 && cachedDoc._rev !== m.rev ){
				delete this.cacheByDocId[m.docId];
			};

		} else if( 'cacheRetrieveDocument' === m.type ) {
			var cachedDoc = this.cacheByDocId[m.docId];
			if( cachedDoc ){
				m.doc = cachedDoc;
			};
			
		} else if( 'modelGetInfo' === m.type ) {
			if( m.modelId === this.modelId ){
				m.modelInfo = {
					modelId: this.modelId
					,modelType: 'couchDbView'
					,parameters: {}
					,_instance: this
				};
			};
			
		} else if( 'modelGetState' === m.type ) {
			if( m.modelId === this.modelId ){
				var added = [];
				for(var docId in this.docsById){
					var docInfo = this.docsById[docId];
					var doc = docInfo.clone;
					added.push(doc);
				};

				m.state = {
					added: added
					,updated: []
					,removed: []
					,loading: this.isLoading()
				};
			};
		};
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
function handleModelCreate(m){
	if( 'couchDb' === m.modelType 
	 || 'couchDbDataSource' === m.modelType ){

		var options = {
			modelId: m.modelId
		};
		
		if( m && m.config ){
			options.atlasDesign = m.config.atlasDesign;
			options.siteDesign = m.config.siteDesign;
			options.documentSource = m.config.documentSource;
			
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		var dbPerspective = new DbPerspective(options);
		
		// Load layers
		if( m.modelOptions 
		 && m.modelOptions.selectors ){
			var selectors = m.modelOptions.selectors;
			for(var i=0,e=selectors.length; i<e; ++i){
				var selectorConfig = selectors[i];
				dbPerspective.addDbSelectorFromConfigObject(selectorConfig);
			};
		};
		
		m.model = dbPerspective;
		m.created = true;

	} else if( 'couchDbView' === m.modelType  ){

		var options = {};
		
		if( m.modelOptions ){
			for(var key in m.modelOptions){
				options[key] = m.modelOptions[key];
			};
		};

		options.modelId = m.modelId;
		
		if( m.config ){
			options.atlasDesign = m.config.atlasDesign;
			options.siteDesign = m.config.siteDesign;
			
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		m.model = new ModelCouchDbView(options);
		
		m.created = true;
	};
};

//--------------------------------------------------------------------------
var DbPerspectiveChooser = $n2.Class({
	
	elemId: null,
	
	dispatchService: null,
	
	sourceModelId: null,
	
	dbPerspective: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,sourceModelId: null
			,containerId: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.sourceModelId = opts.sourceModelId;

		if( this.dispatchService ){
			var m = {
				type: 'modelGetInfo'
				,modelId: this.sourceModelId
			};
			
			this.dispatchService.synchronousCall(DH,m);
			
			if( m.modelInfo ){
				this.dbPerspective = m.modelInfo._instance;
			};
		};
		
		var containerId = opts.containerId;
		if( !containerId ){
			throw new Error('containerId must be specified');
		};
		
		this.elemId = $n2.getUniqueId();
		var $outer = $('<div>')
			.attr('id',this.elemId)
			.addClass('n2dbPerspective_chooser')
			.appendTo( $('#'+containerId) );
		
		if( opts.style ){
			for(var name in opts.style){
				var value = opts.style[name];
				if( value ){
					$outer.css(name,value);
				};
			};
		};
		
		$('<div>')
			.addClass('n2dbPerspective_chooser_button')
			.appendTo($outer).
			click(function(){
				_this._togglePanel();
			});
		
		$('<div>')
			.addClass('n2dbPerspective_chooser_panel')
			.appendTo($outer);
		
		this._hidePanel();
		
		//this._refresh();
		
		if( this.dbPerspective ){
			this.dbPerspective.addSelectorListener(function(selectorInfos){
				_this._refresh();
			});
		};
	},
	
	_refresh: function(){
		var $elem = this._getElem();
		var $panel = $elem.find('.n2dbPerspective_chooser_panel');
		$panel.empty();
		
		if( this.dbPerspective ){
			var selectorInfos = this.dbPerspective.getDbSelectorInfos();
			for(var i=0,e=selectorInfos.length; i<e; ++i){
				var selectorInfo = selectorInfos[i];
				this._addSelector($panel, selectorInfo);
			};
		};
	},
	
	_addSelector: function($elem, selectorInfo){
		var _this = this;
		var elemId = $n2.getUniqueId();
		var name = $n2.getUniqueId();
		var $div = $('<div>')
			.attr('id',elemId)
			.addClass('n2dbPerspective_chooser_line')
			.appendTo($elem);
		
		// Checkbox
		var $inputDiv = $('<div>')
			.addClass('n2dbPerspective_chooser_line_input')
			.appendTo($div);
		var $input = $('<input>')
			.attr('type','checkbox')
			.attr('id',name)
			.appendTo($inputDiv)
			.change(function(){
				var selected = $('#'+elemId).find('input').is(':checked');
				_this.dbPerspective.setDbSelectorVisibility(selectorInfo.id,selected);
			});
		if( selectorInfo.visible ){
			$input.attr('checked','checked');
		};
		
		// Label
		var label = _loc(selectorInfo.name);
		var $labelDiv = $('<div>')
			.addClass('n2dbPerspective_chooser_line_label')
			.appendTo($div);
		$('<label>')
			.attr('for',name)
			.text(label)
			.appendTo($labelDiv);
	},
	
	_togglePanel: function(){
		var $elem = this._getElem();
		var $panel = $elem.find('.n2dbPerspective_chooser_panel');
		
		if( $panel.hasClass('n2dbPerspective_chooser_panel_on') ){
			this._hidePanel();
		} else {
			this._showPanel();
		};
	},
	
	_showPanel: function(){
		var $elem = this._getElem();
		var $panel = $elem.find('.n2dbPerspective_chooser_panel');
		$panel.removeClass('n2dbPerspective_chooser_panel_off');
		$panel.addClass('n2dbPerspective_chooser_panel_on');
	},
	
	_hidePanel: function(){
		var $elem = this._getElem();
		var $panel = $elem.find('.n2dbPerspective_chooser_panel');
		$panel.removeClass('n2dbPerspective_chooser_panel_on');
		$panel.addClass('n2dbPerspective_chooser_panel_off');
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'couchDbSelector' ){
      m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'couchDbSelector' ){
		var widgetOptions = m.widgetOptions;
		var contentId = m.contentId;
		var containerId = m.containerId;
		var config = m.config;
		
		var options = {};
		
		if( widgetOptions ){
			for(var key in widgetOptions){
				var value = widgetOptions[key];
				options[key] = value;
			};
		};

		options.contentId = contentId;
		options.containerId = containerId;
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
		};
		
		new DbPerspectiveChooser(options);
	};
};

//--------------------------------------------------------------------------
$n2.couchDbPerspective = {
	DbPerspective: DbPerspective
	,DbSelector: DbSelector
	,CouchLayerDbSelector: CouchLayerDbSelector
	,handleModelCreate: handleModelCreate
	,DbPerspectiveChooser: DbPerspectiveChooser
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
