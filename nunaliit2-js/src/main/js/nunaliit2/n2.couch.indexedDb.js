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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
,DH = 'n2.couch.indexedDb'
;

// =============================================
// Design Document
// =============================================

var DesignDoc = $n2.Class({

	couchDesignDoc: null,
	
	db: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			couchDesignDoc: null
			,db: null
		},opts_);
		
		this.couchDesignDoc = opts.couchDesignDoc;
		this.db = opts.db;
	},

	getDatabase: function(){
		return this.db;
	},
	
	getQueryUrl: function(opts_){
		return this.couchDesignDoc.getQueryUrl(opts_);
	},

	queryView: function(opts_) {
		var opts = $n2.extend({},opts_);
		
		var _this = this;
		
		// Figure out if documents were requested
		var include_docs = false;
		if( opts.include_docs ){
			include_docs = true;
			opts.include_docs = false;
		};
		
		// Intercept success
		var onSuccess = opts.onSuccess;
		opts.onSuccess = queryResult;
		
		this.couchDesignDoc.queryView(opts);
		
		function queryResult(results){
			if( opts.reduce ){
				// Reducing. No documents return
				onSuccess(results);
				
			} else if( include_docs ){
				// Need to fetch documents
				var docIds = [];
				var rowsByDocId = {};
				results.forEach(function(row){
					var docId = row.id;
					
					var rows = rowsByDocId[docId];
					if( !rows ){
						rows = [];
						rowsByDocId[docId] = rows;
						docIds.push(docId);
					};

					rows.push(row);
				});

				_this.db.getDocuments({
					docIds: docIds
					,onSuccess: function(docs){
						docs.forEach(function(doc){
							var docId = doc._id;
							var rows = rowsByDocId[docId];
							if( rows ){
								rows.forEach(function(row){
									row.doc = doc;
								});
							};
						});
						
						onSuccess(results);
					}
					,onError: function(cause){
						var err = $n2.error.fromString('Error obtaining documents returned by query',cause);
						opts.onError(err);
					}
				});
				
			} else {
				// Just return
				onSuccess(results);
			};
		};
	}
});

// =============================================
// Database
// =============================================

