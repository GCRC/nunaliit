;(function($n2){
"use strict";

var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
,DH = 'n2.indexedDb';

// ===================================================
var DB_STORE_DOCS = 'docs';
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
			,dbName: null
			,dispatchService: null
		},opts_);
		
		this.db = opts.db;
		this.dbName = opts.dbName;
		this.dispatchService = opts.dispatchService;

		this.id = $n2.getUniqueId();
		this.memoryCache = null;
		this.memoryCacheSize = 0;
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
var NunaliitIndexDb = $n2.Class({

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
var DB_VERSION = 1;
function openIndexDb(opts_){
	var opts = $n2.extend({
		onSuccess: function(documentDatabase){}
		,onError: function(err){}
	},opts_);

	var req = indexedDB.open(DB_NAME, DB_VERSION);
	req.onsuccess = function (evt) {
		// Better use "this" than "req" to get the result to avoid problems with
		// garbage collection.
		// db = req.result;
		var db = this.result;
		
		var n2IndexDb = new NunaliitIndexDb({
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
		db.createObjectStore(
			DB_STORE_DOCS
			,{ 
				keyPath: '_id' 
			}
		);
	};
};
	
//===================================================
$n2.indexdb = {
	openIndexDb: openIndexDb
};
	
})(nunaliit2);