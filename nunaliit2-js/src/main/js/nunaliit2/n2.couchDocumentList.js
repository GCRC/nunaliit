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
;(function($,$n2){
"use strict";

// Localization
var 
	_loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
	,DH = 'n2.couchDocumentList'
	;

//*******************************************************
var modelTrackersByModelId = {};

//*******************************************************
/**
 * An instance of this class is used to keep track of the state of a model
 * and translate the state into a list of documents acceptable for the
 * show service document list.
 */
var ModelTracker = $n2.Class({
	sourceModelId: null,

	dispatchService: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			sourceModelId: null
			,dispatchService: null
		},opts_);
		
		this.sourceModelId = opts.sourceModelId;
		this.dispatchService = opts.dispatchService;

		var _this = this;
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, 'modelStateUpdated', f);
		};
		
		this.refresh();
	},
	
	refresh: function(){
		if( this.sourceModelId ){
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
	
	_handle: function(m, addr, dispatcher){
		if( 'modelStateUpdated' === m.type ){
			// Does it come from our source?
			if( this.sourceModelId === m.modelId ){
				this._sourceModelUpdated(m.state);
			};
		};
	},
	
	_sourceModelUpdated: function(sourceState){
		// Prepare an event to report document list result
		var m = {
			type: 'documentListResults'
			,listType: 'model'
			,listName: this.sourceModelId
			,docIds: []
			,docs: []
		};
		
		// Loop through all added documents
		if( sourceState.added ){
			for(var i=0,e=sourceState.added.length; i<e; ++i){
				var doc = sourceState.added[i];
				var docId = doc._id;
				
				m.docIds.push(docId);
				m.docs.push(doc);
			};
		};
		
		// Loop through all updated documents
		if( sourceState.updated ){
			for(var i=0,e=sourceState.updated.length; i<e; ++i){
				var doc = sourceState.updated[i];
				var docId = doc._id;
				
				m.docIds.push(docId);
				m.docs.push(doc);
			};
		};

		// Send event
		this.dispatchService.send(DH,m);
	}
});

//*******************************************************
var DocumentListService = $n2.Class({
	
	atlasDesign: null,
	
	dispatchService: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			atlasDesign: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.atlasDesign = opts.atlasDesign;
		this.dispatchService = opts.dispatchService;
		
		if( this.dispatchService ){
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, 'documentListQuery', fn);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'documentListQuery' === m.type ){
			if( 'layer' === m.listType ){
				this._handleLayerQuery(m);
			} else if( 'schema' === m.listType ){
				this._handleSchemaQuery(m);
			} else if( 'model' === m.listType ){
				this._handleModelQuery(m);
			};
		};
	},
	
	_handleLayerQuery: function(m){
		var _this = this;
		
		var keys = [];
		if( m.listName ){
			keys = m.listName.split(',');
			for(var i=0,e=keys.length; i<e; ++i){
				keys[i] = $n2.trim( keys[i] );
			};
		};
		
		if( this.dispatchService 
		 && this.atlasDesign 
		 && keys.length > 0 ){
			this.atlasDesign.queryView({
				viewName: 'layers'
				,keys: keys
				,include_docs: true
				,onSuccess: function(rows){
					var docIds = [];
					var docs = [];
					for(var i=0,e=rows.length; i<e; ++i){
						docIds.push( rows[i].id );
						docs.push( rows[i].doc );
					};
					_this.dispatchService.send(DH,{
						type: 'documentListResults'
						,listType: m.listType
						,listName: m.listName
						,docIds: docIds
						,docs: docs
					});
				}
				,onError: function(err){
					$n2.log('Unable to retrieve document list ('+m.listType+'/'+m.listName+')',err);
				}
			});
		};
	},
	
	_handleSchemaQuery: function(m){
		var _this = this;
		
		var keys = [];
		if( m.listName ){
			keys = m.listName.split(',');
			for(var i=0,e=keys.length; i<e; ++i){
				keys[i] = $n2.trim( keys[i] );
			};
		};
		
		if( this.dispatchService 
		 && this.atlasDesign 
		 && keys.length > 0 ){
			this.atlasDesign.queryView({
				viewName: 'nunaliit-schema'
				,keys: keys
				,include_docs: true
				,onSuccess: function(rows){
					var docIds = [];
					var docs = [];
					for(var i=0,e=rows.length; i<e; ++i){
						docIds.push( rows[i].id );
						docs.push( rows[i].doc );
					};
					_this.dispatchService.send(DH,{
						type: 'documentListResults'
						,listType: m.listType
						,listName: m.listName
						,docIds: docIds
						,docs: docs
					});
				}
				,onError: function(err){
					$n2.log('Unable to retrieve document list ('+m.listType+'/'+m.listName+')',err);
				}
			});
		};
	},
	
	_handleModelQuery: function(m){
		var _this = this;
		
		var modelId = m.listName;
		
		var modelTracker = modelTrackersByModelId[modelId];
		if( modelTracker ){
			modelTracker.refresh();
		} else {
			modelTracker = new ModelTracker({
				sourceModelId: modelId
				,dispatchService: this.dispatchService
			});
			modelTrackersByModelId[modelId] = modelTracker;
		};
	}
});

//*******************************************************
$n2.couchDocumentList = {
	DocumentListService: DocumentListService
};

})(jQuery,nunaliit2);