var Database = $n2.Class({
	
	wrappedDb: null,
	
	documentCache: null,
	
	dbChangeNotifier: null,
	
	dispatchService: null,
	
	remoteDocumentCountLimit: null,
	
	remoteRevisionCountLimit: null,
	
	id: null,
	
	outstandingDocumentCount: null,
	
	outstandingRevisionCount: null,

	isInitialized: null,
	
	initializeListeners: null,

	isCachingEnabled: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			couchDb: null
			,documentCache: null
			,dispatchService: null
			,remoteDocumentCountLimit: null
			,remoteRevisionCountLimit: null
		},opts_);
		
		var _this = this;
	
		this.wrappedDb = opts.couchDb;
		this.documentCache = opts.documentCache;
		this.dispatchService = opts.dispatchService;
		this.remoteDocumentCountLimit = opts.remoteDocumentCountLimit;
		this.remoteRevisionCountLimit = opts.remoteRevisionCountLimit;
		
		this.id = $n2.getUniqueId();
		this.outstandingDocumentCount = 0;
		this.outstandingRevisionCount = 0;
		this.isInitialized = false;
		this.isCachingEnabled = false;
		this.initializeListeners = [];
		
		// Get info about this database
		this.getInfo({
			onSuccess: receivedDbInfo
			,onError: function(err){
				$n2.log('Error while getting database information: '+err);
				errorInitializing();
			}
		});
		
		// Install update notifier
		this.getChangeNotifier({
			onSuccess: function(notifier){
				_this.dbChangeNotifier = notifier;
				if( _this.dbChangeNotifier ){
					_this.dbChangeNotifier.addListener(function(changes){
						_this._dbChanges(changes);
					});
				};
			}
		});

		function receivedDbInfo(info){
			var error = false;
			
			var dbName = info.db_name;
			if( typeof dbName !== 'string' ){
				$n2.log('Error with database information. db_name should be a string: '+dbName);
				error = true;
			};

			var updateSequence = info.update_seq;
			if( typeof updateSequence !== 'number' ){
				$n2.log('Error with database information. update_sequence should be a number: '+updateSequence);
				error = true;
			};
			
			if( error ){
				errorInitializing();
			} else {
				_this.documentCache.dbName = dbName;
				
				_this.documentCache.getUpdateSequence({
					onSuccess: function(cacheSequenceNumber){
						compareUpdateSequences(updateSequence, cacheSequenceNumber);
					}
					,onError: function(err){
						$n2.log('Error while getting cache update sequence number. '+err);
						errorInitializing();
					}
				});
			};
		};
		
		function compareUpdateSequences(dbUpdateSequence, cacheSequenceNumber){
			if( cacheSequenceNumber === undefined ){
				// The cache has never been used. There is no document in cache.
				// Initialize cache with current update sequence
				_this.documentCache.initializeCache({
					updateSequence: dbUpdateSequence
					,onSuccess: function(){
						done();
					}
					,onError: function(err){
						$n2.log('Error while recording initializing document cache. '+err);
						errorInitializing();
					}
				});

			} else if( dbUpdateSequence === cacheSequenceNumber ){
				// The update sequence in the cache matches the one from the database.
				// This means that the cache is already up-to-date.
				done();
				
			} else if( dbUpdateSequence < cacheSequenceNumber ){
				// Something went terribly wrong. The database update sequence is earlier
				// than the cache. This should never happen. We can not trust the cache.
				// Reinitialize the cache
				_this.documentCache.initializeCache({
					updateSequence: dbUpdateSequence
					,onSuccess: function(){
						done();
					}
					,onError: function(err){
						$n2.log('Error while recording initializing document cache. '+err);
						errorInitializing();
					}
				});

			} else {
				// Must retrieve the changes that have occurred since last time we
				// worked with database
				_this.getChanges({
					since: cacheSequenceNumber
					,onSuccess: updateCacheFromChanges
					,onError: function(err){ 
						$n2.log('Error while obtaining changes from database. '+err);
						errorInitializing();
					}
				});
			};
		};
		
		function updateCacheFromChanges(changes){
			_this._dbChanges(changes);
			done();
		};
		
		function done(){
			// At this point, the cache is initialized
			_this.isCachingEnabled = true;
			_this.isInitialized = true;
			
			// Call all listeners
			_this.initializeListeners.forEach(function(listener){
				listener();
			});
			
			_this.initializeListeners = [];
		};
		
		function errorInitializing(){
			$n2.log('Error while initializing caching database. Caching is disabled.');
			_this.isCachingEnabled = false;
			_this.isInitialized = true;
		};
	},

	getUrl: function(){
		return this.wrappedDb.getUrl();
	},
	
	getDesignDoc: function(opts_) {
		var couchDesignDoc = this.wrappedDb.getDesignDoc(opts_);

		var designDoc = new DesignDoc({
			couchDesignDoc: couchDesignDoc
			,db: this
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
		var _this = this;
		
		if( typeof this.remoteRevisionCountLimit === 'number' ){
			// Break up requests in chunks of appropriate size, re-assemble
			// response
			var docIds = opts_.docIds.slice(); // clone
			var info = {};
			var outstandingCount = docIds.length;
			
			this._updateOutstandingRevisionCount(outstandingCount);
			
			var opts = $n2.extend({
				onSuccess: function(info){}
				,onError: function(err){}
			},opts_);
			
			fetchChunk();
			
		} else {
			// No limit. Make complete request
			this.wrappedDb.getDocumentRevisions(opts_);
		};
		
		function fetchChunk(){
			if( docIds.length <= 0 ){
				// Call complete
				_this._updateOutstandingRevisionCount(0 - outstandingCount);
				opts.onSuccess(info);

			} else {
				var requestDocIds = docIds.splice(0,_this.remoteRevisionCountLimit);
				_this.wrappedDb.getDocumentRevisions({
					docIds: requestDocIds
					,onSuccess: function(requestInfo){
						_this._updateOutstandingRevisionCount(0 - requestDocIds.length);
						outstandingCount = outstandingCount - requestDocIds.length;
						
						// Accumulate revisions in one response
						for(var docId in requestInfo){
							var rev = requestInfo[docId];
							info[docId] = rev;
						};
						
						// Fetch next chunk
						fetchChunk();
					}
					,onError: function(err){
						_this._updateOutstandingRevisionCount(0 - outstandingCount);
						opts.onError(err);
					}
				});
			};
		};
	},
	
	buildUploadFileForm: function(jQuerySet, options_) {
		this.wrappedDb.buildUploadFileForm(jQuerySet, options_);
	},
	
	createDocument: function(opts_) {
		var _this = this;

		// This request is dependent on the cache.
		// Do not performed until initialized
		if( !this.isInitialized ){
			this.initializeListeners.push(function(){
				_this.createDocument(opts_);
			});
			return;
		};

		// Modifies request
		var opts = $n2.extend({},opts_,{
			onSuccess: storeDocument
		});

		this.wrappedDb.createDocument(opts);
		
		function storeDocument(docInfo){
			if( _this.isCachingEnabled ){
				var doc = $n2.extend({},opts_.data);
				doc._id = docInfo.id;
				doc._rev = docInfo.rev;
				var changes = [];
				changes.push({
					id: doc._id
					,rev: doc._rev
					,doc: doc
				});
				_this.documentCache.performChanges(changes);
			};
			opts_.onSuccess(docInfo);
		};
	},
	
	updateDocument: function(opts_) {
		var _this = this;

		// This request is dependent on the cache.
		// Do not performed until initialized
		if( !this.isInitialized ){
			this.initializeListeners.push(function(){
				_this.updateDocument(opts_);
			});
			return;
		};
		
		// Modifies request
		var opts = $n2.extend({},opts_,{
			onSuccess: storeDocument
		});

		this.wrappedDb.updateDocument(opts);
		
		function storeDocument(docInfo){
			if( _this.isCachingEnabled ){
				var doc = $n2.extend({},opts_.data);
				doc._id = docInfo.id;
				doc._rev = docInfo.rev;
				var changes = [];
				changes.push({
					id: doc._id
					,rev: doc._rev
					,doc: doc
				});
				_this.documentCache.performChanges(changes);
			};
			opts_.onSuccess(docInfo);
		};
	},
	
	deleteDocument: function(opts_) {
		var _this = this;

		// This request is dependent on the cache.
		// Do not performed until initialized
		if( !this.isInitialized ){
			this.initializeListeners.push(function(){
				_this.deleteDocument(opts_);
			});
			return;
		};
		
		// Modifies request
		var opts = $n2.extend({},opts_,{
			onSuccess: deleteDocument
		});

		this.wrappedDb.deleteDocument(opts);
		
		function deleteDocument(docInfo){
			if( _this.isCachingEnabled ){
				var changes = [];
				changes.push({
					id: opts_.data._id
					,rev: docInfo.rev
					,deleted: true
				});
				_this.documentCache.performChanges(changes);
			};
			opts_.onSuccess(docInfo);
		};
	},
	
	bulkDocuments: function(documents, options_) {
		this.wrappedDb.bulkDocuments(documents, options_);
	},
	
	getDocument: function(opts_) {
		var _this = this;

		// This request is dependent on the cache.
		// Do not performed until initialized
		if( !this.isInitialized ){
			this.initializeListeners.push(function(){
				_this.getDocument(opts_);
			});
			return;
		};
		
		if( opts_.skipCache ){
			perfromNative();
		} else {
			this._validateDocumentCache({
				onSuccess: function(){
					_this.documentCache.getDocument({
						docId: opts_.docId
						,onSuccess: checkDocument
						,onError: performNative
					});
				}
				,onError: performNative
			});
		};
		
		function checkDocument(doc){
			if( doc ) {
				opts_.onSuccess(doc);
			} else {
				performNative();
			};
		};
		
		function performNative(){
			// Get document from CouchDb
			var opts = $n2.extend({},opts_,{
				onSuccess: storeDocument
			});

			_this.wrappedDb.getDocument(opts);
		};
		
		function storeDocument(doc){
			if( _this.isCachingEnabled ){
				_this.documentCache.updateDocument(doc);
			};
			opts_.onSuccess(doc);
		};
	},

	getDocuments: function(opts_) {
		var _this = this;

		// This request is dependent on the cache.
		// Do not performed until initialized
		if( !this.isInitialized ){
			this.initializeListeners.push(function(){
				_this.getDocuments(opts_);
			});
			return;
		};

		var docIdMap = {};
		var docsToReturn = [];
		var docIdsToFetchRemotely = [];

		// Make a map of documents we wish to get
		var count = 0;
		opts_.docIds.forEach(function(docId){
			if( docIdMap[docId] ){
				// Already requested
			} else {
				docIdMap[docId] = true;
				++count;
			};
		});

		this._updateOutstandingDocumentCount(count);

		this._validateDocumentCache({
			onSuccess: function(){
				// Are the requested documents in cache?
				_this.documentCache.getDocuments({
					docIds: opts_.docIds
					,onSuccess: documentsFromCache
					,onError: performNative
				});
			}
			,onError: performNative
		});

		function documentsFromCache(cachedDocs){
			if( cachedDocs && cachedDocs.length > 0 ){
				cachedDocs.forEach(function(cachedDoc){
					var cachedDocId = cachedDoc._id;

					docIdMap[cachedDocId] = cachedDoc;
					docsToReturn.push(cachedDoc);
				});
			};

			performNative();
		};
		
		function performNative(){
			// Figure out which docIds to fetch
			for(var docIdToFetch in docIdMap){
				if( docIdMap[docIdToFetch] === true ){
					docIdsToFetchRemotely.push(docIdToFetch);
				};
			};

			// Discount the number of documents received from the cache
			var delta = docIdsToFetchRemotely.length - count;
			_this._updateOutstandingDocumentCount(delta);
			count = docIdsToFetchRemotely.length;
			
			performRemoteRequest();
		};
		
		function performRemoteRequest(){
			// Figure out how many docs to fetch in this request
			if( docIdsToFetchRemotely.length > 0 ){
				var docIdsThisRequest;
				if( typeof _this.remoteDocumentCountLimit === 'number' ){
					docIdsThisRequest = docIdsToFetchRemotely.splice(0, _this.remoteDocumentCountLimit);
				} else {
					// No limit, ask for them all
					docIdsThisRequest = docIdsToFetchRemotely;
					docIdsToFetchRemotely = [];
				};
				
				var opts = $n2.extend({},opts_,{
					docIds: docIdsThisRequest
					,onSuccess: function(docs){
						_this._updateOutstandingDocumentCount(0 - docIdsThisRequest.length);
						count = count - docIdsThisRequest.length;

						docs.forEach(function(doc){
							docsToReturn.push(doc);	
						});
						
						if( _this.isCachingEnabled ){
							_this.documentCache.updateDocuments(docs);
						};
						
						performRemoteRequest();
					}
					,onError: function(err){
						_this._updateOutstandingDocumentCount(0 - count);
						count = 0;
						opts_.onError(err);
					}
				});
				
				_this.wrappedDb.getDocuments(opts);
			} else {
				done();
			};
		};
		
		function done(){
			_this._updateOutstandingDocumentCount(0 - count);
			count = 0;
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
	},
	
	_dbChanges: function(changes){
		var _this = this;
		
		var lastSeq = changes.last_seq;
		var results = changes.results.slice(); // clone so we can reverse
		
		// Reverse results so we see the latest changes, first
		results.reverse();
		
		// Keep track of which document we have already seen
		var seenByDocId = {};
		
		// Keep track of changes to apply to cache
		var cacheChanges = [];
		
		results.forEach(function(updateRecord){
			var docId = updateRecord.id;
			
			if( seenByDocId[docId] ){
				// Already processed
			} else {
				var latestNumber;
				var latestRev;
				if( $n2.isArray(updateRecord.changes) ) {
					updateRecord.changes.forEach(function(change){
						var number = getNumberFromRevision(change.rev);
						
						if( latestNumber === undefined ){
							latestNumber = number;
							latestRev = change.rev;
						} else if( number > latestNumber ){
							latestNumber = number;
							latestRev = change.rev;
						};
					});
				};
				
				if( updateRecord.deleted 
				 && typeof latestRev === 'string' ){
					// Remove from cache
					var cacheChange = {
						id: docId
						,rev: latestRev
						,deleted: true
					};
					cacheChanges.push(cacheChange);
					seenByDocId[docId] = cacheChange;
					
				} else if( typeof latestRev === 'string' ){
					// Remove from cache
					var cacheChange = {
						id: docId
						,rev: latestRev
					};
					cacheChanges.push(cacheChange);
					seenByDocId[docId] = cacheChange;
				};
			};
		});

		// Update sequence
		cacheChanges.push({
			updateSequence: lastSeq
		});
		
		// Record how far we have processed the change feed
		this.documentCache.performChanges(cacheChanges);

		function getNumberFromRevision(revision){
			var splits = revision.split('-');
			var number = 1 * splits[0];
			return number;
		};
	},
	
	_validateDocumentCache: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		
		if( !this.isCachingEnabled ){
			opts.onError('Caching is not enabled');
		};
		
		this.documentCache.getUpdateSequence({
			onSuccess: cacheSequenceNumber
			,onError: function(err){
				$n2.log('Error while validating cache (retrieve cache sequence number). '+err);
				opts.onError(err);
			}
		});
		
		function cacheSequenceNumber(cacheSequenceNumber){
			_this.wrappedDb.getChanges({
				since: cacheSequenceNumber
				,onSuccess: applyChanges
				,onError: function(err){ 
					$n2.log('Error while validating cache (get changes). '+err);
					opts.onError(err);
				}
			});
		};
		
		function applyChanges(changes){
			_this._dbChanges(changes);
			opts.onSuccess();
		};
	},
	
	_updateOutstandingDocumentCount: function(delta){
		this.outstandingDocumentCount += delta;
		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'waitReport'
				,requester: this.id
				,name: 'fetchDocuments'
				,label: _loc('Retrieving documents')
				,count: this.outstandingDocumentCount
			});
		};
	},
	
	_updateOutstandingRevisionCount: function(delta){
		this.outstandingRevisionCount += delta;
		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'waitReport'
				,requester: this.id
				,name: 'fetchRevisions'
				,label: _loc('Verifying revisions')
				,count: this.outstandingRevisionCount
			});
		};
	}
});

