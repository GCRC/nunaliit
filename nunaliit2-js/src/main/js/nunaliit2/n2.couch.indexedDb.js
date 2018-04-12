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

var DesignDoc = $n2.Class('couchIndexedDb.DesignDoc',{

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

var Database = $n2.Class('couchIndexedDb.Database',{
	
	wrappedDb: null,
	
	documentCache: null,
	
	dbName: null,
	
	dbChangeNotifier: null,
	
	dispatchService: null,
	
	remoteDocumentCountLimit: null,
	
	remoteRevisionCountLimit: null,
	
	id: null,
	
	outstandingRevisionCount: null,

	isInitialized: null,
	
	initializeListeners: null,

	isCachingEnabled: null,
	
	fetchDocumentRequests: null,
	
	fetchDocumentRequestsByDocId: null,
	
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
		this.outstandingRevisionCount = 0;
		this.isInitialized = false;
		this.isCachingEnabled = false;
		this.initializeListeners = [];
		this.fetchDocumentRequests = null;
		this.fetchDocumentRequestsByDocId = null;
		
		// Get info about this database
		this.getInfo({
			onSuccess: receivedDbInfo
			,onError: function(err){
				$n2.log('Error while getting database information: '+err);
				errorInitializing();
			}
		});

		function receivedDbInfo(info){
			var error = false;
			
			_this.dbName = info.db_name;
			if( typeof _this.dbName !== 'string' ){
				$n2.log('Error with database information. db_name should be a string: '+_this.dbName);
				error = true;
			};

			var updateSequence = undefined;
			// In CouchDB 1.x, update_seq is a number
			// In CouchDB 2.x, update_seq is a string
			if( typeof info.update_seq === 'string' ){
				updateSequence = info.update_seq;
			} else if( typeof info.update_seq === 'number' ){
				updateSequence = ''+info.update_seq;
			} else {
				$n2.logError('Error with database information. Can not interpret update_seq: '+info.update_seq);
				error = true;
			};
			
			if( error ){
				errorInitializing();
			} else {
				_this.documentCache.getUpdateSequence({
					dbName: _this.dbName
					,onSuccess: function(cacheSequenceNumber){
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
			if( !cacheSequenceNumber ){
				// The cache has never been used. There is no document in cache.
				// Initialize cache with current update sequence
				_this.documentCache.initializeCache({
					dbName: _this.dbName
					,updateSequence: dbUpdateSequence
					,onSuccess: function(){
						listenToDbChangeFeed();
					}
					,onError: function(err){
						$n2.log('Error while recording initializing document cache. '+err);
						errorInitializing();
					}
				});

			} else if( dbUpdateSequence === cacheSequenceNumber ){
				// The update sequence in the cache matches the one from the database.
				// This means that the cache is already up-to-date.
				listenToDbChangeFeed();
				
			} else {
				// Must retrieve the changes that have occurred since last time we
				// worked with database
				_this.getChanges({
					since: cacheSequenceNumber
					,onSuccess: function(changes){
						_this._dbChanges(changes);
						listenToDbChangeFeed();
					}
					,onError: function(err){ 
						$n2.log('Error while obtaining changes from database. '+err);
						errorInitializing();
					}
				});
			};
		};
		
		function listenToDbChangeFeed(){
			// Install update notifier
			_this.getChangeNotifier({
				onSuccess: function(notifier){
					_this.dbChangeNotifier = notifier;
					if( _this.dbChangeNotifier ){
						_this.dbChangeNotifier.addListener(function(changes){
							_this._dbChanges(changes);
						});
					};
					
					done();
				},
				onError: function(err){
					$n2.log('Error while getting database change notifier: '+err);
					errorInitializing();
				}
			});

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

	getServer: function(){
		return this.wrappedDb.getServer();
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
					dbName: _this.dbName
					,id: doc._id
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
					dbName: _this.dbName
					,id: doc._id
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
					dbName: _this.dbName
					,id: opts_.data._id
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
		
		var skipCache = false;
		var skipStore = false;
		if( opts_.rev ){
			// Asking for a specific revision
			skipCache = true;
			skipStore = true;
		};
		if( opts_.revs_info ){
			// Asking for a revision information
			skipCache = true;
			skipStore = true;
		};
		if( opts_.revisions ){
			// Asking for a revision information
			skipCache = true;
			skipStore = true;
		};
		if( opts_.conflicts ){
			// Asking for a conflict information
			skipCache = true;
			skipStore = true;
		};
		if( opts_.deleted_conflicts ){
			// Asking for a conflict information
			skipCache = true;
			skipStore = true;
		};
		if( opts_.skipCache ){
			// Specifically asking to skip cache
			skipCache = true;
		};
		
		if( skipCache ){
			performNative();
		} else {
			this._validateDocumentCache({
				onSuccess: function(){
					_this.documentCache.getDocument({
						dbName: _this.dbName
						,docId: opts_.docId
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
			// Attempt caching
			if( _this.isCachingEnabled && !skipStore ){
				var changes = [];
				changes.push({
					dbName: _this.dbName
					,id: doc._id
					,rev: doc._rev
					,doc: doc
				});
				_this.documentCache.performChanges(changes);
			};

			// Return document to client
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

		var opts = $.extend(true, {
			docIds: null
			,skipCache: undefined
			,onSuccess: function(docs){}
			,onError: function(errorMsg){ $n2.log(errorMsg); }
		},opts_);
		
		if( !$n2.isArray(opts.docIds) ){
			throw new Error('Database.getDocuments() docIds must be an array');
		};
		opts.docIds.forEach(function(docId){
			if( typeof docId !== 'string' ){
				throw new Error('Database.getDocuments() docIds[*] must be a string');
			};
		});

		if( opts.skipCache ){
			performRemoteRequest();
		} else {
			this._validateDocumentCache({
				onSuccess: function(){
					_this._performDocumentFetchRequest({
					    docIds: opts.docIds
					    ,onSuccess: opts.onSuccess
					    ,onError: opts.onError
					});
				}
				,onError: performRemoteRequest
			});
		};

		function performRemoteRequest(){
			var remoteOpts = $n2.extend({},opts,{
				onSuccess: function(docs){
					if( _this.isCachingEnabled ){
						var changes = [];

						docs.forEach(function(doc){
							changes.push({
								dbName: _this.dbName
								,id: doc._id
								,rev: doc._rev
								,doc: doc
							});
						});

						_this.documentCache.performChanges(changes);
					};
					
					opts.onSuccess(docs);
				}
			});
			
			_this.wrappedDb.getDocuments(remoteOpts);
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
		// changes:
		// {
		//    "last_seq": "104-g1AAAAJjeJyd0ksKwjAQANBgBX8oFA-gJ5Am6ces7E10JmkpperKtd5Eb6I30ZvUfLpwUYSWwARmmAfDTEUIGReeIr48X2ShMKUs2QT60UqXBkBwVdd1WXiwPOrEKICcRlnY1vCHwbWOuGukhZVCJkQeYFcpNdK-kWZOyjAHuu0qHYx0baSplRjnDKXoKJ2GOpKb_jR2N9rEaoJzEUM_7eG0p9F8q9EwgwS6Tum0l9PeRpu7SZWkHKJe2sdpPxuImUKRtF5F-QUbHp8f",
		//    "pending": 0,
		//    "results": [
		//       {
		//          "seq": "1-g1AAAAF1eJzLYWBg4MhgTmEQTM4vTc5ISXIwNDLXMwBCwxygFFMiQ5L8____szKYExlzgQLsBolphqapJtg04DEmSQFIJtmDTEpkwKfOAaQunrC6BJC6eoLq8liAJEMDkAIqnU-M2gUQtfuJUXsAovY-MWofQNSC3JsFAMjHZqY",
		//          "id": "module.map.label",
		//          "changes": [
		//             {
		//                "rev": "1-6a63a7493382323b2db86a85ae4b518d"
		//             }
		//          ]
		//       },
		//       ...
		//       {
		//          "seq": "104-g1AAAAJjeJyd0ksKwjAQANBgBX8oFA-gJ5Am6ces7E10JmkpperKtd5Eb6I30ZvUfLpwUYSWwARmmAfDTEUIGReeIr48X2ShMKUs2QT60UqXBkBwVdd1WXiwPOrEKICcRlnY1vCHwbWOuGukhZVCJkQeYFcpNdK-kWZOyjAHuu0qHYx0baSplRjnDKXoKJ2GOpKb_jR2N9rEaoJzEUM_7eG0p9F8q9EwgwS6Tum0l9PeRpu7SZWkHKJe2sdpPxuImUKRtF5F-QUbHp8f",
		//          "id": "org.nunaliit.css.body",
		//          "deleted": true
		//          "changes": [
		//             {
		//                "rev": "1-c6d43bc49dbc259ecc8a9f75d82119df"
		//             }
		//          ]
		//       }
		//    ]
		// }
		var _this = this;
		
		var lastSeq = undefined;
		if( typeof changes.last_seq === 'string' ){
			lastSeq = changes.last_seq;
		} else if( typeof changes.last_seq === 'number' ) {
			lastSeq = ''+changes.last_seq;
		} else {
			$n2.logError('Unable to handle last_seq: '+changes.last_seq);
		};

		var results = changes.results.slice(); // clone so we can reverse
		
		// Reverse results so we see the latest changes first, taking
		// precedence over older ones
		results.reverse();
		
		// Keep track of which document we have already seen
		var seenByDocId = {};
		
		// Keep track of changes to apply to cache
		var cacheChanges = [];
		
		results.forEach(function(updateRecord){
			var docId = updateRecord.id;

			// Do not process a document twice
			if( !seenByDocId[docId] ){
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
					// Inform cache of deletion
					var cacheChange = {
						dbName: _this.dbName
						,id: docId
						,rev: latestRev
						,deleted: true
					};
					cacheChanges.push(cacheChange);
					seenByDocId[docId] = cacheChange;
					
				} else if( typeof latestRev === 'string' ){
					// Inform cache of update
					var cacheChange = {
						dbName: _this.dbName
						,id: docId
						,rev: latestRev
					};
					cacheChanges.push(cacheChange);
					seenByDocId[docId] = cacheChange;
				};
			};
		});

		// Update sequence
		cacheChanges.push({
			dbName: _this.dbName
			,updateSequence: lastSeq
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
			dbName: _this.dbName
			,onSuccess: cacheSequenceNumber
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
	
	_updateOutstandingDocumentCount: function(count){
		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'waitReport'
				,requester: this.id
				,name: 'fetchDocuments'
				,label: _loc('Retrieving documents')
				,count: count
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
	},
	
	/**
	 * Serialize all document fetch requests and prevent fetching the
	 * same document multiple times. This function checks the cache first
	 * and then fetches documents remotely.
	 */
	_performDocumentFetchRequest: function(request){
		var _this = this;
		
		// Validate the request
		// {
		//    docIds: []
		//    ,onSuccess: function(docs){}
		//    ,onError: function(err){}
		// }
		if( typeof request !== 'object' ){
			throw new Error('Database._performDocumentFetchRequest() request must be an object');
		};
		if( !$n2.isArray(request.docIds) ){
			throw new Error('Database._performDocumentFetchRequest() request.docId must be an array');
		};
		request.docIds.forEach(function(docId){
			if( typeof docId !== 'string' ){
				throw new Error('Database._performDocumentFetchRequest() request.docId[*] must be a string');
			};
		});
		if( typeof request.onSuccess !== 'function' ){
			throw new Error('Database._performDocumentFetchRequest() request.onSuccess must be a function');
		};
		if( typeof request.onError !== 'function' ){
			throw new Error('Database._performDocumentFetchRequest() request.onError must be a function');
		};
		
		// Augment request to keep track of progress
		request.docsById = {};
		request.outsdandingDocumentCount = request.docIds.length;
		
		// Special case: nothing requested
		if( request.docIds.length <= 0 ){
			request.onSuccess([]);
			return;
		};

		// Check if we need to set up a new thread
		var startThread = false;
		if( !this.fetchDocumentRequests ){
			startThread = true;
			this.fetchDocumentRequests = [];
			this.fetchDocumentRequestsByDocId = {};
		};
		
		// Break up the request into fetch requests for each document identifier
		request.docIds.forEach(function(docId){
			var fetchRequest = _this.fetchDocumentRequestsByDocId[docId];
			if( !fetchRequest ){
				fetchRequest = {
					docId: docId
					,requests: []
				};
				_this.fetchDocumentRequestsByDocId[docId] = fetchRequest;
				_this.fetchDocumentRequests.push(fetchRequest);
			};
			
			fetchRequest.requests.push(request);
		});

		this._updateOutstandingDocumentCount(this.fetchDocumentRequests.length);

		var remoteDocIds = [];
		var finishedRequests = [];
		if( startThread ){
			runThread();
		};
		
		function runThread(){
			if( _this.fetchDocumentRequests.length <= 0 ){
				// We are done. Stop thread
				_this.fetchDocumentRequests = null;
				_this.fetchDocumentRequestsByDocId = null;
				
				_this._updateOutstandingDocumentCount(0);
				
			} else {
				_this._updateOutstandingDocumentCount(_this.fetchDocumentRequests.length);

				// Continue, we have more work to do.
				remoteDocIds = [];
				checkCache();
			};
		};

		function checkCache(){
			if( _this.fetchDocumentRequests.length <= 0 ){
				// No more requests. Fetch remotely
				fetchRemotely();

			} else if( typeof _this.remoteDocumentCountLimit === 'number' 
			 && remoteDocIds.length >= _this.remoteDocumentCountLimit ){
				// We have accumulated enough doc ids to fetch remotely
				fetchRemotely();
			
			} else {
				var fetchRequest = _this.fetchDocumentRequests.shift();
				
				if( _this.isCachingEnabled ){
					// Attempt to get from cache
					_this.documentCache.getDocument({
						dbName: _this.dbName
						,docId: fetchRequest.docId
						,onSuccess: function(doc){
							if( doc ){
								receivedDocument(doc);
								checkCache();
							} else {
								// Do not have document in cache. Get document remotely
								remoteDocIds.push(fetchRequest.docId);
								checkCache();
							};
						}
						,onError: function(err){
							// Error on cache. Get document remotely
							remoteDocIds.push(fetchRequest.docId);
							checkCache();
						}
					});
				} else {
					// Cache is not available. Fetch this document remotely
					remoteDocIds.push(fetchRequest.docId);

					// Continue
					checkCache();
				};
			};
		};
		
		function fetchRemotely(){

			if( remoteDocIds.length > 0 ){
				// Make a map of remotely requested document to figure out
				// which one we got
				var docsById = {};
				remoteDocIds.forEach(function(docId){
					docsById[docId] = null;
				});

				_this.wrappedDb.getDocuments({
					docIds: remoteDocIds
					,onSuccess: function(docs){
						// Update map
						docs.forEach(function(doc){
							docsById[doc._id] = doc;
						});
						
						// For each requested document, report the outcome
						for(var docId in docsById){
							var doc = docsById[docId];
							if( doc ){
								receivedDocument(doc);
							} else {
								documentNotAvailable(docId);
							};
						};
						
						// Cache the document received remotely
						if( _this.isCachingEnabled ){
							var changes = [];
							docs.forEach(function(doc){
								changes.push({
									dbName: _this.dbName
									,id: doc._id
									,rev: doc._rev
									,doc: doc
								});
							});
							_this.documentCache.performChanges(changes);
						};
						
						sendFinishedResults();
						runThread();
					}
					,onError: function(err){ 
						// For each requested document, report error
						for(var docId in docsById){
							errorReceived(docId, err);
						};
						sendFinishedResults();
						runThread();
					}
				});
				
				// While we are waiting for remot server, send what we have accumulated
				// so far from cache
				sendFinishedResults();

			} else {
				// Nothing to fetch remotely
				sendFinishedResults();
				runThread();
			};
		};
		
		function sendFinishedResults(){
			var requests = finishedRequests;
			finishedRequests = [];
			
			requests.forEach(function(finishedRequest){
				if( finishedRequest.error ){
					finishedRequest.onError(finishedRequest.error);
				} else {
					// Gather the documents
					var docs = [];
					for(var docId in finishedRequest.docsById){
						var doc = finishedRequest.docsById[docId];
						docs.push(doc);
					};
					finishedRequest.onSuccess(docs);
				};
			});
		};
		
		function receivedDocument(doc){
//			fetchRequest = {
//				docId: docId
//				,requests: [
//				{
//					docIds: []
//					,onSuccess: function(docs){}
//					,onError: function(err){}
//					,outsdandingDocumentCount: <number>
//					,docsById: {}
//				}
//	            ]
//			};

			var fetchRequest = _this.fetchDocumentRequestsByDocId[doc._id];
			if( fetchRequest ){
				fetchRequest.requests.forEach(function(request){
					if( !request.docsById[doc._id] ){
						request.docsById[doc._id] = doc;
						--request.outsdandingDocumentCount;
						
						if( request.outsdandingDocumentCount <= 0 ){
							finishedRequests.push(request);
						};
					};
				});
				
				delete _this.fetchDocumentRequestsByDocId[doc._id];
			};
		};

		function documentNotAvailable(docId){
			var fetchRequest = _this.fetchDocumentRequestsByDocId[docId];
			if( fetchRequest ){
				fetchRequest.requests.forEach(function(request){
					--request.outsdandingDocumentCount;
						
					if( request.outsdandingDocumentCount <= 0 ){
						finishedRequests.push(request);
					};
				});
				
				delete _this.fetchDocumentRequestsByDocId[docId];
			};
		};

		function errorReceived(docId,err){
			var fetchRequest = _this.fetchDocumentRequestsByDocId[docId];
			if( fetchRequest ){
				fetchRequest.requests.forEach(function(request){
					if( !request.error ){
						request.error = err;
						
						finishedRequests.push(request);
					};
				});
				
				delete _this.fetchDocumentRequestsByDocId[docId];
			};
		};
	}
});

// =============================================
// Server
// =============================================

var Server = $n2.Class('couchIndexedDb.Server',{
	
	wrappedServer: null,
	
	indexedDbService: null,
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			couchServer: null
			,indexedDbService: null
			,dispatchService: null
		},opts_);
		
		this.wrappedServer = opts.couchServer;
		this.indexedDbService = opts.indexedDbService;
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
			var documentCache = this.indexedDbService.getDocumentCache();
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
function getServer(opts_) {
	var opts = $n2.extend({
		couchServer: null
		,indexedDbService: null
		,dispatchService: null
		,onSuccess: function(couchServer){}
		,onError: function(err){}
	},opts_);
	
	var server = new Server({
		couchServer: opts.couchServer
		,dispatchService: opts.dispatchService
		,indexedDbService: opts.indexedDbService
	});
	
	opts.onSuccess(server);
};

//=============================================

$n2.couchIndexedDb = {
	getServer: getServer
};

})(jQuery,nunaliit2);
