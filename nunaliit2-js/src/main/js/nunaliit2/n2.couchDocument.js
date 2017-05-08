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
;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
,DH = 'n2.couchDocument'
;

var g_dispatcher;

//*******************************************************
function adjustDocument(doc) {

	// Get user name
	var userName = null;
	if( g_dispatcher ){
		var isLoggedInMsg = {
			type: 'authIsLoggedIn'
		};
		g_dispatcher.synchronousCall(DH,isLoggedInMsg);
		
		var sessionContext = isLoggedInMsg.context;
		if( sessionContext ) {
			userName = sessionContext.name;
		};
	};
	
	// Get now
	var nowTime = (new Date()).getTime();
	
	if( userName ) {
		if( ! doc.nunaliit_created 
		 && ! doc._rev) {
			doc.nunaliit_created = {
				nunaliit_type: 'actionstamp'
				,name: userName
				,time: nowTime
				,action: 'created'
			};
		};
		
		doc.nunaliit_last_updated = {
			nunaliit_type: 'actionstamp'
			,name: userName
			,time: nowTime
			,action: 'updated'
		};
	};
	
	// Fix dates
	var dates = [];
	$n2.couchUtils.extractSpecificType(doc, 'date', dates);
	for(var i=0,e=dates.length; i<e; ++i){
		var d = dates[i];
		if( d.date ) {
			try {
				var dateInt = $n2.date.parseUserDate(d.date);
				d.min = dateInt.min;
				d.max = dateInt.max;
			} catch(e) {
				if( d.min ) delete d.min;
				if( d.max ) delete d.max;
			};
		};
	};
};

//*******************************************************
var Notifier = $n2.Class({

	dispatchService: null,
	
	documentSource: null,
	
	dbChangeNotifier: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			atlasDb: null
			,dispatchService: null
			,documentSource: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.documentSource = opts.documentSource;
		
		if( opts.atlasDb ){
			opts.atlasDb.getChangeNotifier({
				onSuccess: function(notifier){
					_this.dbChangeNotifier = notifier;
					if( _this.dbChangeNotifier ){
						_this.dbChangeNotifier.addListener(function(changes){
							_this._dbChanges(changes);
						});
					};
				}
			});
		};
	},

	_dbChanges: function(changes){
		var _this = this;
		
		$n2.log('update',changes);
		var lastSeq = changes.last_seq;
		var results = changes.results;
		
		if( this.dispatchService ){
			for(var i=0,e=results.length; i<e; ++i){
				var updateRecord = results[i];
	
				var isAdded = false;
				var latestRev = null;
	
				if(updateRecord.changes) {
					for(var l=0,k=updateRecord.changes.length; l<k; ++l){
						latestRev = updateRecord.changes[l].rev;
						if( latestRev.substr(0,2) === '1-' ) {
							isAdded = true;
						};
					};
				};
				
				if( latestRev ){
					// Send 'documentVersion' before create/update so
					// that caches can invalidate before document is
					// requested
					this.dispatchService.send(DH,{
						type: 'documentVersion'
						,docId: updateRecord.id
						,rev: latestRev
					});
				};
				
				if( updateRecord.deleted ){
					this.dispatchService.send(DH,{
						type: 'documentDeleted'
						,docId: updateRecord.id
					});
					
				} else if( isAdded ){
					this.dispatchService.send(DH,{
						type: 'documentCreated'
						,docId: updateRecord.id
					});

					this.documentSource.getDocument({
						docId: updateRecord.id
						,onSuccess: function(doc){
							_this._docUploaded(doc,true);
						}
					});
					
				} else {
					// Updated
					this.dispatchService.send(DH,{
						type: 'documentUpdated'
						,docId: updateRecord.id
					});

					this.documentSource.getDocument({
						docId: updateRecord.id
						,onSuccess: function(doc){
							_this._docUploaded(doc,false);
						}
					});
				};
			};
		};
	},
	
	_docUploaded: function(doc,created){
		if( this.dispatchService ){
			var type = created ? 'documentContentCreated' : 'documentContentUpdated';

			this.dispatchService.send(DH, {
				type: type
				,docId: doc._id
				,doc: doc
			});
		};
	}
});

