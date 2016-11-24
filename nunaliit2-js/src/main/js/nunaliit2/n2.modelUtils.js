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
		
		new ModelUnion(options);
		
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
		
		new StaticDocumentSource(options);
		
		m.created = true;
	};
};

//--------------------------------------------------------------------------
$n2.modelUtils = {
	ModelUnion: ModelUnion
	,StaticDocumentSource: StaticDocumentSource
	,handleModelCreate: handleModelCreate 
};

})(jQuery,nunaliit2);
