/*
Copyright (c) 2017, Geomatics and Cartographic Research Centre, Carleton 
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
 * Class: OpenLayers.Format.Couch2
 * A parser to read/write CouchDb documents.  Create a new instance with the
 *     <OpenLayers.Format.Couch2> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format>
 */
OpenLayers.Format.Couch2 = OpenLayers.Class(OpenLayers.Format, {
	
	/**
	 * Projection that the database uses for the given geometry
	 */
	dbProj: null,
    
    /**
     * Constructor: OpenLayers.Format.Couch2
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
					f.n2GeomProj = this.dbProj;
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

    CLASS_NAME: "OpenLayers.Format.Couch2" 

});     


/**
 * Class: OpenLayers.Protocol.Couch2
 * A basic protocol for accessing vector layers from couchDb.  Create a new instance with the
 *     <OpenLayers.Protocol.Couch2> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Protocol>
 */
OpenLayers.Protocol.Couch2 = OpenLayers.Class(OpenLayers.Protocol, {

    /**
     * Property: documentSource
     * {Object} Instance of DocumentSource to access map geometries.
     */
    documentSource: null,

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
     * Property: notifications
     * {Object} Set of functions to call to report on bubsy status
     */
    notifications: null,
    
    dispatchService: null,
    
    onUpdateCallback: null,

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
     * Constructor: OpenLayers.Protocol.Couch2
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
        	options.format = new OpenLayers.Format.Couch2();
        };
        
       	options.projection = new OpenLayers.Projection('EPSG:4326');
        
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

    	var _this = this;

    	if( this.notifications && this.notifications.readStart ){
    		this.notifications.readStart();
    	};
    	
    	// Obtain layer
    	var layer = options.object;
    	
        OpenLayers.Protocol.prototype.read.apply(this, arguments);
        options = OpenLayers.Util.applyDefaults(options, this.options);
        var resp = new OpenLayers.Protocol.Response({requestType: 'read'});
		
		// Add BBOX tiling
		var bounds = this._getBboxFromFilter(options.filter);
		var fids = this._getFidsFromFilter(options.filter);
		var layerName = ('string' === typeof(options.layerName) ? options.layerName : null);
		
		var projectionCode = null;
		var mapProjection = null;
		if( layer && layer.map ){
			mapProjection = layer.map.getProjectionObject();
			projectionCode = mapProjection.getCode();
		};
		
		this.documentSource.getDocumentsFromGeographicFilter({
			docIds: fids
			,layerId: layerName
			,bbox: bounds
			,projectionCode: projectionCode
			,onSuccess: function(docs){
				_this._handleRead(resp, options, docs);
			}
			,onError: function(errorMsg){
				$n2.log(errorMsg); 
            	if( _this.notifications && _this.notifications.readEnd ){
            		_this.notifications.readEnd();
            	};
			}
		});

        return resp;
    },

    /**
     * Method: _handleRead
     * Individual callbacks are created for read, create and update, should
     *     a subclass need to override each one separately.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     the user callback.
     * options - {Object} The user options passed to the read call.
     */
    _handleRead: function(resp, options, docs) {
    	
    	var _this = this;

        if(options.callback) {
            resp.features = this.format.read(docs);

            // Sorting now saves on rendering a re-sorting later
	    	$n2.olUtils.sortFeatures(resp.features);

            resp.code = OpenLayers.Protocol.Response.SUCCESS;
            options.callback.call(options.scope, resp);
            
            window.setTimeout(function(){
            	if( _this.notifications && _this.notifications.readEnd ){
            		_this.notifications.readEnd();
            	};
            },0);
        };
    },

    /**
     * Method: _getBboxFromFilter
     * This method is used to find the bounding box filter within the given
     * filter and return the information in a format useable by the tiling system.
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>}
     */
    _getBboxFromFilter: function(filter) {

    	if( !filter ) return null;

    	if( filter.type === OpenLayers.Filter.Spatial.BBOX ) {
    		// This is a BBOX
    		return [filter.value.left,filter.value.bottom,filter.value.right,filter.value.top]
    	}

    	if( filter.filters ) {
    		// Logical, continue search
    		for(var i=0,e=filter.filters.length; i<e; ++i) {
    			var bounds = this._getBboxFromFilter(filter.filters[i]);
    			if( bounds ) return bounds;
    		}
    	}

    	return null;
    },

    /**
     * Method: _getFidsFromFilter
     * This method is used to find the FID filter within the given
     * filter and return the information in a format useable by the view system.
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>}
     */
    _getFidsFromFilter: function(filter) {

    	if( !filter ) return null;

    	if( filter.CLASS_NAME === 'OpenLayers.Filter.FeatureId' ) {
    		// This is a FIDs
    		return filter.fids;
    	}

    	if( filter.filters ) {
    		// Logical, continue search
    		for(var i=0,e=filter.filters.length; i<e; ++i) {
    			var fids = this._getFidsFromFilter(filter.filters[i]);
    			if( fids ) return fids;
    		}
    	}

    	return null;
    },
    
    CLASS_NAME: "OpenLayers.Protocol.Couch2" 
});

/**
 * Property: OpenLayers.Protocol.Couch2.COMP_TYPE_TO_OP_STR
 * {Object} A private class-level property mapping the
 *     OpenLayers.Filter.Comparison types to the operation
 *     strings of the protocol.
 */
(function() {
    var o = OpenLayers.Protocol.Couch2.COMP_TYPE_TO_OP_STR = {};
    o[OpenLayers.Filter.Comparison.EQUAL_TO]                 = "eq";
    o[OpenLayers.Filter.Comparison.NOT_EQUAL_TO]             = "ne";
    o[OpenLayers.Filter.Comparison.LESS_THAN]                = "lt";
    o[OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO]    = "lte";
    o[OpenLayers.Filter.Comparison.GREATER_THAN]             = "gt";
    o[OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO] = "gte";
    o[OpenLayers.Filter.Comparison.LIKE]                     = "ilike";
})();

})(nunaliit2);
