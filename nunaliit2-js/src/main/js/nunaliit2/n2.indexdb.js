;(function($n2){
"use strict";

// ===================================================
var DB_STORE_DOCS = 'docs';
var DocumentDatabase = $n2.Class({

	db: null,

	dbName: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			db: null
			,dbName: null
		},opts_);
		
		this.db = opts.db;
		this.dbName = opts.dbName;
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

		var db = this.db;
		
		var transaction = db.transaction(DB_STORE_DOCS, 'readonly');
	    var store = transaction.objectStore(DB_STORE_DOCS);

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
	},
	
	_getDocuments: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);

		var countSeeked = 0;
		var docIdMap = {};
		opts.docIds.forEach(function(docId){
			docIdMap[docId] = true;
			++countSeeked;
		});
		
		var docs = [];

		var db = this.db;
		
		var transaction = db.transaction(DB_STORE_DOCS, 'readonly');
	    var store = transaction.objectStore(DB_STORE_DOCS);
	    var req = store.openCursor();
		req.onsuccess = function(event) {
			var cursor = event.target.result;
			if(cursor) {
				var doc = cursor.value;
				var docId = doc._id;
				if( docIdMap[docId] ){
					docs.push(doc);
					--countSeeked;
				};

				if( countSeeked <= 0 ){
					done();
				} else {
					cursor.continue();
				};
			} else {
				// no more results
				done();
			};
		};
		req.onerror = function(evt) {
			opts.onError(this.error);
		};
		
		function done(){
			opts.onSuccess(docs);
		};
	},
	
	updateDocument: function(opts_){
		var opts = $n2.extend({
			doc: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		var doc = opts.doc;
		
		var transaction = db.transaction(DB_STORE_DOCS, 'readwrite');
	    var store = transaction.objectStore(DB_STORE_DOCS);
	    var req = store.put(doc);
	    req.onsuccess = function (evt) {
			opts.onSuccess();
		};
		req.onerror = function() {
			opts.onError(this.error);
		};
	},
	
	deleteDocument: function(opts_){
		var opts = $n2.extend({
			doc: null
			,docId: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var db = this.db;

		var docId = opts.docId;
		if( typeof docId !== 'string' && typeof doc === 'object' ){
			docId = doc._id;
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

	getDocumentDatabase: function(opts_){
		var opts = $n2.extend({
			dbName: null
		},opts_);
		
		var docDb = new DocumentDatabase({
			db: this.db
			,dbName: opts.dbName
		});
		
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