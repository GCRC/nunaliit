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

;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

// =============================================
// Design Document
// =============================================

var DesignDoc = $n2.Class({

	couchDesignDoc: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			couchDesignDoc: null
		},opts_);
		
		this.couchDesignDoc = opts.couchDesignDoc;
	},
	
	getQueryUrl: function(opts_){
		return this.couchDesignDoc.getQueryUrl(opts_);
	},

	queryView: function(opts_) {
		this.couchDesignDoc.queryView(opts_);
	}
});

// =============================================
// Database
// =============================================

var Database = $n2.Class({
	
	wrappedDb: null,
	
	documentCache: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			couchDb: null
			,documentCache: null
		},opts_);
	
		this.wrappedDb = opts.couchDb;
		this.documentCache = opts.documentCache;
	},

	getUrl: function(){
		return this.wrappedDb.getUrl();
	},
	
	getDesignDoc: function(opts_) {
		var couchDesignDoc = this.wrappedDb.getDesignDoc(opts_);

		var designDoc = new DesignDoc({
			couchDesignDoc: couchDesignDoc
		});

		return designDoc;
	},
	
	getChangeNotifier: function(opts_) {
		return this.wrappedDb.getChangeNotifier(opts_);
	},
	
	getChanges: function(opts_) {
		this.wrappedDb.getChanges(opts_);
	},

	getDocumentUrl: function(doc) {
		return this.wrappedDb.getDocumentUrl(doc);
	},

	getAttachmentUrl: function(doc,attName) {
		return this.wrappedDb.getAttachmentUrl(doc,attName);
	},
	
	getDocumentRevision: function(opts_) {
		this.wrappedDb.getDocumentRevision(opts_);
	},
	
	getDocumentRevisions: function(opts_) {
		this.wrappedDb.getDocumentRevisions(opts_);
	},
	
	buildUploadFileForm: function(jQuerySet, options_) {
		this.wrappedDb.buildUploadFileForm(jQuerySet, options_);
	},
	
	createDocument: function(opts_) {
		this.wrappedDb.createDocument(opts_);
	},
	
	updateDocument: function(opts_) {
		this.wrappedDb.updateDocument(opts_);
	},
	
	deleteDocument: function(opts_) {
		this.wrappedDb.deleteDocument(opts_);
	},
	
	bulkDocuments: function(documents, options_) {
		this.wrappedDb.bulkDocuments(documents, options_);
	},
	
	getDocument: function(opts_) {
		var opts = $n2.extend({},opts_,{
			onSuccess: storeDocument
		});
		
		var _this = this;
		
		// Is this document in cache?
		this.documentCache.getDocument({
			docId: opts_.docId
			,onSuccess: checkVersion
			,onError: performNative
		});
		
		function checkVersion(doc){
			if( !doc ) {
				performNative();
			} else {
				_this.wrappedDb.getDocumentRevision({
					docId: opts_.docId
					,onSuccess: function(rev){
						if( rev === doc._rev ){
							opts_.onSuccess(doc);
						} else {
							performNative();
						};
					}
					,onError: performNative
				});
			};
		};
		
		function performNative(){
			// Get document from CouchDb
			_this.wrappedDb.getDocument(opts);
		};
		
		function storeDocument(doc){
			_this.documentCache.updateDocument({
				doc: doc
				,onSuccess: function(){
					opts_.onSuccess(doc);
				}
				,onError: function(err){
					opts_.onSuccess(doc);
				}
			});
		};
	},

	getDocuments: function(opts_) {
		var _this = this;
		var docIdMap = {};
		var docsToReturn = [];
		var docsToStore = [];
		
		opts_.docIds.forEach(function(docId){
			docIdMap[docId] = true;
		});
		
		// Are the requested documents in cache?
		this.documentCache.getDocuments({
			docIds: opts_.docIds
			,onSuccess: documentsFromCache
			,onError: performNative
		});

		function documentsFromCache(cachedDocs){
			if( cachedDocs && cachedDocs.length > 0 ){
				// Get versions for these documents
				var versionDocIds = [];
				cachedDocs.forEach(function(cachedDoc){
					versionDocIds.push(cachedDoc._id);
				});

				_this.getDocumentRevisions({
					docIds: versionDocIds
					,onSuccess: function(revisionByIdMap){
						cachedDocs.forEach(function(cachedDoc){
							var cachedDocId = cachedDoc._id;
							var cachedDocRev = cachedDoc._rev;
							if( revisionByIdMap[cachedDocId] === cachedDocRev ){
								docIdMap[cachedDocId] = cachedDoc;
								docsToReturn.push(cachedDoc);
							};
						});
						
						performNative();
					}
					,onError: performNative
				});
				
			} else {
				// Nothing in cache. Get from native db
				performNative();
			};
		};
		
		function performNative(){
			// Figure out which docIds to fetch
			var docIdsToFetch = [];
			for(var docIdToFetch in docIdMap){
				if( docIdMap[docIdToFetch] === true ){
					docIdsToFetch.push(docIdToFetch);
				};
			};
			
			if( docIdsToFetch.length > 0 ){
				var opts = $n2.extend({},opts_,{
					docIds: docIdsToFetch
					,onSuccess: storeDocuments
				});
				
				_this.wrappedDb.getDocuments(opts);
			} else {
				done();
			};
		};
		
		function storeDocuments(docs){
			docs.forEach(function(doc){
				docsToReturn.push(doc);	
				docsToStore.push(doc);	
			});
			next();
		};
		
		function next(){
			if( docsToStore.length < 1 ){
				done();
				return;
			};
			
			var doc = docsToStore.pop();
			
			_this.documentCache.updateDocument({
				doc: doc
				,onSuccess: next
				,onError: next
			});
		};
		
		function done(){
			opts_.onSuccess(docsToReturn);
		};
	},

	listAllDocuments: function(opts_) {
		this.wrappedDb.listAllDocuments(opts_);
	},

	getAllDocuments: function(opts_) {
		this.wrappedDb.getAllDocuments(opts_);
	},
	
	getInfo: function(opts_) {
		this.wrappedDb.getInfo(opts_);
	},
	
	queryTemporaryView: function(opts_){
		this.wrappedDb.queryTemporaryView(opts_);
	}
});

