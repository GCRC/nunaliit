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

if( typeof OpenLayers !== 'undefined'
 && OpenLayers.Strategy
 && OpenLayers.Class
 ) {
	
//+++++++++++++++++++++++++++++++++++++++++++++++
var Filtering = $n2.Class({
	
	allowAllFeatures: null,
	
    docIdMap: null,

    initialize: function(opts_){
		var opts = $n2.extend({
		},opts_);

		this.allowAllFeatures = true;
		this.docIdMap = {};
	},
	
	setAllowAllFeatures: function(flag){
		this.allowAllFeatures = flag;
	},
	
	setDocIds: function(docIds){
		var _this = this;

		this.allowAllFeatures = false;
		this.docIdMap = {};
		if( docIds ){
			docIds.forEach(function(docId){
				_this.docIdMap[docId] = true;
			});
		};
	},
	
	performFiltering: function(features, filteredOutFeatures){
		var _this = this;
		
		if( this.allowAllFeatures ){
			// Nothing to do
		} else {
			var newFeatures = [];
			features.forEach(function(feature){
				var id = undefined;
				if( feature && feature.data ){
					id = feature.data._id;
				};
				if( id && _this.docIdMap[id] ){
					newFeatures.push(feature);
				} else if(filteredOutFeatures) {
					filteredOutFeatures.push(feature);
				};
			});
			features = newFeatures;
		};
		
		// Indicate that the features are visible
		features.forEach(function(feature){
        	if( feature.style ){
        		delete feature.style;
        	};
        	feature.n2FilteredOut = false;
		});
		
		// Indicate that the features are not visible
		if( filteredOutFeatures ){
			filteredOutFeatures.forEach(function(feature){
				feature.style = {
                	display: 'none'
                };
	        	feature.n2FilteredOut = true;
			});
		};
		
		return features;
	}
});

//+++++++++++++++++++++++++++++++++++++++++++++++
var Clustering = $n2.Class({
    /**
     * APIProperty: distance
     * {Integer} Pixel distance between features that should be considered a
     *     single cluster.  Default is 20 pixels.
     */
    distance: undefined,

    /**
     * APIProperty: minimumPolygonPixelSize
     * {Integer} Minimum pixel size that a polygon has to be so that it is
     * not converted to a point.  Default is 20 pixels.
     */
    minimumPolygonPixelSize: undefined,

    /**
     * APIProperty: minimumLinePixelSize
     * {Integer} Minimum pixel size that a line has to be so that it is
     * not converted to a point.  Default is 20 pixels.
     */
    minimumLinePixelSize: undefined,

    /**
     * APIProperty: disableDynamicClustering
     * {Boolean} If true, disable default behaviour which is to turn small
     * polygons and lines into cluster, but leaving larger ones from clustering.
     */
    disableDynamicClustering: false,

    /**
     * APIProperty: clusterPointsOnly
     * {Boolean} If true, skip lines and polygons during clustering. The option
     * "disableDynamicClustering" must be set for this option to take effect.
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
     * Property: clusterPrefix
     * {Integer} The string portion of the identifiers to be given to clusters.
     */
    clusterPrefix: null,
    
    /**
     * Property: clusterId
     * {Integer} The integer portion of the next identifier to be given to clusters.
     */
    clusterId: null,

    initialize: function(opts_){
		var opts = $n2.extend({
		    distance: 20,
		    minimumPolygonPixelSize: undefined,
		    minimumLinePixelSize: undefined,
		    disableDynamicClustering: false,
		    clusterPointsOnly: false,
		    threshold: null
		},opts_);
		
		this.distance = opts.distance;
		this.minimumPolygonPixelSize = opts.minimumPolygonPixelSize;
		this.minimumLinePixelSize = opts.minimumLinePixelSize;
		this.disableDynamicClustering = opts.disableDynamicClustering;
		this.clusterPointsOnly = opts.clusterPointsOnly;
		this.threshold = opts.threshold;

		this.resolution = 1;
		this.clusterPrefix = 'cluster_' + $n2.getUniqueId() + '_';
    	this.clusterId = 1;
    	
    	if( typeof this.minimumPolygonPixelSize === 'undefined' ){
    		this.minimumPolygonPixelSize = this.distance;
    	};
    	
    	if( typeof this.minimumLinePixelSize === 'undefined' ){
    		this.minimumLinePixelSize = this.distance;
    	};
	},
	
	setResolution: function(resolution){
		this.resolution = resolution;
	},
	
	performClustering: function(features){
        var resolution = this.resolution;
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
                    if(this._shouldCluster(cluster, feature)) {
                        this._addToCluster(cluster, feature);
                        clustered = true;
                        break;
                    };
                };
                if(!clustered) {
                	var c = this._createCluster(feature);
                    clusters.push(c);
                    featuresToAdd.push(c);
                };
            };
        };

        var finalFeatures = [];
        if( this.threshold > 1 ) {
            for(var i=0, len=featuresToAdd.length; i<len; ++i) {
                var candidate = featuresToAdd[i];
                if( candidate.cluster 
                 && candidate.cluster.length < this.threshold ) {
                	finalFeatures.push.apply(finalFeatures, candidate.cluster);
                } else {
                	finalFeatures.push(candidate);
                };
            };

        } else {
        	finalFeatures = featuresToAdd;
        };
        
        return finalFeatures;
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
    _shouldCluster: function(cluster, feature) {
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
    _addToCluster: function(cluster, feature) {
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
    _createCluster: function(feature) {
        var center = feature.geometry.getBounds().getCenterLonLat();
        var cluster = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(center.lon, center.lat),
            {count: 1}
        );
        cluster.cluster = [feature];
        cluster.fid = this.clusterPrefix+this.clusterId;
        ++this.clusterId;
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
    	// By default, cluster everything
        var eligible = true;
        
        if( feature.n2DisableClustering ){
        	return false;
        };
        
        if( !this.disableDynamicClustering ) {
        	// Dynamic Clustering
        	// Small polygons and lines are turned into a cluster
        	eligible = false;
        	if( feature.geometry.CLASS_NAME.indexOf('Point') >= 0 ){
        		eligible = true;
        	} else if( feature.geometry.CLASS_NAME.indexOf('Line') >= 0 ){
        		var bounds = feature.geometry.getBounds();
        		var xLen = (bounds.right - bounds.left) / this.resolution;
        		var yLen = (bounds.top - bounds.bottom) / this.resolution;
        		if( (xLen) < this.minimumLinePixelSize
            	 && (yLen) < this.minimumLinePixelSize ) {
        			eligible = true;
        		};
        	} else if( feature.geometry.CLASS_NAME.indexOf('Polygon') >= 0 ){
        		var bounds = feature.geometry.getBounds();
        		var xLen = (bounds.right - bounds.left) / this.resolution;
        		var yLen = (bounds.top - bounds.bottom) / this.resolution;
        		if( (xLen) < this.minimumPolygonPixelSize
            	 && (yLen) < this.minimumPolygonPixelSize ) {
        			eligible = true;
        		};
        	};
        	
        } else if( this.clusterPointsOnly ){
        	// Cluster Point Only
        	// Do not cluster polygons and lines
        	eligible = false;
        	if( feature.geometry.CLASS_NAME.indexOf('Point') >= 0 ){
        		eligible = true;
        	};
        };
        
        return eligible;
    }
});

