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

;(function($n2){
"use strict";

// If OpenLayers is not included, do not process further
if( typeof OpenLayers === 'undefined' ) return;

/**
 * Class: OpenLayers.Format.Couch
 * A parser to read/write CouchDb documents.  Create a new instance with the
 *     <OpenLayers.Format.Couch> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format>
 */
OpenLayers.Format.Model = OpenLayers.Class(OpenLayers.Format, {
	
	/**
	 * Projection that the database uses for the given geometry
	 */
	dbProj: null,
    
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
        
        this.dbProj = new OpenLayers.Projection('EPSG:4326');
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
				
				if( doc.nunaliit_geom 
				 && doc.nunaliit_geom.wkt ) {
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
					f.n2GeomProj = this.dbProj;
					results.push(f);
//				} else {
//					$n2.log('Invalid feature',doc);
				};
			};
			
			return results;
        } catch(e) {
            $n2.log('Error during CouchDB format read',e);
        }
        return [];
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
        	var mapProjection = f.layer.map.getProjectionObject();
        	if( f.layer.projection 
        	 && mapProjection
        	 && f.layer.projection.getCode() != mapProjection.getCode() ) {
        	 	geom = geom.clone();
        	 	geom.transform(mapProjection, f.layer.projection);
        	};
        	if( !data.nunaliit_geom ) data.nunaliit_geom = { nunaliit_type: 'geometry' };
        	data.nunaliit_geom.wkt = geom.toString();
        	var bbox = geom.getBounds();
        	data.nunaliit_geom.bbox = [bbox.left,bbox.bottom,bbox.right,bbox.top];
        	
        	if( data.nunaliit_geom.simplified ){
        		delete data.nunaliit_geom.simplified;
        	};
        	
        	result.push( data );
        };
        
        return result;
    },

    CLASS_NAME: "OpenLayers.Format.Model" 

});     


/**
 * Class: OpenLayers.Protocol.Couch
 * A basic protocol for accessing vector layers from couchDb.  Create a new instance with the
 *     <OpenLayers.Protocol.Couch> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Protocol>
 */
OpenLayers.Protocol.Model = OpenLayers.Class(OpenLayers.Protocol, {

    /**
     * Property: dispatchService
     * {Object} Instance of dispatcher use for this configuration
     */
    dispatchService: null,

    /**
     * Property: sourceModelId
     * {String} Identifier for the model which is source for documents.
     */
    sourceModelId: null,
    
    /**
     * Property: modelObserver
     * {Object} Object that keeps track of state of source model.
     */
    modelObserver: null,
    
    /**
     * Property: callback
     * {Function} Function to be called when source model has updated.
     */
    onUpdateCallback: null,

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
     * Property: notifications
     * {Object} Set of functions to call to report on busy status
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
    
    readWasCalled: false,
    
    loading: false,

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
    	var _this = this;
    	
        options = options || {};
        
        // Install default format
        if( !options.format ) {
        	options.format = new OpenLayers.Format.Model();
        };
        
       	options.projection = new OpenLayers.Projection('EPSG:4326');
        
        OpenLayers.Protocol.prototype.initialize.apply(this, arguments);
        this.cnt = 0;
        this.modelObserver = new $n2.model.DocumentModelObserver({
			dispatchService: this.dispatchService
			,sourceModelId: this.sourceModelId
			,updatedCallback: function(state){
				if( _this.readWasCalled ){
					console.log("N2Update times: " + _this.cnt++);
					_this._modelSourceUpdated(state);
				};
			}
        });
    },
    
    /**
     * APIMethod: destroy
     * Clean up the protocol.
     */
    destroy: function() {
        OpenLayers.Protocol.prototype.destroy.apply(this);
    },
    
    _modelSourceUpdated: function(state){
    	var _this = this;
  
    	if( typeof this.onUpdateCallback === 'function' ){
    		var mapState = {
    			added: []
				,updated: []
				,removed: []
    		};
    		
    		if( typeof state.loading === 'boolean' ){
    			mapState.loading = state.loading;
   				this._reportLoading(state.loading);
    		};
    		
    		if( state.added ){
    			mapState.added = this.format.read(state.added);
    		};
    		if( state.updated ){
    			mapState.updated = this.format.read(state.updated);
    		};
    		if( state.removed ){
    			mapState.removed = this.format.read(state.removed);
    		};
    		
    		this.onUpdateCallback(mapState);
    	};
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

    	var _this = this;
    	
    	this.readWasCalled = true;

    	// Obtain layer
    	var layer = options.object;
    	
        OpenLayers.Protocol.prototype.read.apply(this, arguments);
        options = OpenLayers.Util.applyDefaults(options, this.options);
        var resp = new OpenLayers.Protocol.Response({requestType: 'read'});

		var projectionCode = null;
		var mapProjection = null;
		if( layer && layer.map ){
			mapProjection = layer.map.getProjectionObject();
			projectionCode = mapProjection.getCode();
		};

		var isLoading = this.modelObserver.isLoading();
		if( typeof isLoading === 'boolean' ){
			this._reportLoading(isLoading);
		};

		var docs = this.modelObserver.getDocuments();
		
		var fidMap = this._getFidMapFromFilter(options.filter);
		if( fidMap ){
			docs = docs.filter(function(doc){
				var docId = doc._id;
				if( fidMap[docId] ) {
					return true;
				};
				return false;
			});
		};
		
        if(options.callback) {
            resp.features = this.format.read(docs);

            // Sorting now saves on rendering a re-sorting later
	    	$n2.olUtils.sortFeatures(resp.features);

            resp.code = OpenLayers.Protocol.Response.SUCCESS;
            options.callback.call(options.scope, resp);
        };

        return resp;
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
     * Method: _getFidMapFromFilter
     * This method is used to find the FID filter within the given
     * filter and return the information in a format useable by the view system.
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>}
     */
    _getFidMapFromFilter: function(filter) {

    	if( !filter ) return null;

    	if( filter.CLASS_NAME === 'OpenLayers.Filter.FeatureId' ) {
    		// This is a FIDs
			var map = null;
    		if( filter.fids ){
    			filter.fids.forEach(function(fid){
    				if( null == map ){
    					map = {};
    				};
    				map[fid] = true;
    			});
    		};
    		return map;
    	}

    	if( filter.filters ) {
    		// Logical, continue search
			var map = null;
    		for(var i=0,e=filter.filters.length; i<e; ++i) {
    			var fidMap = this._getFidMapFromFilter(filter.filters[i]);
    			if( fidMap ) {
    				for(var fid in fidMap){
    					if( null === map ){
    						map = {};
    					};
    					map[fid] = true;
    				};
    			};
    		};
    		return map;
    	}

    	return null;
    },
    
    _reportLoading: function(flag){
    	if( this.loading && !flag ){
    		this.loading = false;
        	if( this.notifications 
	    	 && typeof this.notifications.readEnd === 'function'){
	    		this.notifications.readEnd();
	    	};
    	} else if( !this.loading && flag ){
    		this.loading = true;
        	if( this.notifications 
	    	 && typeof this.notifications.readStart === 'function'){
	    		this.notifications.readStart();
	    	};
    	};
    },
    
    CLASS_NAME: "OpenLayers.Protocol.Model" 
});



})(nunaliit2);