// *******************************************************
var CouchDocumentSource = $n2.Class('CouchDocumentSource',$n2.document.DocumentSource, {
	
	db: null,
	
	designDoc: null,
	
	dispatchService: null,
	
	attachmentService: null,
	
	geometryRepository: null,
	
	isDefaultDocumentSource: null,
	
	notifier: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
				id: null
				,db: null
				,dispatchService: null
				,attachmentService: null
				,isDefaultDocumentSource: false
			}
			,opts_
		);
		
		var _this = this;
		
		$n2.document.DocumentSource.prototype.initialize.call(this,opts);

		this.db = opts.db;
		this.attachmentService = opts.attachmentService;
		this.dispatchService = opts.dispatchService;
		if( this.dispatchService ){
			// to make adjustDocument() work
			g_dispatcher = this.dispatchService;
		};
		this.isDefaultDocumentSource = opts.isDefaultDocumentSource;
		
		this.designDoc = this.db.getDesignDoc({ddName:'atlas'});
		
		this.geometryRepository = new GeometryRepository({
			db: this.db
			,designDoc: this.designDoc
			,dispatchService: this.dispatchService
		});
		
		if( this.dispatchService ){
			var f = function(m, addr, d){
				_this._handle(m, addr, d);
			};
			
			this.dispatchService.register(DH,'documentSourceFromDocument',f);
		};
		
		this.notifier = new Notifier({
			atlasDb: this.db
			,dispatchService: this.dispatchService
			,documentSource: this
		});
	},

	adoptDocument: function(doc){
		doc.__n2Source = this.getId();
	},

	createDocument: function(opts_){
		var opts = $n2.extend({
				doc: {}
				,onSuccess: function(doc){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		var _this = this;

		var doc = opts.doc;

		adjustDocument(doc);

		this.db.createDocument({
			data: doc
			,onSuccess: function(docInfo){
				doc._id = docInfo.id;
				doc._rev = docInfo.rev;
				
				_this.adoptDocument(doc);
				
				_this._dispatch({
					type: 'documentVersion'
					,docId: docInfo.id
					,rev: docInfo.rev
				});
				_this._dispatch({
					type: 'documentCreated'
					,docId: docInfo.id
				});
				_this._dispatch({
					type: 'documentContentCreated'
					,docId: doc._id
					,doc: doc
				});
				
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	},

	getDocument: function(opts_){
		var opts = $n2.extend({
				docId: null
				,rev: null
				,revs_info: false
				,revisions: false
				,conflicts: false
				,deleted_conflicts: false
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		var _this = this;
		
		this.db.getDocument({
			docId: opts.docId
			,rev: opts.rev
			,revs_info: opts.revs_info
			,revisions: opts.revisions
			,conflicts: opts.conflicts
			,deleted_conflicts: opts.deleted_conflicts
			,onSuccess: function(doc){
				_this.adoptDocument(doc);
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	},

	getDocuments: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,onSuccess: function(docs){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		var _this = this;
		
		this.db.getDocuments({
			docIds: opts.docIds
			,onSuccess: function(docs){
				for(var i=0,e=docs.length; i<e; ++i){
					var doc = docs[i];
					_this.adoptDocument(doc);
				};
				opts.onSuccess(docs);
			}
			,onError: opts.onError
		});
	},

	getDocumentAttachments: function(doc){
		return this.attachmentService.getAttachments(doc, this);
	},

	getDocumentAttachment: function(doc, attachmentName){
		return this.attachmentService.getAttachment(doc, attachmentName, this);
	},

	getDocumentAttachmentUrl: function(doc, attachmentName){
		return this.db.getAttachmentUrl(doc, attachmentName);
	},

	verifyDocumentExistence: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,onSuccess: function(info){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		var docIds = opts.docIds;
		
		this.db.getDocumentRevisions({
			docIds: docIds
			,onSuccess: function(info){
				var result = {};
				for(var id in info){
					result[id] = {
						rev: info[id]
					};
				};
				
				opts.onSuccess(result);
			}
			,onError: opts.onError
		});
	},

	updateDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,originalDoc: null // Optional. Needed in case of conflict
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		var _this = this;

		var doc = opts.doc;

		adjustDocument(doc);

		var copy = {};
		for(var key in doc){
			if( key === '__n2Source' ){
				// Do not copy
			} else {
				copy[key] = doc[key];
			};
		};
		
		this.db.updateDocument({
			data: copy
			,onSuccess: updateSuccess
			,onError: function(err){
				// Check if this is a conflict error. If so, attempt to deal with
				// the conflict if the caller provided an original document
				if( opts.originalDoc 
				 && $n2.error.checkErrorCondition(err, 'couchDb_conflict') ){
					loadConflictingDocument(true);
				} else {
					updateFailure(err);
				};
			}
		});
		
		function loadConflictingDocument(retryAllowed){
			_this.db.getDocument({
				docId: doc._id
				,skipCache: true
				,onSuccess: function(conflictingDoc) {
					patchConflictingDocument(conflictingDoc, retryAllowed);
				}
				,onError: function(cause){
					var err = $n2.error.fromString( 
						_loc('Unable to reload conflicting document')
						,cause
					);
					updateFailure(err);
				}
			});
		};
		
		function patchConflictingDocument(conflictingDoc, retryAllowed){
			var patch = patcher.computePatch(opts.originalDoc,doc);
			
			$n2.log('Conflict detected. Applying patch.',patch);
			
			// Apply patch to conflicting document
			patcher.applyPatch(conflictingDoc, patch);
			
			// If the patch contains changes to the geometry, then we must
			// erase the "simplified" structure in the geometry since
			// it needs to be recomputed by the server
			if( patch.nunaliit_geom 
			 && conflictingDoc.nunaliit_geom 
			 && conflictingDoc.nunaliit_geom.simplified ){
				delete conflictingDoc.nunaliit_geom.simplified;
			};

			// Attempt to update the patched document
			_this.db.updateDocument({
				data: conflictingDoc
				,onSuccess: updateSuccess
				,onError: function(err){
					if( retryAllowed 
					 && $n2.error.checkErrorCondition(err, 'couchDb_conflict') ){
						// We have two conflicts in a row. Assume we are sitting
						// behind a bad proxy server.
						$n2.couch.setBadProxy(true);
						$n2.debug.setBadProxy(true);

						$n2.log('Assuming that operations are behind a bad proxy');
						
						// Retry one last time
						loadConflictingDocument(false);
					} else {
						updateFailure(err);
					};
				}
			});
		};
		
		function updateSuccess(docInfo){
			doc._id = docInfo.id;
			doc._rev = docInfo.rev;
			
			_this.adoptDocument(doc);

			_this._dispatch({
				type: 'documentVersion'
				,docId: docInfo.id
				,rev: docInfo.rev
			});
			_this._dispatch({
				type: 'documentUpdated'
				,docId: docInfo.id
			});
			_this._dispatch({
				type: 'documentContentUpdated'
				,docId: doc._id
				,doc: doc
			});
			
			opts.onSuccess(doc);
		};
		
		function updateFailure(cause){
			var err = $n2.error.fromString(
				_loc('Error while updating document {id}',{id:doc._id})
				,cause
			);
			opts.onError(err);
		};
	},

	deleteDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		var _this = this;

		var doc = opts.doc;
		var copy = {};
		for(var key in doc){
			if( key === '__n2Source' ){
				// Do not copy
			} else {
				copy[key] = doc[key];
			};
		};
		
		this.db.deleteDocument({
			data: copy
			,onSuccess: documentDeleted
			,onError: function(err){
				// Check if this error is due to a database conflict
				if( $n2.error.checkErrorCondition(err, 'couchDb_conflict') ){
					$n2.log('Conflict document detected during deletion');
					reloadAndDelete(true);
				} else {
					deletionFailure(err);
				};
			}
		});
		
		function reloadAndDelete(retry){
			_this.db.getDocument({
				docId: doc._id
				,onSuccess: function(conflictingDoc) {
					// Delete latest revision
					_this.db.deleteDocument({
						data: conflictingDoc
						,onSuccess: documentDeleted
						,onError: function(err){
							if( retry 
							 && $n2.error.checkErrorCondition(err, 'couchDb_conflict') ){
								$n2.log('Conflict document detected during deletion');
								// We have two conflicts in a row. Assume we are sitting
								// behind a bad proxy server.
								$n2.couch.setBadProxy(true);
								$n2.debug.setBadProxy(true);

								$n2.log('Assuming that operations are behind a bad proxy');
								
								// Retry one last time
								reloadAndDelete(false);
							} else {
								deletionFailure(err);
							};
						}
					});
				}
				,onError: function(err2){
					var e = $n2.error.fromString(
						_loc('Error reloading conflicting document during deletion')
						,err2
					);
					opts.onError(e);
				}
			});
		};
		
		function documentDeleted(){
			_this._dispatch({
				type: 'documentDeleted'
				,docId: doc._id
			});
			opts.onSuccess();
		};
		
		function deletionFailure(err){
			var e = $n2.error.fromString(
				_loc('Unable to delete document {id}',{
					id: doc._id
				})
				,err
			);
			opts.onError(e);
		};
	},

	getLayerDefinitions: function(opts_){
		var opts = $n2.extend({
				layerIds: null
				,fullDocuments: false
				,onSuccess: function(layerDefinitions){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		var keys = undefined;
		if( opts.layerIds ){
			keys = [];
			opts.layerIds.forEach(function(layerId){
				keys.push(layerId);
			});
		};
		
		this.designDoc.queryView({
			viewName: 'layer-definitions'
			,include_docs: true
			,keys: keys
			,onSuccess: function(rows){
				var layerIdentifiers = [];
				for(var i=0,e=rows.length;i<e;++i){
					var doc = rows[i].doc;
					if( opts.fullDocuments ){
						layerIdentifiers.push(doc);
					} else if( doc.nunaliit_layer_definition ){
						var d = doc.nunaliit_layer_definition;
						if( !d.id ){
							d.id = doc._id;
						};
						layerIdentifiers.push(d);
					};
				};
				opts.onSuccess(layerIdentifiers);
			}
			,onError: opts.onError
		});
	},

	getDocumentInfoFromIds: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,onSuccess: function(docInfos){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		this.designDoc.queryView({
			viewName: 'info'
			,keys: opts.docIds
			,onSuccess: function(rows){
				var infos = [];
				for(var i=0,e=rows.length;i<e;++i){
					infos.push(rows[i].value);
				};
				opts.onSuccess(infos);
			}
			,onError: opts.onError
		});
	},

	getReferencesFromId: function(opts_){
		var opts = $n2.extend({
				docId: null
				,onSuccess: function(referenceIds){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		this.designDoc.queryView({
			viewName: 'link-references'
			,startkey: opts.docId
			,endkey: opts.docId
			,onSuccess: function(rows){
				var refIdMap = {};
				for(var i=0,e=rows.length;i<e;++i){
					refIdMap[rows[i].id] = true;
				};
				
				var refIds = [];
				for(var refId in refIdMap){
					refIds.push(refId);
				};
				opts.onSuccess(refIds);
			}
			,onError: opts.onError
		});
	},

	getProductFromId: function(opts_){
		var opts = $n2.extend({
				docId: null
				,onSuccess: function(referenceIds){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		this.designDoc.queryView({
			viewName: 'nunaliit-source'
			,startkey: opts.docId
			,endkey: opts.docId
			,onSuccess: function(rows){
				var refIdMap = {};
				for(var i=0,e=rows.length;i<e;++i){
					refIdMap[rows[i].id] = true;
				};
				
				var refIds = [];
				for(var refId in refIdMap){
					refIds.push(refId);
				};
				opts.onSuccess(refIds);
			}
			,onError: opts.onError
		});
	},

	getDocumentsFromGeographicFilter: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,layerId: null
			,bbox: null
			,projectionCode: null
			,onSuccess: function(docs){}
			,onError: function(errorMsg){}
		},opts_);
		
		var _this = this;
		
		// Intercept onSuccess to apply __n2Source attribute
		var callerSuccess = opts.onSuccess;
		opts.onSuccess = function(docs){
			for(var i=0,e=docs.length; i<e; ++i){
				_this.adoptDocument(doc);
			};
			callerSuccess(docs);
		};
		
		this.geometryRepository.getDocumentsFromGeographicFilter(opts);
	},

	getGeographicBoundingBox: function(opts_){
		this.geometryRepository.getGeographicBoundingBox(opts_);
	},

	getReferencesFromOrigin: function(opts_){
		var opts = $n2.extend({
				docId: null
				,onSuccess: function(originReferenceIds){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		this.designDoc.queryView({
			viewName: 'nunaliit-origin'
			,startkey: opts.docId
			,endkey: opts.docId
			,onSuccess: function(rows){
				var refIdMap = {};
				for(var i=0,e=rows.length;i<e;++i){
					refIdMap[rows[i].id] = true;
				};
				
				var refIds = [];
				for(var refId in refIdMap){
					refIds.push(refId);
				};
				opts.onSuccess(refIds);
			}
			,onError: opts.onError
		});
	},
	
	/*
	 * This needs to be a global unique identifier. It is not a sufficient
	 * guarantee if the identifier is unique within a session. Therefore, it
	 * should be based on the database which can track between sessions.
	 */
	getUniqueIdentifier: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(uuid){}
			,onError: function(errorMsg){}
		},opts_);
		
		var server = this.db.getServer();
		
		server.getUniqueId(opts);
	},
	
	_dispatch: function(m){
		if( this.dispatchService ){
			this.dispatchService.send(DH,m);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'documentSourceFromDocument' === m.type ){
			var doc = m.doc;
			if( doc && doc.__n2Source === this.getId() ){
				m.documentSource = this;
			} else if( doc 
			 && !doc.__n2Source 
			 && this.isDefaultDocumentSource ){
				m.documentSource = this;
			};
		};
	}
});

//*******************************************************

var GeometryRepository = $n2.Class('GeometryRepository',{
	
	db: null,
	
	designDoc: null,
	
	dispatchService: null,
	
	dbProjection: null,
	
	poles: null, // cache the poles in various projections
	
	mapProjectionMaxWidth: null, // cache max width computation
	
	initialize: function(opts_){
		var opts = $n2.extend({
			db: null
			,designDoc: null
			,dispatchService: null
		},opts_);
		
		this.db = opts.db;
		this.designDoc = opts.designDoc;
		this.dispatchService = opts.dispatchService;
		
		this.dbProjection = new OpenLayers.Projection('EPSG:4326');
		
		// Set-up caches
		this.poles = {
			n:{}
			,s:{}
		};
		this.mapProjectionMaxWidth = {};
	},
	
	getDocumentsFromGeographicFilter: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,layerId: null
				,bbox: null
				,projectionCode: null
				,onSuccess: function(docs){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
	
		var _this = this;
		
		var viewQuery = {
			viewName: 'geom'
			,onSuccess: handleDocs
			,onError: opts.onError
		};
		
		// Add BBOX tiling
		var bounds = opts.bbox;
		var fids = opts.docIds;
		var layerName = ('string' === typeof(opts.layerId) ? opts.layerId : null);
		
		if( bounds 
		 && opts.projectionCode 
		 && opts.projectionCode != this.dbProjection.getCode() ){
			var mapProjection = new OpenLayers.Projection(opts.projectionCode);
			
			var mapBounds = new OpenLayers.Bounds(bounds[0],bounds[1],bounds[2],bounds[3]);
			var dbBounds = mapBounds.clone().transform(mapProjection, this.dbProjection);
			
			// Verify if north pole is included
			var np = this._getPole(true, mapProjection);
			if( np 
			 && mapBounds.contains(np.x,np.y) ){
				var northBoundary = new OpenLayers.Bounds(-180, 90, 180, 90);
				dbBounds.extend(northBoundary);
			};
			
			// Verify if south pole is included
			var sp = this._getPole(false, mapProjection);
			if( sp 
			 && mapBounds.contains(sp.x,sp.y) ){
				var southBoundary = new OpenLayers.Bounds(-180, -90, 180, -90);
				dbBounds.extend(southBoundary);
			};
			
			bounds = [dbBounds.left,dbBounds.bottom,dbBounds.right,dbBounds.top];
			
			var maxWidth = this._getMapMaxWidth(mapProjection);
			if( maxWidth 
			 && maxWidth <= (mapBounds.right - mapBounds.left) ){
				// Assume maximum database bounds (do not wrap around)
				bounds[0] = -180;
				bounds[2] = 180;
			};
		};
	
		// Switch view name and add keys for bounds, layer name and feature ids
		$n2.couchGeom.selectTileViewFromBounds(viewQuery, bounds, layerName, fids);
		
		this.designDoc.queryView(viewQuery);
		
		function handleDocs(rows){

	    	var docIds = [];
	    	var docs = [];
	    	while( rows.length > 0 ){
	    		var row = rows.pop();
	    		var docId = row.id;
	    		
	    		if( _this.dispatchService ) {
	    			var m = {
	    				type: 'cacheRetrieveDocument'
	    				,docId: docId
	    				,doc: null
	    			};
	    			_this.dispatchService.synchronousCall(DH, m);
	    			if( m.doc ){
	    				docs.push(m.doc);
	    			} else {
	    				// must request
	    				docIds.push(docId);
	    			};
	    		} else {
	        		docIds.push(docId);
	    		};
	    	};
	    	
	    	if( docIds.length > 0 ) {

	        	_this.db.getDocuments({
	    			docIds: docIds
	    			,onSuccess: function(docs_){
	    				for(var i=0,e=docs_.length; i<e; ++i){
	    					docs.push(docs_[i]);
	    				};
	    				opts.onSuccess(docs);
	    			}
	        		,onError: opts.onError
	        	});
	    	} else {
	    		// nothing to request
	    		opts.onSuccess(docs);
	    	};
		};
	},

	getGeographicBoundingBox: function(opts_){
		var opts = $n2.extend({
				layerId: null
				,bbox: null
				,onSuccess: function(bbox){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		this.designDoc.queryView({
			viewName: 'geom-layer-bbox'
			,startkey: opts.layerId
			,endkey: opts.layerId
			,onlyRows: true
			,reduce: true
			,onSuccess: function(rows){
				if( rows.length > 0 ) {
					opts.onSuccess(rows[0].value);
				} else {
					opts.onSuccess(null);
				};
			}
			,onError: opts.onError
		});
	},

	_getPole: function(isNorth, mapProjection){
		
		var projCode = mapProjection.getCode();
		
		var label = isNorth ? 'n' : 's';
		if( this.poles[label][projCode] ) return this.poles[label][projCode];
		
		if( isNorth ){
			var p = new OpenLayers.Geometry.Point(0,90);
		} else {
			var p = new OpenLayers.Geometry.Point(0,-90);
		};
		
		// Catch transform errors
		var error = false;
		var previousFn = null;
		if( typeof(Proj4js) !== 'undefined' ){
			previousFn = Proj4js.reportError;
			Proj4js.reportError = function(m){
				error = true;
			};
		};
		
		p.transform(this.dbProjection,mapProjection);
		
		if( error ){
			p = null;
		};
		
		// Re-instate normal error reporting
		if( previousFn ){
			Proj4js.reportError = previousFn;
		};
		
		this.poles[label][projCode] = p;
		
		return p;
	},
	
    _getMapMaxWidth: function(proj){
		
		var projCode = proj.getCode();
    	
    	if( this.mapProjectionMaxWidth[projCode] ){
    		return this.mapProjectionMaxWidth[projCode];
    	};
    	
    	if( proj
    	 && proj.proj 
    	 && proj.proj.projName === 'merc' ){
        	var w = new OpenLayers.Geometry.Point(-180,0);
       		var e = new OpenLayers.Geometry.Point(180,0);

       		// Catch transform errors
        	var error = false;
        	var previousFn = null;
        	if( typeof(Proj4js) !== 'undefined' ){
        		previousFn = Proj4js.reportError;
        		Proj4js.reportError = function(m){
        			error = true;
        		};
        	};
        	
        	w.transform(this.dbProjection,proj);
        	e.transform(this.dbProjection,proj);
        	
        	if( error ){
        		w = null;
        		e = null;
        	};

        	// Re-instate normal error reporting
        	if( previousFn ){
        		Proj4js.reportError = previousFn;
        	};
        	
        	if( e && w ){
        		this.mapProjectionMaxWidth[projCode] = w.x - e.x;
        	};
    	};
    	
    	return this.mapProjectionMaxWidth[projCode];
    }
});

//*******************************************************
var CouchDocumentSourceWithSubmissionDb = $n2.Class('CouchDocumentSourceWithSubmissionDb', CouchDocumentSource, {
	
	submissionDb: null,
	
	submissionServerUrl: null,
	
	submissionServerDb: null,
	
	isSubmissionDataSource: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			submissionDb: null
			,submissionServletUrl: null
		},opts_);
		
		CouchDocumentSource.prototype.initialize.call(this,opts);

		var _this = this;
		
		this.isSubmissionDataSource = true;
		
		this.submissionDb = opts.submissionDb;
		this.submissionServerUrl = opts.submissionServerUrl;
		
		var submissionServer = $n2.couch.getServer({
			pathToServer: this.submissionServerUrl
			,skipSessionInitialization: true
			,userDbName: '_users'
			,onSuccess: function(server){
				_this.submissionServerDb = server.getDb({
					dbName: 'submissionDb'
				});
			}
			,onError: function(err){
				$n2.log("Unable to initialize submission server",err);
				alert( _loc('Unable to initialize submission database') );
			}
		});
		
	},
	
	/*
	 * When creating a document, send a submission request
	 */
	createDocument: function(opts_){
		var opts = $n2.extend({
				doc: {}
				,onSuccess: function(doc){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		var _this = this;
		
		if( !opts.doc ){
			opts.onError('Document must be provided');
		};

		// Compute document id
		if( opts.doc._id ){
			onUuidComputed(opts.doc._id);
		} else {
			var server = this.db.getServer();
			if( server ){
				server.getUniqueId({
					onSuccess: onUuidComputed
					,onError: opts.onError
				});
			} else {
				opts.onError('No server associated with database');
			};
		};
		
		function onUuidComputed(docId){
			// create a submission request
			var doc = opts.doc;
			doc._id = docId;
			
			adjustDocument(doc);

			_this.submissionServerDb.createDocument({
				data: doc
				,onSuccess: function(docInfo){
					_this._warnUser();
					_this.adoptDocument(doc);
					opts.onSuccess(doc);
				}
				,onError: opts.onError
			});
		};
	},

	/*
	 * When updating a document, make a submission request
	 */
	updateDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		var _this = this;
		
		var doc = opts.doc;
		
		adjustDocument(doc);
		
		var copy = {};
		for(var key in doc){
			if( key === '__n2Source' ){
				// Do not copy
			} else {
				copy[key] = doc[key];
			};
		};
		
		this.submissionServerDb.updateDocument({
			data: copy
			,onSuccess: function(docInfo){
				_this._warnUser();
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	},

	/*
	 * When deleting a document, make a submission request
	 */
	deleteDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		var _this = this;
		
		var doc = opts.doc;
		
		this.submissionServerDb.deleteDocument({
			data: doc
			,onSuccess: function(docInfo){
				_this._warnUser();
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	},
	
	_warnUser: function(){
		var shouldWarnUser = true;
		var c = $n2.cookie.getCookie('nunaliit_submissions');
		if( c ){
			shouldWarnUser = false;
		};
		
		if( shouldWarnUser ){
			var diagId = $n2.getUniqueId();
			var $diag = $('<div>')
				.attr('id',diagId)
				.addClass('n2_submission_warning_dialog');

			var $text = $('<div>')
				.addClass('n2_submission_warning_text')
				.appendTo($diag);
			
			$('<span>')
				.text( _loc('Submissions to the database will not appear until they are approved') )
				.appendTo($diag);
			
			var $mem = $('<div>')
				.addClass('n2_submission_warning_memory')
				.appendTo($diag);
			
			
			var cbId = $n2.getUniqueId();
			$('<input type="checkbox">')
				.attr('id', cbId)
				.appendTo($mem);

			$('<label>')
				.attr('for', cbId)
				.text( _loc('Do not show this warning again') )
				.appendTo($mem);
			
			var $buttons = $('<div>')
				.addClass('n2_submission_warning_buttons')
				.appendTo($diag);
			
			$('<button>')
				.addClass('n2_button_ok')
				.appendTo($buttons)
				.text( _loc('OK') )
				.click(function(){
					var $diag = $('#'+diagId);
					$diag.dialog('close');
				});
			
			$diag.dialog({
				autoOpen: true
				,title: _loc('Warning on Database Submissions')
				,modal: true
				,width: 'auto'
				,close: function(event, ui){
					var $diag = $('#'+diagId);
					
					var $cb = $diag.find('input[type=checkbox]');
					var disable = false;
					if( $cb.length > 0 ){
						disable = $cb.is(':checked')
					};
					
					$diag.remove();
					
					if( disable ){
						$n2.cookie.setCookie({
							name: 'nunaliit_submissions'
							,value: 'do not warn'
							,end: (60 * 60 * 24 * 365) // max-age in seconds
							,path: '/'
						});
					};
				}
			});
		};
	}
});

//*******************************************************
$n2.couchDocument = {
	CouchDocumentSource: CouchDocumentSource
	,CouchDocumentSourceWithSubmissionDb: CouchDocumentSourceWithSubmissionDb
	,adjustDocument: adjustDocument
};

})(jQuery,nunaliit2);
