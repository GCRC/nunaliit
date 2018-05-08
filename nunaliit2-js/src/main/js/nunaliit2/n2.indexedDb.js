;(function($n2){
"use strict";

var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
,DH = 'n2.indexedDb';

// ===================================================
var DB_STORE_DOCS = 'docs';
var DB_STORE_INFO = 'info';
var DocumentCache = $n2.Class('DocumentCache',{

	db: null,

	dispatchService: null,

	id: null,
	
	changes: null,
	
	changesByDocId: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			db: null
			,dispatchService: null
		},opts_);
		
		this.db = opts.db;
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
			dbName: null
			,updateSequence: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;

		var dbName = opts.dbName;
		if( typeof dbName !== 'string' ){
			throw new Error('When initializing document cache, dd name must be a string');
		};
		
		var updateSequence = opts.updateSequence;
		if( typeof updateSequence !== 'string' ){
			throw new Error('When initializing document cache, update sequence must be a number');
		};
		
		this.clearCache({
			onSuccess: function(){
				_this._writeUpdateSequence({
					dbName: dbName
					,updateSequence: updateSequence
					,onSuccess: function(){
						_this.changes = null;
						_this.changesByDocId = {};
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
			dbName: null
			,onSuccess: function(updateSequence){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		
		if( typeof opts.dbName !== 'string' ){
			throw new Error('DocumentCache.getUpdateSequence() must have a string attribute for "dbName"');
		};
		
		// Check changes
		var updateSequence;
		if( this.changes ){
			this.changes.forEach(function(change){
				if( change 
				 && change.updateSequence
				 && change.dbName === opts.dbName ){
					updateSequence = change.updateSequence;
				};
			});
		};

		if( updateSequence ){
			opts.onSuccess(updateSequence);
		} else {
			// Get the value stored in the indexedDb
			this._readUpdateSequence({
				dbName: opts.dbName
				,onSuccess: opts.onSuccess
				,onError: opts.onError
			});
		};
	},
	
	performChanges: function(changes){
		// changes:
		// [
		//    // Revision update
		//    {
		//       "dbName": <string: name of database>,
		//       "id": <string: document identifier>,
		//       "rev": <string: current document revision>,
		//       "deleted": <optional boolean: if set, document was deleted>
		//    },
		//    // Database update sequence
		//    {
		//       "dbName": <string: name of database>,
		//       "updateSequence": <string: latest sequence for database>
		//    },
		//    // Document revision
		//    {
		//       "dbName": <string: name of database>,
		//       "id": <string: document identifier>,
		//       "rev": <string: document revision>,
		//       "doc": {
		//          "_id": <string: document identifier must match id>,
		//          "_rev": <string: document revision must match rev>,
		//       }
		//    },
		//    // Document attachments
		//    {
		//       "dbName": <string: name of database>,
		//       "id": <string: document identifier>,
		//       "rev": <string: document revision>,
		//       "attachments": {
		//          <string: attachment name>: <string: attachment value (works only for string attachments)>
		//       }
		//    }
		// ]

		var _this = this;
		var db = this.db;
		
		// Before anything, validate the given changes
		changes.forEach(function(change){
			// Check change structure
			if( typeof change !== 'object' ){
				throw new Error('A cache change must be an object');
			};
			if( typeof change.dbName !== 'string' ){
				throw new Error('A cache change must have a string "dbName" attribute');
			};
			if( typeof change.updateSequence ){
				// This is an update sequence request

			} else if( typeof change.id === 'string' ){
				// This is a document change
				if( typeof change.rev !== 'string' ){
					throw new Error('A document cache change must have a string "rev" attribute');
				};

				if( change.doc === undefined ){
					// OK
				} else if( typeof change.doc !== 'object' ){
					throw new Error('A document cache change must have an object "doc" attribute, if specified');
				} else {
					if( change.doc._id !== change.id ){
						throw new Error('A document cache change that includes a document must match doc._id and change.id');
					};
					if( change.doc._rev !== change.rev ){
						throw new Error('A document cache change that includes a document must match doc._rev and change.rev');
					};
				};

				if( change.deleted === undefined ){
					// OK
				} else if( typeof change.deleted !== 'boolean' ){
					throw new Error('A document cache change must have a boolean "deleted" attribute, if specified');
				};
				
				if( change.attachments === undefined ){
					// OK
				} else if( typeof change.attachments !== 'object' ){
					throw new Error('If a document cache change contains a "attachments" attribute, it must be an object');
				} else {
					for(var attName in change.attachments){
						var att = change.attachments[attName];
						
						if( typeof att !== 'string' ){
							throw new Error('If a document cache change contains "attachments", they must be strings');
						};
					};
				};

			} else {
				$n2.log('Invalid cache change',change);
				throw new Error('Unrecognized cache change');
			};
			
			// Clean up document from extra information that could have been
			// added by Nunaliit like __n2Source
			if( change.doc ){
				var clone = {};
				for(var key in change.doc){
					if( key.length >= 2 
					 && key[0] === '_' 
					 && key[1] === '_' ){
						// Do not copy keys that starts with two underscores
					} else {
						clone[key] = change.doc[key];
					};
				};
				change.doc = clone;
			};
			
			// Convert id for internal use
			if( typeof change.id === 'string' 
			 && typeof change.dbName === 'string' ){
				change.id = change.dbName + '|' + change.id;
				delete change.dbName;
			};
		});

		// Start applying changes
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
			
			if( change.id ){
				// This is a change to a document. Store the latest
				// changes with the latest revision.
				var latest = _this.changesByDocId[change.id];
				if( latest ){
					// There is a change already scheduled for this document.
					// Keep the latest
					var latestNumber = _this._getNumberFromRevision(latest.rev);
					var changeNumber = _this._getNumberFromRevision(change.rev);
					if( changeNumber > latestNumber ){
						// This is a newer revision. Replace the one in cache
						_this.changesByDocId[change.id] = change;
					} else if( changeNumber === latestNumber ){
						// This is the same revision. Merge the changes
						_this._mergeChanges(latest, change);
					};
				} else {
					// There is currently no change associated with this document.
					// Accept this one
					_this.changesByDocId[change.id] = change;
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
					_this._writeUpdateSequence({
						dbName: change.dbName
						,updateSequence: change.updateSequence
						,onSuccess: applyChange
						,onError: applyChange
					});
				} else if( change.id ) {
					// This is a change related to a document. Apply the
					// change only if it is the latest one
					var latestChange = _this.changesByDocId[change.id];
					if( latestChange
					 && change.id === latestChange.id 
					 && change.rev === latestChange.rev ){
						// This is the latest change. Apply
						delete _this.changesByDocId[change.id];

						// Get entry from cache
						_this._getCacheEntry({
							id: latestChange.id
							,onSuccess: function(cacheEntry){
								if( cacheEntry ){
									// There is an entry in the cache. Figure out which one
									// to store
									var cacheNumber = _this._getNumberFromRevision(cacheEntry.rev);
									var changeNumber = _this._getNumberFromRevision(latestChange.rev);
									if( cacheNumber > changeNumber ){
										// Cache is more recent. Do nothing
										applyChange();
									} else if( cacheNumber < changeNumber ){
										// Cache is older than change. Save the change
										_this._storeCacheEntry({
											cacheEntry: latestChange
											,onSuccess: applyChange
											,onError: applyChange
										});
									} else {
										// At this point, the cache and the change are at the same
										// level. Merge both and store the result
										_this._mergeChanges(cacheEntry, latestChange);
										_this._storeCacheEntry({
											cacheEntry: cacheEntry
											,onSuccess: applyChange
											,onError: applyChange
										});
									};
								} else {
									// There is no entry in the cache. Store this one.
									_this._storeCacheEntry({
										cacheEntry: latestChange
										,onSuccess: applyChange
										,onError: applyChange
									});
								};
							}
						});
						
					} else {
						// This is not the latest change. Skip.
						applyChange();
					};
				} else {
					$n2.logError('Unrecognized change to document cache',change);
					applyChange();
				};
			};
		};
	},
	
	getDocument: function(opts_){
		var opts = $n2.extend({
			dbName: null
			,docId: null
			,onSuccess: function(doc){}
			,onError: function(err){}
		},opts_);

		var _this = this;

		var dbName = opts.dbName;
		if( typeof dbName !== 'string' ){
			throw new Error('DocumentCache.getDocument() must have dbName specified as a string attribute');
		};

		var docId = opts.docId;
		if( typeof docId !== 'string' ){
			throw new Error('DocumentCache.getDocument() must have docId specified as a string attribute');
		};
		
		var entryId = dbName + '|' + docId;
		
		// Check pending changes for this document
		var pendingChange;
		if( this.changesByDocId 
		 && this.changesByDocId[entryId] ){
			pendingChange = this.changesByDocId[entryId];
		};
		
		this._getCacheEntry({
			id: entryId
			,onSuccess: function(cacheEntry){
		    	if( cacheEntry && pendingChange ){
		    		// We have to figure which entry we want to use, the one
		    		// in memory (pending) or the one from the cache
					var cacheNumber = _this._getNumberFromRevision(cacheEntry.rev);
					var pendingNumber = _this._getNumberFromRevision(pendingChange.rev);
					if( cacheNumber > pendingNumber ){
						// Cache is more recent. Keep cache

					} else if( cacheNumber < pendingNumber ){
						// Cache is older than pending change. Use pending change.
						cacheEntry = pendingChange;

					} else {
						// At this point, the cache and the change are at the same
						// level. Merge pending changes to cache entry
						_this._mergeChanges(cacheEntry, pendingChange);
					};
		    	};

		    	if( !cacheEntry ){
		    		// Not in cache
					opts.onSuccess(undefined);
		    	} else if( cacheEntry.doc ){
					opts.onSuccess(cacheEntry.doc);
		    	} else {
		    		// In cache, but no document
					opts.onSuccess(undefined);
		    	};
			}
			,onError: opts.onError
		});
	},
	
	getDocuments: function(opts_){
		var opts = $n2.extend({
			dbName: null
			,docIds: null
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		
		var dbName = opts.dbName;
		if( typeof dbName !== 'string' ){
			throw new Error('DocumentCache.getDocuments() must have dbName specified as a string attribute');
		};

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

	    		_this.getDocument({
	    			dbName: dbName
    				,docId: docId
    				,onSuccess: function(doc){
		    	    	if( doc ){
			    			docs.push(doc);
		    	    	};
		    	    	fetch();
    				}
    				,onError: fetch
	    		});
	    	};
	    };
	},
	
	getAttachment: function(opts_){
		var opts = $n2.extend({
			dbName: null
			,docId: null
			,attName: null
			,onSuccess: function(att, rev){}
			,onError: function(err){}
		},opts_);

		var _this = this;

		var dbName = opts.dbName;
		if( typeof dbName !== 'string' ){
			throw new Error('DocumentCache.getAttachment() must have dbName specified as a string attribute');
		};

		var docId = opts.docId;
		if( typeof docId !== 'string' ){
			throw new Error('DocumentCache.getAttachment() must have docId specified as a string attribute');
		};

		var attName = opts.attName;
		if( typeof attName !== 'string' ){
			throw new Error('DocumentCache.getAttachment() must have attName specified as a string attribute');
		};
		
		var entryId = dbName + '|' + docId;
		
		// Check pending changes for this document
		var pendingChange;
		if( this.changesByDocId 
		 && this.changesByDocId[entryId] ){
			pendingChange = this.changesByDocId[entryId];
		};
		
		this._getCacheEntry({
			id: entryId
			,onSuccess: function(cacheEntry){
		    	if( cacheEntry && pendingChange ){
		    		// We have to figure which entry we want to use, the one
		    		// in memory (pending) or the one from the cache
					var cacheNumber = _this._getNumberFromRevision(cacheEntry.rev);
					var pendingNumber = _this._getNumberFromRevision(pendingChange.rev);
					if( cacheNumber > pendingNumber ){
						// Cache is more recent. Keep cache

					} else if( cacheNumber < pendingNumber ){
						// Cache is older than pending change. Use pending change.
						cacheEntry = pendingChange;

					} else {
						// At this point, the cache and the change are at the same
						// level. Merge pending changes to cache entry
						_this._mergeChanges(cacheEntry, pendingChange);
					};
		    	};

		    	if( !cacheEntry ){
		    		// Not in cache
					opts.onSuccess(undefined);
		    	} else  if( cacheEntry.attachments ){
		    		var att = cacheEntry.attachments[attName];
					opts.onSuccess(att, cacheEntry.rev);
		    	} else {
		    		// In cache, but no document
					opts.onSuccess(undefined);
		    	};
			}
			,onError: opts.onError
		});
	},
	
	clearCache: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var _this = this;

		this._clearDocumentStore({
			onSuccess: function(){
				_this._clearInfoStore({
					onSuccess: opts.onSuccess
					,onError: opts.onError
				});
			}
			,onError: opts.onError
		});
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
	
	_clearInfoStore: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var db = this.db;
		
		var transaction = db.transaction(DB_STORE_INFO, 'readwrite');
	    var store = transaction.objectStore(DB_STORE_INFO);
	    var req = store.clear();
	    req.onsuccess = opts.onSuccess;
		req.onerror = function(evt){
			var error = this.error;
			$n2.log('Unable to clear indexedDb info store',error);
			opts.onError(error);
		};
		
	},
	
	_storeCacheEntry: function(opts_){
		var opts = $n2.extend({
			cacheEntry: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		var cacheEntry = opts.cacheEntry;

		var transaction = this.db.transaction(DB_STORE_DOCS, 'readwrite');
	    var store = transaction.objectStore(DB_STORE_DOCS);
	    var req = store.put(cacheEntry);
	    req.onsuccess = function (evt) {
			opts.onSuccess();
		};
		req.onerror = function() {
			opts.onError(this.error);
		};
	},
	
	_getCacheEntry: function(opts_){
		var opts = $n2.extend({
			id: null
			,onSuccess: function(doc){}
			,onError: function(err){}
		},opts_);

		var _this = this;

		var db = this.db;
		var id = opts.id;
		
		var transaction = db.transaction(DB_STORE_DOCS, 'readonly');
	    var store = transaction.objectStore(DB_STORE_DOCS);
	    var req = store.get(id);
	    req.onsuccess = function (evt) {
	    	var cacheEntry = this.result;
			opts.onSuccess(cacheEntry);
		};
		req.onerror = function(evt) {
			opts.onError(this.error);
		};
	},
	
	/**
	 * Retrieves the update sequence stored for a database
	 */
	_readUpdateSequence: function(opts_){
		var opts = $n2.extend({
			dbName: null
			,onSuccess: function(updateSequence){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		
		if( typeof opts.dbName !== 'string' ){
			throw new Error('dbName must be a string');
		};

		var transaction = db.transaction(DB_STORE_INFO, 'readonly');
	    var store = transaction.objectStore(DB_STORE_INFO);
	    var req = store.get(opts.dbName+'|sequenceNumber');
	    req.onsuccess = function (evt) {
			// In CouchDB 1.x, update_seq is a number
			// In CouchDB 2.x, update_seq is a string
	    	var value = this.result;
	    	if( typeof value === 'object' 
	    	 && typeof value.updateSequence === 'string' ){
				opts.onSuccess(value.updateSequence);
	    	} else if( typeof value === 'object' 
	    	 && typeof value.updateSequence === 'number' ){
				opts.onSuccess(''+value.updateSequence);
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
	
	_writeUpdateSequence: function(opts_){
		var opts = $n2.extend({
			dbName: null
			,updateSequence: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var db = this.db;
		
		if( typeof opts.dbName !== 'string' ){
			throw new Error('dbName must be a string');
		};
		if( typeof opts.updateSequence !== 'string' ){
			throw new Error('updateSequence must be a string');
		};

		var transaction = db.transaction(DB_STORE_INFO, 'readwrite');
	    var store = transaction.objectStore(DB_STORE_INFO);
	    var req = store.put({
	    	_id: opts.dbName+'|sequenceNumber'
	    	,updateSequence: opts.updateSequence
	    });
	    req.onsuccess = opts.onSuccess;
		req.onerror = function(evt) {
			opts.onError(this.error);
		};
	},
	
	_getNumberFromRevision: function(revision){
		var splits = revision.split('-');
		var number = 1 * splits[0];
		return number;
	},
	
	_mergeChanges: function(targetChange, change){
		if( typeof targetChange !== 'object' ){
			throw new Error('DocumentCache._mergeChanges() targetChange must be an object');
		};
		if( typeof change !== 'object' ){
			throw new Error('DocumentCache._mergeChanges() change must be an object');
		};
		if( typeof targetChange.id !== 'string' ){
			throw new Error('DocumentCache._mergeChanges() targetChange.id must be a string');
		};
		if( targetChange.id !== change.id ){
			throw new Error('DocumentCache._mergeChanges() targetChange.id and change.id must be the same');
		};
		if( typeof targetChange.rev !== 'string' ){
			throw new Error('DocumentCache._mergeChanges() targetChange.rev must be a string');
		};
		if( targetChange.rev !== change.rev ){
			throw new Error('DocumentCache._mergeChanges() targetChange.rev and change.rev must be the same');
		};
		
		// Deal with deleted
		if( targetChange.deleted ){
			// Nothing to do

		} else if( change.deleted ){
			targetChange.deleted = true;
			delete targetChange.doc;
			delete targetChange.attachments;

		} else {
			// Copy document content
			if( change.doc ){
				targetChange.doc = change.doc;
			};

			// Copy attachments
			if( change.attachments ){
				if( !targetChange.attachments ){
					targetChange.attachments = {};
				};
				
				for(var attName in change.attachments){
					targetChange.attachments[attName] = 
						change.attachments[attName];
				};
			};
		};
	}
});

//===================================================
var IndexedDbService = $n2.Class('IndexedDbService',{

	db: null,
	
	documentCache: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			db: null
			,dispatchService: null
		},opts_);
		
		this.db = opts.db;
		
		this.documentCache = new DocumentCache({
			db: this.db
			,dispatchService: opts.dispatchService
		});
	},

	getDocumentCache: function(){
		return this.documentCache;
	}
});

//===================================================
var DB_NAME = 'nunaliit';
var DB_VERSION = 4;
function openIndexedDb(opts_){
	var opts = $n2.extend({
		dispatchService: null
		,onSuccess: function(indexedDbService){}
		,onError: function(err){}
	},opts_);
	
	if( typeof indexedDB !== 'object' ){
		opts.onError( new Error('IndexedDB not available in this browser') );
	};

	var req = indexedDB.open(DB_NAME, DB_VERSION);
	req.onsuccess = function (evt) {
		// Better use "this" than "req" to get the result to avoid problems with
		// garbage collection.
		// db = req.result;
		var db = this.result;
		
		var indexedDbService = new IndexedDbService({
			db: db
			,dispatchService: opts.dispatchService
		});

		opts.onSuccess(indexedDbService);
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

		if( oldVersion < 1 ){ // docs store has existed since version 1
			db.createObjectStore(
				DB_STORE_DOCS
				,{ 
					keyPath: 'id' 
				}
			);
		} else if( oldVersion < 4 ){ // change in structure since version 4
			db.deleteObjectStore(DB_STORE_DOCS);
			db.createObjectStore(
				DB_STORE_DOCS
				,{ 
					keyPath: 'id' 
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