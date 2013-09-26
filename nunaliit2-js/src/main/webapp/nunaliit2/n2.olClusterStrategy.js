/*
Copyright (c) 2013, Geomatics and Cartographic Research Centre, Carleton 
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

if( typeof(OpenLayers) !== 'undefined'
 && OpenLayers.Strategy
 && OpenLayers.Class
 ) {

OpenLayers.Strategy.NunaliitCluster = OpenLayers.Class(OpenLayers.Strategy, {
    
    /**
     * APIProperty: distance
     * {Integer} Pixel distance between features that should be considered a
     *     single cluster.  Default is 20 pixels.
     */
    distance: 20,

    /**
     * APIProperty: clusterPointsOnly
     * {Boolean} If true, skip lines and polygons during clustering
     */
    clusterPointsOnly: false,
    
    /**
     * APIProperty: threshold
     * {Integer} Optional threshold below which original features will be
     *     added to the layer instead of clusters.  For example, a threshold
     *     of 3 would mean that any time there are 2 or fewer features in
     *     a cluster, those features will be added directly to the layer instead
     *     of a cluster representing those features.  Default is null (which is
     *     equivalent to 1 - meaning that clusters may contain just one feature).
     */
    threshold: null,
    
    /**
     * Property: resolution
     * {Float} The resolution (map units per pixel) of the current cluster set.
     */
    resolution: null,

    /**
     * Constructor: OpenLayers.Strategy.Cluster
     * Create a new clustering strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    
    /**
     * APIMethod: activate
     * Activate the strategy.  Register any listeners, do appropriate setup.
     * 
     * Returns:
     * {Boolean} The strategy was successfully activated.
     */
    activate: function() {
        var activated = OpenLayers.Strategy.prototype.activate.call(this);
        if(activated) {
            this.layer.events.on({
                "beforefeaturesadded": this.beforeFeaturesAdded,
                "moveend": this.cluster,
                scope: this
            });
        }
        return activated;
    },
    
    /**
     * APIMethod: deactivate
     * Deactivate the strategy.  Unregister any listeners, do appropriate
     *     tear-down.
     * 
     * Returns:
     * {Boolean} The strategy was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Strategy.prototype.deactivate.call(this);
        if(deactivated) {
            this.layer.events.un({
                "beforefeaturesadded": this.beforeFeaturesAdded,
                "moveend": this.cluster,
                scope: this
            });
        }
        return deactivated;
    },
    
    /**
     * Method: beforeFeaturesAdded
     * Cluster the features before adding them to the layer
     *
     * Parameters:
     * event - {Object} The event that this was listening for.  This will come
     *     with a batch of features to be clustered.
     *     
     * Returns:
     * {Boolean} False to stop features from being added to the layer.
     */
    beforeFeaturesAdded: function(event) {
        var propagate = true;
        
        // The computation of "needToCluster" is to prevent
        // never ending loop. Strategies following this one might
        // perform modifications on the features and then call
        // "addFeatures" again, triggering this function to re-enter 
        // itself.
        var needToCluster = false;
        if( event 
         && event.features 
         && event.features.length ){
        	for(var i=0,e=event.features.length; i<e; ++i){
        		var f = event.features[i];
        		if( f.cluster ){
        			// No need to cluster, already clustered
        		} else if( this._isEligibleFeature(f) ) {
        			needToCluster = true;
        		};
        	};
        };
        
        if( needToCluster ) {
            this.cluster(null,event.features);
            propagate = false;
        }
        return propagate;
    },
    
    /**
     * Method: cluster
     * Cluster features based on some threshold distance.
     *
     * Parameters:
     * event - {Object} The event received when cluster is called as a
     *     result of a moveend event.
     * newFeatures - {Array} The features being added to the layer.
     */
    cluster: function(event, newFeatures) {
    	// Compute the feature set
    	var features = [];
    	if( newFeatures ){
    		for(var i=0,e=newFeatures.length; i<e; ++i) {
    			features[features.length] = newFeatures[i];
    		};
    	};
    	for(var i=0,e=this.layer.features.length; i<e; ++i){
    		var feature = this.layer.features[i];
    		if( feature.cluster ){
    			for(var j=0,k=feature.cluster.length; j<k; ++j){
    				features[features.length] = feature.cluster[j];
    			};
    		} else {
    			features[features.length] = feature;
    		};
    	};
    	
        if((!event || event.zoomChanged) && features) {
            var resolution = this.layer.map.getResolution();
            this.resolution = resolution;
            var clusters = [];
            var featuresToAdd = [];
            var feature, clustered, cluster;
            for(var i=0; i<features.length; ++i) {
                feature = features[i];
                if( !this._isEligibleFeature(feature) ){
                	featuresToAdd.push(feature);
                	
                } else if(feature.geometry) {
                    clustered = false;
                    for(var j=clusters.length-1; j>=0; --j) {
                        cluster = clusters[j];
                        if(this.shouldCluster(cluster, feature)) {
                            this.addToCluster(cluster, feature);
                            clustered = true;
                            break;
                        };
                    };
                    if(!clustered) {
                    	var c = this.createCluster(feature);
                        clusters.push(c);
                        featuresToAdd.push(c);
                    };
                };
            };
            this.layer.removeAllFeatures();
            
            if(featuresToAdd.length > 0) {
                if(this.threshold > 1) {
                    var clone = featuresToAdd.slice();
                    featuresToAdd = [];
                    var candidate;
                    for(var i=0, len=clone.length; i<len; ++i) {
                        candidate = clone[i];
                        if( candidate.cluster 
                         && candidate.cluster.length < this.threshold ) {
                            Array.prototype.push.apply(featuresToAdd, candidate.cluster);
                        } else {
                        	featuresToAdd.push(candidate);
                        };
                    };
                };

                // A legitimate feature addition could occur during this
                // addFeatures call.  For clustering to behave well, features
                // should be removed from a layer before requesting a new batch.
                this.layer.addFeatures(featuresToAdd);
            };
        };
    },
    
    /**
     * Method: shouldCluster
     * Determine whether to include a feature in a given cluster.
     *
     * Parameters:
     * cluster - {<OpenLayers.Feature.Vector>} A cluster.
     * feature - {<OpenLayers.Feature.Vector>} A feature.
     *
     * Returns:
     * {Boolean} The feature should be included in the cluster.
     */
    shouldCluster: function(cluster, feature) {
        var cc = cluster.geometry.getBounds().getCenterLonLat();
        var fc = feature.geometry.getBounds().getCenterLonLat();
        var distance = (
            Math.sqrt(
                Math.pow((cc.lon - fc.lon), 2) + Math.pow((cc.lat - fc.lat), 2)
            ) / this.resolution
        );
        return (distance <= this.distance);
    },
    
    /**
     * Method: addToCluster
     * Add a feature to a cluster.
     *
     * Parameters:
     * cluster - {<OpenLayers.Feature.Vector>} A cluster.
     * feature - {<OpenLayers.Feature.Vector>} A feature.
     */
    addToCluster: function(cluster, feature) {
        cluster.cluster.push(feature);
        cluster.attributes.count += 1;
    },
    
    /**
     * Method: createCluster
     * Given a feature, create a cluster.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A cluster.
     */
    createCluster: function(feature) {
        var center = feature.geometry.getBounds().getCenterLonLat();
        var cluster = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(center.lon, center.lat),
            {count: 1}
        );
        cluster.cluster = [feature];
        return cluster;
    },
    
    /**
     * Method: _isEligibleFeature
     * Returns true if a feature should be clustered
     *
     * Returns:
     * {Boolean} True if the feature should be considered for clusters
     */
    _isEligibleFeature: function(feature) {
        var eligible = true;
        
        if( this.clusterPointsOnly ){
        	eligible = false;
        	if( feature.geometry.CLASS_NAME.indexOf('Point') >= 0 ){
        		eligible = true;
        	};
        };
        
        return eligible;
    },

    CLASS_NAME: "OpenLayers.Strategy.NunaliitCluster" 
});
	
	
}; // If OpenLayers is defined
	
})(jQuery,nunaliit2);