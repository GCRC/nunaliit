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

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'n2.couchDocument';


// *******************************************************
var CouchDataSource = $n2.Class($n2.document.DataSource, {
	
	db: null
	
	,designDoc: null
	
	,dispatchService: null
	
	,geometryRepository: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
				id: null
				,db: null
				,dispatchService: null
			}
			,opts_
		);
		
		$n2.document.DataSource.prototype.initialize.call(this,opts);

		this.db = opts.db;
		this.dispatchService = opts.dispatchService;
		
		this.designDoc = this.db.getDesignDoc({ddName:'atlas'});
		
		this.geometryRepository = new GeometryRepository({
			db: this.db
			,designDoc: this.designDoc
			,dispatchService: this.dispatchService
		});
	}

	,createDocument: function(opts_){
		var opts = $n2.extend({
				doc: {}
				,onSuccess: function(doc){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		var _this = this;

		var doc = opts.doc;

		this._adjustDocument(doc);

		this.db.createDocument({
			data: doc
			,onSuccess: function(docInfo){
				doc._id = docInfo.id;
				doc._rev = docInfo.rev;
				doc.__n2Source = this;
				
				_this._dispatch({
					type: 'documentVersion'
					,docId: docInfo.id
					,rev: docInfo.rev
				});
				_this._dispatch({
					type: 'documentCreated'
					,docId: docInfo.id
				});
				
				
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	}

	,getDocument: function(opts_){
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
		
		this.db.getDocument({
			docId: opts.docId
			,rev: opts.rev
			,revs_info: opts.revs_info
			,revisions: opts.revisions
			,conflicts: opts.conflicts
			,deleted_conflicts: opts.deleted_conflicts
			,onSuccess: function(doc){
				doc.__n2Source = this;
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	}

	,verifyDocumentExistence: function(opts_){
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
	}

	,updateDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		var _this = this;

		var doc = opts.doc;

		this._adjustDocument(doc);

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
			,onSuccess: function(docInfo){
				doc._rev = docInfo.rev;

				_this._dispatch({
					type: 'documentVersion'
					,docId: docInfo.id
					,rev: docInfo.rev
				});
				_this._dispatch({
					type: 'documentUpdated'
					,docId: docInfo.id
				});
				
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	}

	,deleteDocument: function(opts_){
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
			,onSuccess: function(docInfo){
				_this._dispatch({
					type: 'documentDeleted'
					,docId: doc._id
				});
				opts.onSuccess();
			}
			,onError: opts.onError
		});
	}

	,getLayerDefinitions: function(opts_){
		var opts = $n2.extend({
				onSuccess: function(layerDefinitions){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		this.designDoc.queryView({
			viewName: 'layer-definitions'
			,onSuccess: function(rows){
				var layerIdentifiers = [];
				for(var i=0,e=rows.length;i<e;++i){
					if( rows[i].nunaliit_layer_definition ){
						var d = rows[i].nunaliit_layer_definition;
						if( !d.id ){
							d.id = rows[i]._id;
						};
						layerIdentifiers.push(d);
					};
				};
				opts.onSuccess(layerIdentifiers);
			}
			,onError: opts.onError
		});
	}

	,getDocumentInfoFromIds: function(opts_){
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
	}

	,getReferencesFromId: function(opts_){
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
	}

	,getDocumentsFromGeographicFilter: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,layerId: null
			,bbox: null
			,projectionCode: null
			,onSuccess: function(docs){}
			,onError: function(errorMsg){}
		},opts_);
		
		// Intercept onSuccess to apply __n2Source attribute
		var callerSuccess = opts.onSuccess;
		opts.onSuccess = function(docs){
			for(var i=0,e=docs.length; i<e; ++i){
				docs[i].__n2Source = this;
			};
			callerSuccess(docs);
		};
		
		this.geometryRepository.getDocumentsFromGeographicFilter(opts);
	}

	,getGeographicBoundingBox: function(opts_){
		this.geometryRepository.getGeographicBoundingBox(opts_);
	}

	,_adjustDocument: function(doc) {

		// Get user name
		var userName = null;
		var sessionContext = $n2.couch.getSession().getContext();
		if( sessionContext ) {
			userName = sessionContext.name;
		};
		
		// Get now
		var nowTime = (new Date()).getTime();
		
		if( userName ) {
			if( null == doc.nunaliit_created ) {
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
	}
	
	,_dispatch: function(m){
		if( this.dispatchService ){
			this.dispatchService.send(DH,m);
		};
	}
});

//*******************************************************

var GeometryRepository = $n2.Class({
	
	db: null
	
	,designDoc: null
	
	,dispatchService: null
	
	,dbProjection: null
	
	,poles: null // cache the poles in various projections
	
	,mapProjectionMaxWidth: null // cache max width computation
	
	,initialize: function(opts_){
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
	}
	
	,getDocumentsFromGeographicFilter: function(opts_){
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
	}

	,getGeographicBoundingBox: function(opts_){
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
	}

	,_getPole: function(isNorth, mapProjection){
		
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
	}
	
    ,_getMapMaxWidth: function(proj){
		
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
var CouchDataSourceWithSubmissionDb = $n2.Class(CouchDataSource, {
	
	submissionDb: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			submissionDb: null
		},opts_);
		
		CouchDataSource.prototype.initialize.call(this,opts);

		this.submissionDb = opts.submissionDb;
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
			var server = this.db.server;
			if( server ){
				server.getUniqueId({
					onSuccess: onUuidComputed
					,onError: opts.onError
				});
			};
		};
		
		function onUuidComputed(docId){
			// create a submission request
			var doc = opts.doc;
			doc._id = docId;
			
			_this._adjustDocument(doc);

			var copy = {};
			var reserved = {};
			for(var key in doc){
				if( key === '__n2Source' ){
					// Do not copy
					
				} else if ( key.length > 0 && key[0] === '_' ) {
					var reservedKey = key.substr(1);
					reserved[reservedKey] = doc[key];
					
				} else {
					copy[key] = doc[key];
				};
			};
			
			var request = {
				nunaliit_type: 'document_submission'
				,nunaliit_submission: {
					state: 'submitted'
					,original_reserved: {
						id: docId
					}
					,submitted_doc: copy
					,submitted_reserved: reserved
				}
			};

			_this._adjustDocument(request);
			
			_this.submissionDb.createDocument({
				data: request
				,onSuccess: function(docInfo){
					doc.__n2Source = this;
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
		
		var doc = opts.doc;
		
		this._adjustDocument(doc);
		
		var copy = {};
		var reserved = {};
		for(var key in doc){
			if( key === '__n2Source' ){
				// Do not copy
				
			} else if ( key.length > 0 && key[0] === '_' ) {
				var reservedKey = key.substr(1);
				reserved[reservedKey] = doc[key];
				
			} else {
				copy[key] = doc[key];
			};
		};

		// create a submission request
		var request = {
			nunaliit_type: 'document_submission'
			,nunaliit_submission: {
				state: 'submitted'
				,original_reserved: {
					id: doc._id
					,rev: doc._rev
				}
				,submitted_doc: copy
				,submitted_reserved: reserved
			}
		};

		this._adjustDocument(request);
		
		this.submissionDb.createDocument({
			data: request
			,onSuccess: function(docInfo){
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
		
		var doc = opts.doc;
		
		var copy = {};
		var reserved = {};
		for(var key in doc){
			if( key === '__n2Source' ){
				// Do not copy
				
			} else if ( key.length > 0 && key[0] === '_' ) {
				var reservedKey = key.substr(1);
				reserved[reservedKey] = doc[key];
				
			} else {
				copy[key] = doc[key];
			};
		};

		// create a submission request
		var request = {
			nunaliit_type: 'document_submission'
			,nunaliit_submission: {
				state: 'submitted'
				,original_reserved: {
					id: doc._id
					,rev: doc._rev
				}
				,deletion: true
				,submitted_doc: copy
				,submitted_reserved: reserved
			}
		};

		this._adjustDocument(request);

		this.submissionDb.createDocument({
			data: request
			,onSuccess: function(docInfo){
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	}
});

//*******************************************************
$n2.couchDocument = {
	CouchDataSource: CouchDataSource
	,CouchDataSourceWithSubmissionDb: CouchDataSourceWithSubmissionDb
};

})(jQuery,nunaliit2);