//+++++++++++++++++++++++++++++++++++++++++++++++
var Sorting = $n2.Class({

    initialize: function(opts_){
		var opts = $n2.extend({
		},opts_);
		
	},
	
	performSorting: function(features){
		$n2.olUtils.sortFeatures(features);
		
		return features;
    }
});

//+++++++++++++++++++++++++++++++++++++++++++++++
OpenLayers.Strategy.NunaliitFeatureStrategy = OpenLayers.Class(OpenLayers.Strategy, {

    /**
     * Property: filtering
     * {Object} Component that performs filtering
     */
    filtering: null,
    
    /**
     * Property: clustering
     * {Object} Component that performs clustering
     */
    clustering: null,

    /**
     * Property: sorting
     * {Object} Component that performs sorting
     */
    sorting: null,
    
    /**
     * Property: addingToLayer
     * {Boolean} Set if we are currently adding features to layer
     */
    addingToLayer: null,

    /**
     * Constructor: OpenLayers.Strategy.NunaliitFeatureStrategy
     * Create a new strategy that deals with features.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function (options) {
        
    	OpenLayers.Strategy.prototype.initialize.apply(this, arguments);

    	this.addingToLayer = false;
    	
    	this.filtering = new Filtering();
    	this.clustering = null;
    	this.sorting = new Sorting();
    },
    
    setClustering: function(opts_){
    	this.clustering = new Clustering(opts_);
    },
    
    setAllowDocumentIds: function(docIds){
    	this.filtering.setDocIds(docIds);

    	var features = this._computeFeatureSet();
    	this._accountForFeatures(features);
    },
    
    setAllowAllDocuments: function(flag){
    	this.filtering.setAllowAllFeatures(flag);

    	var features = this._computeFeatureSet();
    	this._accountForFeatures(features);
    },
    
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
                "beforefeaturesadded": this._beforeFeaturesAdded,
                "moveend": this._moveEnd,
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
                "beforefeaturesadded": this._beforeFeaturesAdded,
                "moveend": this._moveEnd,
                scope: this
            });
        }
        return deactivated;
    },
    
    /**
     * Method: beforeFeaturesAdded
     * Perform operations on the features before they are added to the
     * layer. 
     *
     * Parameters:
     * event - {Object} The event that this was listening for.  This will come
     *     with a batch of features to be clustered.
     *     
     * Returns:
     * {Boolean} False to stop features from being added to the layer.
     */
    _beforeFeaturesAdded: function(event) {
    	// This process is currently adding features. Accept propagation
    	if( this.addingToLayer ) {
    		return true;
    	};

    	var features = this._computeFeatureSet(event.features);
    	this._accountForFeatures(features);
    	
    	return false;
    },
    
    /**
     * Method: cluster
     * Cluster features based on some threshold distance.
     *
     * Parameters:
     * event - {Object} The event received when cluster is called as a
     *     result of a moveend event.
     */
    _moveEnd: function(event) {
    	// Re-cluster when zoom has changed
    	if( event && event.zoomChanged ){
        	var features = this._computeFeatureSet();
        	this._accountForFeatures(features);
    	};
    },
    
    _accountForFeatures: function(features){
    	var filteredOutFeatures = [];
    	var installRequired = false;

    	if( this.filtering ){
    		features = this.filtering.performFiltering(features, filteredOutFeatures);
    		installRequired = true;
    	};

    	if( this.clustering ){
            var resolution = this.layer.map.getResolution();
            this.clustering.setResolution(resolution);
    		features = this.clustering.performClustering(features);
    		installRequired = true;
    	};

    	if( this.sorting ){
    		features = this.sorting.performSorting(features);
    		installRequired = true;
    	};

    	// Re-insert filtered out features
    	features.push.apply(features, filteredOutFeatures);
    	
    	//$n2.log('accoutForFeatures',features.length);
    	
    	if( installRequired ){
    		this._installFeaturesOnLayer(features);
    	};
    },
    
    _computeFeatureSet: function(newFeatures){
    	// Compute the feature set
    	var features = [];
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
    	if( newFeatures ){
    		for(var i=0,e=newFeatures.length; i<e; ++i) {
        		var feature = newFeatures[i];
        		if( feature.cluster ){
        			for(var j=0,k=feature.cluster.length; j<k; ++j){
        				features[features.length] = feature.cluster[j];
        			};
        		} else {
        			features[features.length] = feature;
        		};
    		};
    	};
    	
    	return features;
    },
    
    _installFeaturesOnLayer: function(features){
    	if( !this.addingToLayer ){
        	this.addingToLayer = true;

        	this.layer.removeAllFeatures({silent:true});
    		this.layer.addFeatures(features);
        	
    		this.addingToLayer = false;
    	};
    },

    CLASS_NAME: "OpenLayers.Strategy.NunaliitFeatureStrategy" 
});
	
	
}; // If OpenLayers is defined
	
})(nunaliit2);