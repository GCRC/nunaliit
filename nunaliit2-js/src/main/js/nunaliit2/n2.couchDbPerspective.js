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

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
var DH = 'n2.couchDbPerspective';

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
	}
});

//--------------------------------------------------------------------------
var CouchLayerDbSelector = $n2.Class(DbSelector, {
	layerId: null,
	
	atlasDesign: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			layer: null
			,atlasDesign: null
		}, opts_);

		DbSelector.prototype.initialize.call(this, opts_);
		
		this.layerId = opts.layer;
		this.atlasDesign = opts.atlasDesign;
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
	
	dbSelectors: null,
	
	docInfosByDocId: null,
	
	listeners: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
		}, opts_);

		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		this.dbSelectors = [];
		this.docInfosByDocId = {};
		this.listeners = [];
		
		if( this.dispatchService ) {
			var fn = function(m){
				_this._handleMessage(m);
			};
			
			this.dispatchService.register(DH, 'documentContent', fn);
			this.dispatchService.register(DH, 'documentDeleted', fn);
			this.dispatchService.register(DH, 'findIsAvailable', fn);
			this.dispatchService.register(DH, 'documentVersion', fn);
			this.dispatchService.register(DH, 'cacheRetrieveDocument', fn);
		};
	},
	
	addDbSelector: function(dbSelector){
		var _this = this;
		
		this.dbSelectors.push(dbSelector);
		
		dbSelector.load({
			onSuccess: function(docs){
				_this._docsLoaded(docs);
			}
		});
	},
	
	addListener: function(listener){
		var _this = this;
		
		this.listeners.push(listener);
		
		var added = [];
		for(var docId in this.docInfosByDocId){
			var docInfo = this.docInfosByDocId[docId];
			var doc = docInfo.doc;
			added.push(doc);
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
			var s = this.dbSelectors[i];
			if( s.isDocValid(doc) ){
				return true;
			};
		};

		return false;
	},

	_docsLoaded: function(loadedDocs){
		var added = [];
		var updated = [];
		var removed = [];
		
		for(var i=0,e=loadedDocs.length; i<e; ++i){
			var loadedDoc = loadedDocs[i];
			
			var isDocValid = this.isDocValid(loadedDoc);
			
			var doc = null;
			var docInfo = this.docInfosByDocId[loadedDoc._id];
			if( docInfo ){
				doc = docInfo.doc;
			};
			
			if( !doc && isDocValid ){
				added.push(loadedDoc);
				this.docInfosByDocId[loadedDoc._id] = {
					doc: loadedDoc
					,cacheValid: true
				};

			} else if( doc && !isDocValid ) {
				removed.push(loadedDoc);
				delete this.docInfosByDocId[loadedDoc._id];

			} else if( doc && isDocValid ) {
				if( doc._rev !== loadedDoc._rev ) {
					updated.push(loadedDoc);
					this.docInfosByDocId[loadedDoc._id].doc = loadedDoc;
					this.docInfosByDocId[loadedDoc._id].cacheValid = true;
				};
			};
		};
		
		if( added.length > 0
		 || updated.length > 0 
		 || removed.length > 0 ){
			for(var i=0,e=this.listeners.length; i<e; ++i){
				var listener = this.listeners[i];
				listener({
					added: added
					,updated: updated
					,removed: removed
				});
			};
		};
	},
	
	_handleMessage: function(m){
		if( 'documentContent' === m.type ){
			if( m.doc ){
				this._docsLoaded([m.doc]);
			};

		} else if( 'documentDeleted' === m.type ){
			var docId = m.docId;
			var docInfo = this.docInfosByDocId[docId];
			if( docInfo ){
				delete this.docInfosByDocId[docId];
				
				if( this.listeners.length > 0 ){
					var added = [];
					var updated = [];
					var removed = [docInfo.doc];

					for(var i=0,e=this.listeners.length; i<e; ++i){
						var listener = this.listeners[i];
						listener({
							added: added
							,updated: updated
							,removed: removed
						});
					};
				};
			};
			
		} else if( 'findIsAvailable' === m.type ) {
			var doc = m.doc;
			
			if( doc && doc.nunaliit_layers ){
				for(var i=0,e=this.dbSelectors.length; i<e; ++i){
					var selector = this.dbSelectors[i];
					if( selector.layer ){
						if( doc.nunaliit_layers.indexOf(selector.layer) >= 0 ){
							m.isAvailable = true;
							break;
						};
					};
				};
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
		};
	}
});

//--------------------------------------------------------------------------
$n2.couchDbPerspective = {
	DbPerspective: DbPerspective
	,DbSelector: DbSelector
	,CouchLayerDbSelector: CouchLayerDbSelector
};

})(jQuery,nunaliit2);
