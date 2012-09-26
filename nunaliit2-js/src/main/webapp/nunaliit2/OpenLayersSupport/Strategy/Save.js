/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Strategy.js
 */

/**
 * Class: OpenLayers.Strategy.Save
 * A strategy that commits modifications to all features upon the <save>()
 *     function call.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy>
 */
OpenLayers.Strategy.SaveGCRC = OpenLayers.Class(OpenLayers.Strategy, {

	/**
	 * Property: protocol
	 * {OpenLayers.Protocol} If specified, protocol to used to perform
	 * a save.
	 */
	 protocol: null,

	/**
	 * Property: onFeatureInserted
	 * {Function} Function to call when a feature is inserted
	 */
	 onFeatureInserted: function(feature){},
	
	/**
	 * Property: onFeatureUpdated
	 * {Function} Function to call when a feature is updated
	 */
	 onFeatureUpdated: function(feature){},
		
	/**
	 * Property: onFeatureRemoved
	 * {Function} Function to call when a feature is deleted
	 */
	 onFeatureRemoved: function(feature){},
		
	/**
	 * Property: onCommitError
	 * {Function} Function to call when a failure is encountered
	 *            during a save.
	 */
	 onCommitError: function(feature, response){},
		
    /**
     * Constructor: OpenLayers.Strategy.Save
     * Create a new Save strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Strategy.prototype.initialize.apply(this, [options]);
    },
   
    /**
     * Method: save
     * Tell the layer protocol to commit unsaved features.  If the layer
     *     projection differs from the map projection, features will be
     *     transformed into the layer projection before being committed.
     *
     * Parameters:
     * features - {Array} Features to be saved.  If null, then default is all
     *     features in the layer.  Features are assumed to be in the map
     *     projection.
     */
    save: function(features) {
        if(!features) {
            features = this.layer.features;
        }
        var remote = this.layer.projection;
        var local = this.layer.map.getProjectionObject();
        if(!local.equals(remote)) {
            var len = features.length;
            var clones = new Array(len);
            var orig, clone;
            for(var i=0; i<len; ++i) {
                orig = features[i];
                clone = orig.clone();
                clone.fid = orig.fid;
                clone.state = orig.state;
                clone._original = orig;
                clone.geometry.transform(local, remote);
                clones[i] = clone;
            }
            features = clones;
        }
        
        if( this.protocol ) {
            this.protocol.commit(features, {
                callback: this.onCommit,
                scope: this
            });
        } else {
            this.layer.protocol.commit(features, {
                callback: this.onCommit,
                scope: this
            });
        };
    },
    
    /**
     * Method: onCommit
     * Called after protocol commit.
     *
     * Parameters:
     * response - {<OpenLayers.Protocol.Response>} A response object.
     */
    onCommit: function(response) {
        var features = response.reqFeatures;
        // deal with inserts, updates, and deletes
        var state, feature;
        var destroys = [];
        var insertIds = response.insertIds || [];
        var j = 0;
        for(var i=0, len=features.length; i<len; ++i) {
            feature = features[i];
            // if projection was different, we may be dealing with clones
            feature = feature._original || feature;
            state = feature.state;
            if(state) {
                if(response.success()) {
                    if(state == OpenLayers.State.DELETE) {
                        destroys.push(feature);
                    	this.onFeatureRemoved(feature);
                    } else if(state == OpenLayers.State.INSERT) {
                        feature.fid = insertIds[j];
                        ++j;
                        this.onFeatureInserted(feature);
                    } else {
                    	this.onFeatureUpdated(feature);
                    }
                } else {
                	this.onCommitError(feature,response);
                	destroys.push(feature);
                };
                feature.state = null;
            }
        }
        if(destroys.length > 0) {
            this.layer.destroyFeatures(destroys);
        }
    },    
   
    CLASS_NAME: "OpenLayers.Strategy.SaveGCRC" 
});
