;(function($n2){
"use strict";

var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
,DH = 'n2.indexedDb';

// ===================================================
var DB_STORE_DOCS = 'docs';
var DB_STORE_INFO = 'info';
var DocumentCache = $n2.Class({

	db: null,

	dbName: null,
	
	dispatchService: null,

	id: null,
	
	changes: null,
	
	changesByDocId: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			db: null
			,dbName: null // not likely known at time of creation
			,dispatchService: null
		},opts_);
		
		this.db = opts.db;
		this.dbName = opts.dbName;
		this.dispatchService = opts.dispatchService;

		this.id = $n2.getUniqueId();
		this.changes = null;
		this.changesByDocId = {};
	},

	/**
	 * Initialize or re-initialize the cache to the given update
	 * sequence number.
	 */
	initializeCache: function(opts_){
		var opts = $n2.extend({
			updateSequence: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		var updateSequence = opts.updateSequence;
		if( typeof updateSequence !== 'number' ){
			throw new Error('When initializing document cache, update sequence must be a number');
		};
		
		this._clearDocumentStore({
			onSuccess: function(){
				_this._setUpdateSequence({
					updateSequence: updateSequence
					,onSuccess: function(){
						this.changes = null;
						this.changesByDocId = {};
						opts.onSuccess();
					}
					,onError: function(err){
						$n2.log('Error while recording initial sequence number. '+err);
						opts.onError(err);
					}
				});
			}
			,onError: function(err){
				$n2.log('Error while clearing document store. '+err);
				opts.onError(err);
			}
		});
	},
	
	getUpdateSequence: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(updateSequence){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		
		// Check changes
		var updateSequence;
		if( this.changes ){
			this.changes.forEach(function(change){
				if( change && change.updateSequence ){
					updateSequence = change.updateSequence;
				};
			});
		};

		if( updateSequence ){
			opts.onSuccess(updateSequence);
		} else {
			var transaction = db.transaction(DB_STORE_INFO, 'readonly');
		    var store = transaction.objectStore(DB_STORE_INFO);
		    var req = store.get('sequenceNumber');
		    req.onsuccess = function (evt) {
		    	var value = this.result;
		    	if( typeof value === 'object' 
		    	 && typeof value.updateSequence === 'number' ){
					opts.onSuccess(value.updateSequence);
		    	} else if( typeof value === 'undefined' ){
		    		opts.onSuccess(undefined);
		    	} else {
		    		var err = $n2.error.fromString('Invalid format for indexedDb sequence number');
					opts.onError(err);
		    	};
			};
			req.onerror = function(evt) {
				opts.onError(this.error);
			};
		};
	},
	
	performChanges: function(changes){

		var _this = this;
		var db = this.db;
		
		var mustStartThread = true;
		if( this.changes ){
			mustStartThread = false;
		} else {
			this.changes  = [];
			this.changesByDocId = {};
		};
		
		// Add changes to list of current changes
		changes.forEach(function(change){
			_this.changes.push(change);
			
			if( change.docId ){
				// This is a change to a document. Store the latest
				// change for this document
				var latest = _this.changesByDocId[change.docId];
				
				// If the new change is a change in revision and that
				// the latest change is a store of the document with the
				// same revision, then do not override the document with
				// a revision
				if( typeof change.rev === 'string'
				 && latest 
				 && latest.doc 
				 && latest.doc._rev === change.rev ){
					// Skip
				} else {
					_this.changesByDocId[change.docId] = change;
				};
			};
		});

		if( mustStartThread ){
			applyChange();
		};
		
		function applyChange(){
			if( _this.dispatchService ){
				_this.dispatchService.send(DH,{
					type: 'waitReport'
					,requester: _this.id
					,name: 'cacheDocuments'
					,label: _loc('Caching documents')
					,count: _this.changes.length
				});
			};
			
			if( _this.changes.length <= 0 ){
				// Done applying all changes. Set changes to null to indicate
				// that thread is terminated
				_this.changes = null;
			} else {
				var change = _this.changes.shift();
				
				if( change.updateSequence ){
					_this._setUpdateSequence({
						updateSequence: change.updateSequence
						,onSuccess: applyChange
						,onError: applyChange
					});
				} else if( change.docId ) {
					// This is a change related to a document. Apply the
					// change only if it is the latest one
					var latestChange = _this.changesByDocId[change.docId];
					if( change === latestChange ){
						if( change.deleted ){
							_this._deleteDocument({
								docId: change.docId
								,onSuccess: applyChange
								,onError: applyChange
							});
						} else if( change.rev ){
							// Get document from indexedDb. If the revision no longer
							// matches, remove
							_this.getDocument({
								docId: change.docId
								,onSuccess: function(doc){
									if( doc ){
										if( doc._rev !== change.rev ){
											_this._deleteDocument({
												docId: opts.docId
												,onSuccess: applyChange
												,onError: applyChange
											});
										};
									};
								}
								,onError: applyChange
							});
						} else if( change.doc ){
							_this._storeDocument({
								doc: change.doc
								,onSuccess: applyChange
								,onError: applyChange
							});
						} else {
							$n2.log('Unrecognized change to document cache',change);
							applyChange();
						};
					} else {
						// This is not the latest change. Do not apply.
						applyChange();
					};
				} else {
					$n2.log('Unrecognized change to document cache',change);
					applyChange();
				};
			};
		};
	},
	
	getDocument: function(opts_){
		var opts = $n2.extend({
			docId: null
			,onSuccess: function(doc){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		var docId = opts.docId;
		
		// Check documents that are about to be stored
		var doc;
		var isDeleted = false;
		var validateRev;
		if( this.changesByDocId 
		 && this.changesByDocId[docId] ){
			// There is a pending change on this document
			if( this.changesByDocId[docId].doc ){
				// This document is about to be stored
				doc = this.changesByDocId[docId].doc;
			} else if( this.changesByDocId[docId].deleted ){
				// This document is about to be deleted
    			isDeleted = true;
			} else if( this.changesByDocId[docId].rev ){
				// If we find this document in the cache, we must first
				// validate the revision before returning
				validateRev = this.changesByDocId[docId].rev;
			};
		};
		
		if( isDeleted ){
			opts.onSuccess(undefined);
		} else if( doc ){
			opts.onSuccess(doc);
		} else {
			var transaction = db.transaction(DB_STORE_DOCS, 'readonly');
		    var store = transaction.objectStore(DB_STORE_DOCS);
		    var req = store.get(opts.docId);
		    req.onsuccess = function (evt) {
    	    	var doc = this.result;
    	    	if( doc ){
    	    		if( validateRev ){
    	    			if( doc._rev === validateRev ){
    	    				opts.onSuccess(doc);
    	    			} else {
    	    				opts.onSuccess(undefined);
    	    			};
    	    		} else {
    	    			opts.onSuccess(doc);
    	    		};
    	    	} else {
    	    		// Not in cache
    				opts.onSuccess(undefined);
    	    	};
			};
			req.onerror = function(evt) {
				opts.onError(this.error);
			};
		};
	},
	
	getDocuments: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		
	    var docs = [];
	    var docIds = opts.docIds.slice(); // clone
	    var index = 0;
	    fetch();
	    
	    function fetch(){
	    	if( index >= docIds.length ){
	    		opts.onSuccess(docs);
	    	} else {
	    		var docId = docIds[index];
	    		++index;

	    		// Check documents that are about to be stored
    			var doc;
    			var isDeleted = false;
    			var validateRev;
	    		if( _this.changesByDocId 
	    		 && _this.changesByDocId[docId] ){
	    			// There is a pending change on this document
	    			if( _this.changesByDocId[docId].doc ){
	    				// This document is about to be stored
	    				doc = _this.changesByDocId[docId].doc;
	    			} else if( _this.changesByDocId[docId].deleted ){
	    				// This document is about to be deleted
	        			isDeleted = true;
	    			} else if( _this.changesByDocId[docId].rev ){
	    				// If we find this document in the cache, we must first
	    				// validate the revision before returning
	    				validateRev = _this.changesByDocId[docId].rev;
	    			};
	    		};

	    		if( isDeleted ){
	    			// no need to fetch
	    			setTimeout(fetch,0);
	    		} else if( doc ){
	    			docs.push(doc);
	    			setTimeout(fetch,0);
	    		} else {
	    			// Obtain from database
	    			var transaction = _this.db.transaction(DB_STORE_DOCS, 'readonly');
	    		    var store = transaction.objectStore(DB_STORE_DOCS);
		    	    var req = store.get(docId);
		    	    req.onsuccess = function (evt) {
		    	    	var doc = this.result;
		    	    	if( doc ){
		    	    		if( validateRev ){
		    	    			if( doc._rev === validateRev ){
					    			docs.push(doc);
		    	    			};
		    	    		} else {
				    			docs.push(doc);
		    	    		};
		    	    	};
		    			fetch();
		    		};
		    		req.onerror = fetch;
	    		};
	    	};
	    };
	},
	
	updateDocument: function(doc){
		this.updateDocuments([doc]);
	},
	
	updateDocuments: function(docs){
		var _this = this;

		var changes = [];
		docs.forEach(function(doc){
			changes.push({
				docId: doc._id
				,doc: doc
			});
		});
		
		this.performChanges(changes);
	},
	
	_clearDocumentStore: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var db = this.db;
		
		var transaction = db.transaction(DB_STORE_DOCS, 'readwrite');
	    var store = transaction.objectStore(DB_STORE_DOCS);
	    var req = store.clear();
	    req.onsuccess = opts.onSuccess;
		req.onerror = function(evt){
			var error = this.error;
			$n2.log('Unable to clear indexedDb document store',error);
			opts.onError(error);
		};
		
	},
	
	_storeDocument: function(opts_){
		var opts = $n2.extend({
			doc: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		var doc = opts.doc;

		var transaction = _this.db.transaction(DB_STORE_DOCS, 'readwrite');
	    var store = transaction.objectStore(DB_STORE_DOCS);
	    var req = store.put(doc);
	    req.onsuccess = function (evt) {
			opts.onSuccess();
		};
		req.onerror = function() {
			opts.onError(this.error);
		};
	},
	
	_deleteDocument: function(opts_){
		var opts = $n2.extend({
			docId: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		
		var transaction = db.transaction(DB_STORE_DOCS, 'readwrite');
	    var store = transaction.objectStore(DB_STORE_DOCS);
	    var req = store.delete(docId);
	    req.onsuccess = function (evt) {
			opts.onSuccess();
		};
		req.onerror = function() {
			opts.onError(this.error);
		};
	},
	
	_setUpdateSequence: function(opts_){
		var opts = $n2.extend({
			updateSequence: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		
		if( typeof opts.updateSequence !== 'number' ){
			throw new Error('updateSequence must be a number');
		};

		var transaction = db.transaction(DB_STORE_INFO, 'readwrite');
	    var store = transaction.objectStore(DB_STORE_INFO);
	    var req = store.put({
	    	_id: 'sequenceNumber'
	    	,updateSequence: opts.updateSequence
	    });
	    req.onsuccess = opts.onSuccess;
		req.onerror = function(evt) {
			opts.onError(this.error);
		};
	}
});

//===================================================
var IndexedDbConnection = $n2.Class({

	db: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			db: null
		},opts_);
		
		this.db = opts.db;
	},

	getDocumentCache: function(opts_){
		var opts = $n2.extend({},opts_);
		
		opts.db = this.db;
		
		var docDb = new DocumentCache(opts);
		
		return docDb;
	}
});

//===================================================
var DB_NAME = 'nunaliit';
var DB_VERSION = 2;
function openIndexedDb(opts_){
	var opts = $n2.extend({
		onSuccess: function(indexedDbConnection){}
		,onError: function(err){}
	},opts_);

	var req = indexedDB.open(DB_NAME, DB_VERSION);
	req.onsuccess = function (evt) {
		// Better use "this" than "req" to get the result to avoid problems with
		// garbage collection.
		// db = req.result;
		var db = this.result;
		
		var n2IndexDb = new IndexedDbConnection({
			db: db
		});

		opts.onSuccess(n2IndexDb);
	};

	req.onerror = function (evt) {
		$n2.log("openDb:", evt.target.errorCode);
		opts.onError(this.error);
	};
	
	req.onupgradeneeded = function (evt) {
		
		var db = this.result;
		var oldVersion = undefined;
		var newVersion = undefined;
		if( evt && evt.currentTarget ){
			newVersion = evt.newVersion;
			oldVersion = evt.oldVersion;
		};

		$n2.log('Upgrading indexDB '+DB_NAME+' from: '+oldVersion+' to: '+newVersion);

		//db.deleteObjectStore(DB_STORE_DOCS);
		if( oldVersion < 1 ){ // docs store has existed since version 1
			db.createObjectStore(
				DB_STORE_DOCS
				,{ 
					keyPath: '_id' 
				}
			);
		};
		
		if( oldVersion < 2 ){ // info store has existed since version 1
			db.createObjectStore(
				DB_STORE_INFO
				,{ 
					keyPath: '_id' 
				}
			);
		};
	};
};
	
//===================================================
$n2.indexedDb = {
	openIndexedDb: openIndexedDb
};
	
})(nunaliit2);