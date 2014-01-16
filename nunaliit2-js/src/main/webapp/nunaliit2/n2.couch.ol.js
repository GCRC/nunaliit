

/**
 * @ requires OpenLayers/Protocol.js
 * @ requires OpenLayers/Feature/Vector.js
 * @ requires OpenLayers/Filter/Spatial.js
 * @ requires OpenLayers/Filter/Comparison.js
 * @ requires OpenLayers/Filter/Logical.js
 * @ requires OpenLayers/Format.js
 */

;(function($,$n2){

// If OpenLayers is not included, do not process further
if( typeof(OpenLayers) === 'undefined' ) return;

/**
 * Class: OpenLayers.Format.Couch
 * A parser to read/write CouchDb documents.  Create a new instance with the
 *     <OpenLayers.Format.Couch> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format>
 */
OpenLayers.Format.Couch = OpenLayers.Class(OpenLayers.Format, {
    
    /**
     * Constructor: OpenLayers.Format.Couch
     * Create a new parser for JSON.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: read
     * Accepts a CouchDb response and returns an array of features.
     *
     * Parameters:
     * response - {Array} CouchDb documents
     *     
     * Returns:
     * {Object} An object, array, string, or number .
     */
    read: function(docs) {

        try {
        	var results = [];
			for(var i=0,e=docs.length; i<e; ++i) {
				var doc = docs[i];
				
				var id = null;
				var geom = null;
				
				if( doc._id ) {
					id = doc._id;
				};
				
				if( doc.nunaliit_geom.wkt ) {
					geom = OpenLayers.Geometry.fromWKT(doc.nunaliit_geom.wkt);
					
					if( geom ){
						if( !$n2.olUtils.isValidGeom(geom) ) {
							geom = null;
						};
					};

					if( !geom ){
						$n2.log('Invalid WKT('+doc._id+'): '+doc.nunaliit_geom.wkt);
					};
				};
				
				if( id && geom ) {
					var f = new OpenLayers.Feature.Vector(geom,doc);
					f.fid = id;
					results.push(f);
				} else {
					$n2.log('Invalid feature',doc);
				};
			};
			
			return results;
        } catch(e) {
            $n2.log('Error during CouchDB format read',e);
        }
        return null;
    },

    /**
     * APIMethod: write
     * Serialize an object.
     *
     * Parameters:
     * features - {Array} Features to be serialized.
     *
     * Returns:
     * {Array} Documents to be sent to CouchDb.
     */
    write: function(features) {
    	var result = [];
    	
        for(var i=0,e=features.length; i<e; ++i) {
        	var f = features[i];
        	
        	var data = f.data;
        	if( null == data ) {
        		data = {};
        	};
        	
        	// Add FID
        	if( f.fid ) {
        		data._id = f.fid;
        	};
        	
        	// Update geometry
        	var geom = f.geometry;
        	if( f.layer.projection 
        	 && f.layer.map.projection
        	 && f.layer.projection.getCode() != f.layer.map.projection.getCode() ) {
        	 	geom = geom.clone();
        	 	geom.transform(f.layer.map.projection, f.layer.projection);
        	};
        	if( !data.nunaliit_geom ) data.nunaliit_geom = { nunaliit_type: 'geometry' };
        	data.nunaliit_geom.wkt = geom.toString();
        	var bbox = geom.getBounds();
        	data.nunaliit_geom.bbox = [bbox.left,bbox.bottom,bbox.right,bbox.top];
        	
        	result.push( data );
        };
        
        return result;
    },

    CLASS_NAME: "OpenLayers.Format.Couch" 

});     


/**
 * Class: OpenLayers.Protocol.Couch
 * A basic protocol for accessing vector layers from couchDb.  Create a new instance with the
 *     <OpenLayers.Protocol.Couch> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Protocol>
 */
OpenLayers.Protocol.Couch = OpenLayers.Class(OpenLayers.Protocol, {

    /**
     * Property: db
     * {Object} Instance of database to access feature documents
     */
    db: null,

    /**
     * Property: designDoc
     * {Object} Instance of design doc to access named view.
     */
    designDoc: null,

    /**
     * Property: viewName
     * {String} Name of couchDb view, including design url.
     */
    viewName: null,

    /**
     * Property: layerName
     * {String} Name of layer associated with seeked features. Null if all geometries
     * are to be accepted.
     */
    layerName: null,

    /**
     * Property: callback
     * {Object} Function to be called when the <read>, <create>,
     *     <update>, <delete> or <commit> operation completes, read-only,
     *     set through the options passed to the constructor.
     */
    callback: null,

    /**
     * Property: scope
     * {Object} Callback execution scope, read-only, set through the
     *     options passed to the constructor.
     */
    scope: null,

    /**
     * Property: cache
     * {Object} Cache to retrieve documents.
     */
    cache: null,

    /**
     * Property: notifications
     * {Object} Set of functions to call to report on bubsy status
     */
    notifications: null,

    /**
     * Property: wildcarded.
     * {Boolean} If true percent signs are added around values
     *     read from LIKE filters, for example if the protocol
     *     read method is passed a LIKE filter whose property
     *     is "foo" and whose value is "bar" the string
     *     "foo__ilike=%bar%" will be sent in the query string;
     *     defaults to false.
     */
    wildcarded: false,
    
    /**
     * Property: sourceProjection.
     * {Projection} Projection of the map. This the projection in which bounds
     * are specified.
     */
    sourceProjection: null,
    
    /**
     * Property: dbProjection.
     * {Projection} Projection used to store information in the database.
     */
    dbProjection: null,
    
    /*
     * Cache for north and south poles for the map projection
     */
    poles: null,
    
    /*
     * Cache for maximum extent in map projection
     */
    sourceProjectionMaxWidth: null,

    /**
     * Constructor: OpenLayers.Protocol.Couch
     * A class for giving layers generic HTTP protocol.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     *
     * Valid options include:
     * view - {String} Name of couchDb view, including design url.
     * format - {<OpenLayers.Format>}
     * callback - {Function}
     * scope - {Object}
     */
    initialize: function(options) {
        options = options || {};
        
        // Install default format
        if( !options.format ) {
        	options.format = new OpenLayers.Format.Couch();
        };
        
        if( !options.dbProjection ){
        	options.dbProjection = new OpenLayers.Projection('EPSG:4326');
        };
        
        OpenLayers.Protocol.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * APIMethod: destroy
     * Clean up the protocol.
     */
    destroy: function() {
        OpenLayers.Protocol.prototype.destroy.apply(this);
    },
   
    /**
     * APIMethod: read
     * Construct a request for reading new features.
     *
     * Parameters:
     * options - {Object} Optional object for configuring the request.
     *     This object is modified and should not be reused.
     *
     * Valid options:
     * view - {String} Name of couchDb view, including design url.
     * filter - {<OpenLayers.Filter>} Filter to get serialized as a
     *     query string.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} A response object, whose "priv" property
     *     references the HTTP request, this object is also passed to the
     *     callback function when the request completes, its "features" property
     *     is then populated with the the features received from the server.
     */
    read: function(options) {
    	var tt = { // Time Tracker
    		init: (new Date()).getTime()
    	};
    	if( this.notifications && this.notifications.readStart ){
    		this.notifications.readStart();
    	};
    	
        OpenLayers.Protocol.prototype.read.apply(this, arguments);
        options = OpenLayers.Util.applyDefaults(options, this.options);
        var resp = new OpenLayers.Protocol.Response({requestType: 'read'});
		var _this = this;
		var viewQuery = {
			viewName: options.viewName
			,onSuccess: function(rows){
				_this.handleReadGeomFids(resp, options, rows, tt);
			}
			,onError: function(errorMsg){ 
				$n2.log(errorMsg); 
            	if( _this.notifications && _this.notifications.readEnd ){
            		_this.notifications.readEnd();
            	};
			}
		};
		
		// Add BBOX tiling
		var bounds = this.getBboxFromFilter(options.filter);
		var fids = this.getFidsFromFilter(options.filter);
		var layerName = ('string' === typeof(options.layerName) ? options.layerName : null);
		
		if( bounds 
		 && this.sourceProjection 
		 && this.sourceProjection.getCode() != 'EPSG:4326' ){
			var mapBounds = new OpenLayers.Bounds(bounds[0],bounds[1],bounds[2],bounds[3]);
			var dbBounds = mapBounds.clone().transform(this.sourceProjection, this.dbProjection);
			
			// Verify if north pole is included
			var np = this._getPole(true);
			if( np 
			 && mapBounds.contains(np.x,np.y) ){
				var northBoundary = new OpenLayers.Bounds(-180, 90, 180, 90);
				dbBounds.extend(northBoundary);
			};
			
			// Verify if south pole is included
			var sp = this._getPole(false);
			if( sp 
			 && mapBounds.contains(sp.x,sp.y) ){
				var southBoundary = new OpenLayers.Bounds(-180, -90, 180, -90);
				dbBounds.extend(southBoundary);
			};
			
			bounds = [dbBounds.left,dbBounds.bottom,dbBounds.right,dbBounds.top];
			
			var maxWidth = this._getMapMaxWidth();
			if( maxWidth 
			 && maxWidth <= (mapBounds.right - mapBounds.left) ){
				// Assume maximum database bounds (do not wrap around)
				bounds[0] = -180;
				bounds[2] = 180;
			};
		};

		// Switch view name and add keys for bounds, layer name and feature ids
		$n2.couchGeom.selectTileViewFomBounds(viewQuery, bounds, layerName, fids);
		
    	tt.queryFidsStart = (new Date()).getTime();
		options.designDoc.queryView(viewQuery);

        return resp;
    },
    
    handleReadGeomFids: function(resp, options, rows, tt) {
    	var _this = this;
    	
    	tt.queryFidsEnd = (new Date()).getTime();
    	tt.queryFidsCount = rows.length;

    	var docIds = [];
    	var docs = [];
    	while( rows.length > 0 ){
    		var row = rows.pop();
    		var docId = row.id;
    		
    		if( this.cache ) {
    			var doc = this.cache.retrieve(docId);
    			if( doc ) {
    				docs.push(doc);
    			} else {
    				// must request
    				docIds.push(docId);
    			};
    		} else {
        		docIds.push(docId);
    		};
    	};
    	
    	tt.queryDocsCount = 0;
    	if( docIds.length > 0 ) {
	    	tt.queryDocsStart = (new Date()).getTime();

        	this.db.getDocuments({
    			docIds: docIds
    			,onSuccess: function(docs_){
    		    	tt.queryDocsEnd = (new Date()).getTime();
    		    	tt.queryDocsCount = docs_.length;
    				for(var i=0,e=docs_.length; i<e; ++i){
    					docs.push(docs_[i]);
    				};
    				_this.handleRead(resp, options, docs, tt);
    			}
        		,onError: function(errorMsg){ 
        			$n2.log(errorMsg); 
                	if( _this.notifications && _this.notifications.readEnd ){
                		_this.notifications.readEnd();
                	};
        		}
        	});
    	} else {
    		// nothing to request
    		this.handleRead(resp, options, docs, tt);
    	};
    },

    /**
     * Method: handleRead
     * Individual callbacks are created for read, create and update, should
     *     a subclass need to override each one separately.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     the user callback.
     * options - {Object} The user options passed to the read call.
     */
    handleRead: function(resp, options, docs, tt) {
    	
    	var _this = this;

        if(options.callback) {
	    	tt.read = (new Date()).getTime();
            resp.features = this.format.read(docs);

            if( this.sourceProjection 
             && this.dbProjection 
    		 && this.sourceProjection.getCode() !== this.dbProjection.getCode() ){
            	for(var i=0,e=resp.features.length; i<e; ++i){
            		resp.features[i].geometry.transform(this.dbProjection, this.sourceProjection);
            	};
            };

            // Sorting now saves on rendering a re-sorting later
	    	tt.sort = (new Date()).getTime();
	    	$n2.olUtils.sortFeatures(resp.features);

	    	tt.cb = (new Date()).getTime();
            resp.code = OpenLayers.Protocol.Response.SUCCESS;
            options.callback.call(options.scope, resp);
            
            window.setTimeout(function(){
            	tt.end = (new Date()).getTime();
            	var renderMs = tt.end - tt.cb;
            	var sortMs = tt.cb - tt.sort;
            	var readMs = tt.sort-tt.read;
            	var docsMs = 0;
            	if( tt.queryDocsEnd && tt.queryDocsStart ) {
            		docsMs = tt.queryDocsEnd - tt.queryDocsStart;
            	};
            	var fidsMs = tt.queryFidsEnd - tt.queryFidsStart;
            	var initMs = tt.queryFidsStart - tt.init;
            	var totalMs = tt.end - tt.init;
            	$n2.log('init:'+initMs+'ms fids('+tt.queryFidsCount+'):'+fidsMs
            		+'ms docs('+tt.queryDocsCount+'):'+docsMs+'ms format:'+readMs
            		+'ms sort:'+sortMs+'ms render('+resp.features.length+'):'+renderMs
            		+'ms total:'+totalMs+'ms');
            	
            	if( _this.notifications && _this.notifications.readEnd ){
            		_this.notifications.readEnd();
            	};

            },0);
        };
    },

    /**
     * APIMethod: create
     * Construct a request for writing newly created features.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *     {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *     This object is modified and should not be reused.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *     object, whose "priv" property references the HTTP request, this 
     *     object is also passed to the callback function when the request
     *     completes, its "features" property is then populated with the
     *     the features received from the server.
     */
    create: function(features, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options);
        
        var documents = this.format.write(features);
        
        // Apply layer name, if needed
        if( options.layerName ) {
        	for(var i=0,e=documents.length; i<e; ++i) {
        		var doc = documents[i];
        		if( !doc.nunaliit_layers ) {
        			doc.nunaliit_layers = [];
        		};
        		if( jQuery.inArray(options.layerName, doc.nunaliit_layers) < 0 ) {
        			doc.nunaliit_layers.push(options.layerName);
        		};
        	};
        };

        var resp = new OpenLayers.Protocol.Response({
            reqFeatures: features,
            requestType: "create"
        });
        
		var _this = this;
        this.db.bulkDocuments(documents,{
        	onSuccess: function(docIds){
				_this.handleCreate(resp, options, docIds);        		
        	}
			,onError: function(errorMsg){ $n2.reportError(errorMsg); }
        });

        return resp;
    },

    /**
     * Method: handleCreate
     * Called when the request issued by <create> is complete.  May be overridden
     *     by subclasses.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     any user callback.
     * options - {Object} The user options passed to the create call.
     */
    handleCreate: function(resp, options, docIds) {
    	
    	// Update features with FIDs and _rev
        var features = resp.reqFeatures;
        var insertedFeatures = [];
        if( features.length != docIds.length ) {
        	// There is an error
        	$n2.reportError($n2.ERROR_NO_SUPRESS, 'Invalid feature bulk create');
        } else {
        	for(var i=0,e=docIds.length; i<e; ++i) {
        		var f = features[i];
        		var d = docIds[i];
        		
        		if( d.error ) {
        			if( d.reason ) {
        				$n2.reportError($n2.ERROR_NO_SUPRESS, d.error+' : '+d.reason);
        			} else {
        				$n2.reportError($n2.ERROR_NO_SUPRESS, d.error);
        			};
        		} else {
	        		f.fid = d.id;
	        		if( f.data ) {
		        		f.data._id = d.id;
		        		f.data._rev = d.rev;
	        		};
	        		if( f.attribute ) {
		        		f.attribute._id = d.id;
		        		f.attribute._rev = d.rev;
	        		};
	        		insertedFeatures.push(f);
        		};
        	};
        };
        
        // Perform call back, if needed
        if(options.callback && insertedFeatures.length > 0) {
        	resp.features = insertedFeatures;
        	
            resp.code = OpenLayers.Protocol.Response.SUCCESS;
            options.callback.call(options.scope, resp);
        }
    },

    /**
     * APIMethod: update
     * Construct a request updating modified feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *     This object is modified and should not be reused.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *     object, whose "priv" property references the HTTP request, this 
     *     object is also passed to the callback function when the request
     *     completes, its "features" property is then populated with the
     *     the feature received from the server.
     */
    update: function(feature, options) {
        options = options || {};
        options = OpenLayers.Util.applyDefaults(options, this.options);

		var documents = this.format.write([feature]);

        var resp = new OpenLayers.Protocol.Response({
            reqFeatures: feature,
            requestType: "update"
        });
        
		var _this = this;
        this.db.updateDocument({
        	data: documents[0]
        	,onSuccess: function(docInfo){
				_this.handleUpdate(resp, options, docInfo);        		
        	}
			,onError: function(errorMsg){ $n2.reportError(errorMsg); }
        });

        return resp;
    },

    /**
     * Method: handleUpdate
     * Called the the request issued by <update> is complete.  May be overridden
     *     by subclasses.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     any user callback.
     * options - {Object} The user options passed to the update call.
     */
    handleUpdate: function(resp, options, docInfo) {
    	
    	// Update feature with _rev
        var feature = resp.reqFeatures;
        if( feature.data ) {
        	feature.data._rev = docInfo.rev;
        };
        if( feature.attribute ) {
        	feature.attribute._rev = docInfo.rev;
        };
        
        // Perform call back, if needed
        if(options.callback) {
        	resp.features = [feature];
        	
            resp.code = OpenLayers.Protocol.Response.SUCCESS;
            options.callback.call(options.scope, resp);
        }
    },

    /**
     * APIMethod: delete
     * Construct a request deleting a removed feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *     This object is modified and should not be reused.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *     object, whose "priv" property references the HTTP request, this 
     *     object is also passed to the callback function when the request
     *     completes.
     */
    "delete": function(feature, options) {
        options = options || {};
        options = OpenLayers.Util.applyDefaults(options, this.options);

        var resp = new OpenLayers.Protocol.Response({
            reqFeatures: feature,
            requestType: "delete"
        });
        
		var _this = this;
        this.db.deleteDocument({
        	data: feature.data
        	,onSuccess: function(docInfo){
				_this.handleDelete(resp, options, docInfo);        		
        	}
			,onError: function(errorMsg){ $n2.reportError(errorMsg); }
        });

        return resp;
    },

    /**
     * Method: handleDelete
     * Called the the request issued by <delete> is complete.  May be overridden
     *     by subclasses.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     any user callback.
     * options - {Object} The user options passed to the delete call.
     */
    handleDelete: function(resp, options) {

        // Perform call back, if needed
        if(options.callback) {
            resp.code = OpenLayers.Protocol.Response.SUCCESS;
            options.callback.call(options.scope, resp);
        }
    },

    /**
     * APIMethod: commit
     * Iterate over each feature and take action based on the feature state.
     *     Possible actions are create, update and delete.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})}
     * options - {Object} Optional object for setting up intermediate commit
     *     callbacks.
     *
     * Valid options:
     * create - {Object} Optional object to be passed to the <create> method.
     * update - {Object} Optional object to be passed to the <update> method.
     * delete - {Object} Optional object to be passed to the <delete> method.
     * callback - {Function} Optional function to be called when the commit
     *     is complete.
     * scope - {Object} Optional object to be set as the scope of the callback.
     *
     * Returns:
     * {Array(<OpenLayers.Protocol.Response>)} An array of response objects,
     *     one per request made to the server, each object's "priv" property
     *     references the corresponding HTTP request.
     */
    commit: function(features, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options);
        var resp = [], nResponses = 0;
        
        // Divide up features before issuing any requests.  This properly
        // counts requests in the event that any responses come in before
        // all requests have been issued.
        var types = {};
        types[OpenLayers.State.INSERT] = [];
        types[OpenLayers.State.UPDATE] = [];
        types[OpenLayers.State.DELETE] = [];
        var feature, list, requestFeatures = [];
        for(var i=0, len=features.length; i<len; ++i) {
            feature = features[i];
            list = types[feature.state];
            if(list) {
                list.push(feature);
                requestFeatures.push(feature); 
            }
        }
        // tally up number of requests
        var nRequests = (types[OpenLayers.State.INSERT].length > 0 ? 1 : 0) +
            types[OpenLayers.State.UPDATE].length +
            types[OpenLayers.State.DELETE].length;
        
        // This response will be sent to the final callback after all the others
        // have been fired.
        var success = true;
        var finalResponse = new OpenLayers.Protocol.Response({
            reqFeatures: requestFeatures        
        });
        
        function insertCallback(response) {
            var len = response.features ? response.features.length : 0;
            var fids = new Array(len);
            for(var i=0; i<len; ++i) {
                fids[i] = response.features[i].fid;
            }   
            finalResponse.insertIds = fids;
            callback.apply(this, [response]);
        }
 
        function callback(response) {
            this.callUserCallback(response, options);
            success = success && response.success();
            nResponses++;
            if (nResponses >= nRequests) {
                if (options.callback) {
                    finalResponse.code = success ? 
                        OpenLayers.Protocol.Response.SUCCESS :
                        OpenLayers.Protocol.Response.FAILURE;
                    options.callback.apply(options.scope, [finalResponse]);
                }    
            }
        }

        // start issuing requests
        var queue = types[OpenLayers.State.INSERT];
        if(queue.length > 0) {
            resp.push(this.create(
                queue, OpenLayers.Util.applyDefaults(
                    {callback: insertCallback, scope: this}, options.create
                )
            ));
        }
        queue = types[OpenLayers.State.UPDATE];
        for(var i=queue.length-1; i>=0; --i) {
            resp.push(this.update(
                queue[i], OpenLayers.Util.applyDefaults(
                    {callback: callback, scope: this}, options.update
                ))
            );
        }
        queue = types[OpenLayers.State.DELETE];
        for(var i=queue.length-1; i>=0; --i) {
            resp.push(this["delete"](
                queue[i], OpenLayers.Util.applyDefaults(
                    {callback: callback, scope: this}, options["delete"]
                ))
            );
        }
        return resp;
    },

    /**
     * APIMethod: abort
     * Abort an ongoing request, the response object passed to
     * this method must come from this HTTP protocol (as a result
     * of a create, read, update, delete or commit operation).
     *
     * Parameters:
     * response - {<OpenLayers.Protocol.Response>}
     */
    abort: function(response) {
        if (response) {
            //response.priv.abort();
            // not supported in CouchDb?
        }
    },

    /**
     * Method: callUserCallback
     * This method is used from within the commit method each time an
     *     an HTTP response is received from the server, it is responsible
     *     for calling the user-supplied callbacks.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>}
     * options - {Object} The map of options passed to the commit call.
     */
    callUserCallback: function(resp, options) {
        var opt = options[resp.requestType];
        if(opt && opt.callback) {
            opt.callback.call(opt.scope, resp);
        }
    },
    
    /**
     * Method: getBboxFromFilter
     * This method is used to find the bounding box filter within the given
     * filter and return the information in a format useable by the tiling system.
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>}
     */
    getBboxFromFilter: function(filter) {

    	if( !filter ) return null;

    	if( filter.type === OpenLayers.Filter.Spatial.BBOX ) {
    		// This is a BBOX
    		return [filter.value.left,filter.value.bottom,filter.value.right,filter.value.top]
    	}

    	if( filter.filters ) {
    		// Logical, continue search
    		for(var i=0,e=filter.filters.length; i<e; ++i) {
    			var bounds = this.getBboxFromFilter(filter.filters[i]);
    			if( bounds ) return bounds;
    		}
    	}

    	return null;
    },

    /**
     * Method: getFidsFromFilter
     * This method is used to find the FID filter within the given
     * filter and return the information in a format useable by the view system.
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>}
     */
    getFidsFromFilter: function(filter) {

    	if( !filter ) return null;

    	if( filter.CLASS_NAME === 'OpenLayers.Filter.FeatureId' ) {
    		// This is a FIDs
    		return filter.fids;
    	}

    	if( filter.filters ) {
    		// Logical, continue search
    		for(var i=0,e=filter.filters.length; i<e; ++i) {
    			var fids = this.getFidsFromFilter(filter.filters[i]);
    			if( fids ) return fids;
    		}
    	}

    	return null;
    },

    _getPole: function(isNorth){
    	var label = isNorth ? 'n' : 's';
    	if( !this.poles ){
    		this.poles = {};
    	};
    	if( this.poles[label] ) return this.poles[label];
    	
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
    	
    	p.transform(this.dbProjection,this.sourceProjection);
    	
    	if( error ){
    		p = null;
    	};
    	
    	// Re-instate normal error reporting
    	if( previousFn ){
    		Proj4js.reportError = previousFn;
    	};
    	
    	this.poles[label] = p;
    	
    	return p;
    },

    _getMapMaxWidth: function(){
    	
    	if( this.sourceProjectionMaxWidth ){
    		return this.sourceProjectionMaxWidth;
    	};
    	
    	var proj = this.sourceProjection;
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
        	
        	w.transform(this.dbProjection,this.sourceProjection);
        	e.transform(this.dbProjection,this.sourceProjection);
        	
        	if( error ){
        		w = null;
        		e = null;
        	};

        	// Re-instate normal error reporting
        	if( previousFn ){
        		Proj4js.reportError = previousFn;
        	};
        	
        	if( e && w ){
        		this.sourceProjectionMaxWidth = w.x - e.x;
        	};
    	};
    	
    	return this.sourceProjectionMaxWidth;
    },
    
    CLASS_NAME: "OpenLayers.Protocol.Couch" 
});

/**
 * Property: OpenLayers.Protocol.Couch.COMP_TYPE_TO_OP_STR
 * {Object} A private class-level property mapping the
 *     OpenLayers.Filter.Comparison types to the operation
 *     strings of the protocol.
 */
(function() {
    var o = OpenLayers.Protocol.Couch.COMP_TYPE_TO_OP_STR = {};
    o[OpenLayers.Filter.Comparison.EQUAL_TO]                 = "eq";
    o[OpenLayers.Filter.Comparison.NOT_EQUAL_TO]             = "ne";
    o[OpenLayers.Filter.Comparison.LESS_THAN]                = "lt";
    o[OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO]    = "lte";
    o[OpenLayers.Filter.Comparison.GREATER_THAN]             = "gt";
    o[OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO] = "gte";
    o[OpenLayers.Filter.Comparison.LIKE]                     = "ilike";
})();

})(jQuery,nunaliit2);