// =============================================
// Server
// =============================================

var Server = $n2.Class({
	
	wrappedServer: null,
	
	indexedDbConnection: null,
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			couchServer: null
			,indexedDbConnection: null
			,dispatchService: null
		},opts_);
		
		this.wrappedServer = opts.couchServer;
		this.indexedDbConnection = opts.indexedDbConnection;
		this.dispatchService = opts.dispatchService;
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
		var couchDatabase = this.wrappedServer.getDb(opts_);
		if( opts_.allowCaching ){
			var documentCache = this.indexedDbConnection.getDocumentCache({
				dispatchService: this.dispatchService
			});
			return new Database({
				couchDb: couchDatabase
				,documentCache: documentCache
				,dispatchService: this.dispatchService
				,remoteDocumentCountLimit: opts_.remoteDocumentCountLimit
				,remoteRevisionCountLimit: opts_.remoteRevisionCountLimit
			});
		} else {
			return couchDatabase;
		};
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

$n2.couchIndexedDb = {
	getServer: function(opts_) {
		var opts = $n2.extend({
			couchServer: null
			,dispatchService: null
			,onSuccess: function(couchServer){}
			,onError: function(err){}
		},opts_);
		
		$n2.indexedDb.openIndexedDb({
			onSuccess: function(indexedDbConnection){

				var server = new Server({
					couchServer: opts.couchServer
					,dispatchService: opts.dispatchService
					,indexedDbConnection: indexedDbConnection
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