// =============================================
// Server
// =============================================

var Server = $n2.Class({
	
	wrappedServer: null,
	
	indexDbCache: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			couchServer: null
			,indexDbCache: null
		},opts_);

		this.wrappedServer = opts.couchServer;
		this.indexDbCache = opts.indexDbCache;
	},

	getPathToServer: function() {
		return this.wrappedServer.getPathToServer();
	},

	getVersion: function() { 
		return this.wrappedServer.getVersion(); 
	},
	
	getReplicateUrl: function() {
		return this.wrappedServer.getReplicateUrl(); 
	},
	
	getActiveTasksUrl: function() {
		return this.wrappedServer.getActiveTasksUrl(); 
	},
	
	getSessionUrl: function() {
		return this.wrappedServer.getSessionUrl(); 
	},
	
	getUniqueId: function(opts_) {
		this.wrappedServer.getUniqueId(opts_);
	},
	
	listDatabases: function(opts_) {
		this.wrappedServer.listDatabases(opts_);
	},

	getUserDb: function() {
		return this.wrappedServer.getUserDb();
	},

	getSession: function(sessionInfo) {
		return this.wrappedServer.getSession(sessionInfo);
	},
	
	getDb: function(opts_) {
		var db = this.wrappedServer.getDb(opts_);
		var documentCache = this.indexDbCache.getDocumentDatabase({
			dbName: opts_.dbName
		});
		return new Database({
			couchDb: db
			,documentCache: documentCache
		});
	},
	
	createDb: function(opts_) {
		var opts = $n2.extend({
			dbName: null
			,onSuccess: function(db){}
			,onError: $n2.reportErrorForced
		},opts_);
		
		var _this = this;
		
		this.wrappedServer.createDb({
			dbName: opts.dbName
			,onSuccess: function(couchDb){
				var db = new Database({
					couchDb: couchDb
				});
				opts.onSuccess(db);
			}
			,onError: opts.onError
		});
	},
	
	deleteDb: function(opts_) {
		this.wrappedServer.deleteDb(opts_);
	},
	
	replicate: function(opts_){
		this.wrappedServer.replicate(opts_);
	},
	
	addInitializedListener: function(listener) {
		this.wrappedServer.addInitializedListener(listener);
	}
});

//=============================================

$n2.couchIndexDb = {
	getServer: function(opts_) {
		var opts = $n2.extend({
			couchServer: null
			,onSuccess: function(couchServer){}
			,onError: function(err){}
		},opts_);
		
		$n2.indexdb.openIndexDb({
			onSuccess: function(n2IndexDb){

				var server = new Server({
					couchServer: opts.couchServer
					,indexDbCache: n2IndexDb
				});
				
				opts.onSuccess(server);
			}
			,onError: function(cause){
				var err = $n2.error.fromString('Error creating cached CouchDb server',cause);
				opts.onError(err);
			}
		});
	}
};

})(jQuery,nunaliit2);
