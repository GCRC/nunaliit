;(function($n2){
"use strict";

// ===================================================
var DB_STORE_DOCS = 'docs';
var DocumentDatabase = $n2.Class({
	
	db: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			db: null
		},opts_);
		
		this.db = opts.db;
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
var DB_NAME = 'nunaliit';
var DB_VERSION = 1;
function openDocumentDatabase(opts_){
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
		
		var docDb = new DocumentDatabase({
			db: db
		});

		opts.onSuccess(docDb);
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
	openDocumentDatabase: openDocumentDatabase
};
	
})(nunaliit2);