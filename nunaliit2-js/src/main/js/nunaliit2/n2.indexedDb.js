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
	
	memoryCache: null,
	
	memoryCacheSize: null,

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
		this.memoryCache = null;
		this.memoryCacheSize = 0;
	},
	
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
		
		this.deleteAllDocuments({
			onSuccess: function(){
				_this.setUpdateSequence({
					updateSequence: updateSequence
					,onSuccess: opts.onSuccess
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
	
	/**
	 * Checks the document cache for a docId. If the revision
	 * associated with the document matches the given one, keep the
	 * document in the cache. Otherwise, remove it.
	 */
	checkDocumentRevision: function(opts_){
		var opts = $n2.extend({
			docId: null
			,rev: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		// Check documents that are about to be stored
		if( this.memoryCache ){
			var doc = this.memoryCache[opts.docId];
			if( doc ){
				if( doc._rev !== opts.rev ){
					delete this.memoryCache[opts.docId];
					this._updateMemoryCacheSize(-1);
				};
			};
		};
		
		this.getDocument({
			docId: opts.docId
			,onSuccess: retrievedDocument
			,onError: opts.onError
		});
		
		function retrievedDocument(doc){
			if( doc ){
				if( doc._rev !== opts.rev ){
					_this.deleteDocument({
						docId: opts.docId
						,onSuccess: opts.onSuccess
						,onError: opts.onError
					});
				};
			};
		};
	},
	
	getUpdateSequence: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(updateSequence){}
			,onError: function(err){}
		},opts_);

		var db = this.db;

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
	},
	
	setUpdateSequence: function(opts_){
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
	},
	
	deleteAllDocuments: function(opts_){
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
	
	getDocument: function(opts_){
		var opts = $n2.extend({
			docId: null
			,onSuccess: function(doc){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		
		// Check documents that are about to be stored
		if( this.memoryCache ){
			var doc = this.memoryCache[opts.docId];
			if( doc ){
				opts.onSuccess(doc);
				return;
			};
		};
		
		var transaction = db.transaction(DB_STORE_DOCS, 'readonly');
	    var store = transaction.objectStore(DB_STORE_DOCS);
	    var req = store.get(opts.docId);
	    req.onsuccess = function (evt) {
	    	var doc = this.result;
			opts.onSuccess(doc);
		};
		req.onerror = function(evt) {
			opts.onError(this.error);
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
	    		if( _this.memoryCache ){
	    			doc = _this.memoryCache[docId];
	    		};

	    		if( doc ){
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
			    			docs.push(doc);
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
		
		var mustStartThread = true;
		if( this.memoryCache ){
			mustStartThread = false;
		} else {
			this.memoryCache  = {};
		};

		// Add documents to memory cache
		var cacheSizeDelta = 0;
		var memoryCache = this.memoryCache;
		docs.forEach(function(doc){
			if( memoryCache[doc._id] ){
				memoryCache[doc._id] = doc;
			} else {
				memoryCache[doc._id] = doc;
				++cacheSizeDelta;
			};
		});

		this._updateMemoryCacheSize(cacheSizeDelta);
		
		if( mustStartThread ){
			storeDocuments();
		};

		function storeDocuments(){
			var doc = extractDocumentFromMemoryCache();
			
			if( doc ){
				var transaction = _this.db.transaction(DB_STORE_DOCS, 'readwrite');
			    var store = transaction.objectStore(DB_STORE_DOCS);
			    var req = store.put(doc);
			    req.onsuccess = storeDocuments;
				req.onerror = storeDocuments;
			} else {
				// Done.
				_this.memoryCache = null;
			};
		};
		
		function extractDocumentFromMemoryCache(){
			if( _this.memoryCache ){
				for(var docId in _this.memoryCache){
					var doc = _this.memoryCache[docId];
					delete _this.memoryCache[docId];
					_this._updateMemoryCacheSize(-1);
					return doc;
				};
			};
			
			return undefined;
		};
	},
	
	deleteDocument: function(opts_){
		var opts = $n2.extend({
			docId: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var db = this.db;

		// Check documents that are about to be stored
		if( this.memoryCache ){
			if( this.memoryCache[opts.docId] ){
				delete this.memoryCache[docId];
				this._updateMemoryCacheSize(-1);
			};
		};
		
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
	
	_updateMemoryCacheSize: function(delta){
		this.memoryCacheSize += delta;
		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'waitReport'
				,requester: this.id
				,name: 'cacheDocuments'
				,label: _loc('Caching documents')
				,count: this.memoryCacheSize
			});
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