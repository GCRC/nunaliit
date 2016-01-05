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
"use strict";

if( typeof(OpenLayers) !== 'undefined'
 && OpenLayers.Strategy
 && OpenLayers.Class
 ) {

OpenLayers.Strategy.NunaliitLayerSorting = OpenLayers.Class(OpenLayers.Strategy, {
    
    /**
     * Property: clustering
     * {Boolean} The strategy is currently clustering features.
     */
    sorting: false,
    
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
                scope: this
            });
        }
        return deactivated;
    },
    
    /**
     * Method: beforeFeaturesAdded
     * Sort the features before adding them to the map
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
        if(!this.sorting) {
            this.sortFeatures(null,event.features);
            propagate = false;
        }
        return propagate;
    },
    
    /**
     * Method: sortFeatures
     * Sort features found on layer
     *
     * Parameters:
     * event - {Object} The event received when cluster is called as a
     *     result of a moveend event.
     * newFeatures - {Array} The features being added to the layer.
     */
    sortFeatures: function(event, newFeatures) {
    	// Compute the feature set
    	var features = [];
    	for(var i=0,e=this.layer.features.length; i<e; ++i){
    		var feature = this.layer.features[i];
   			features[features.length] = feature;
    	};
    	if( newFeatures ){
    		for(var i=0,e=newFeatures.length; i<e; ++i) {
    			features[features.length] = newFeatures[i];
    		};
    	};
    	
        if( features 
         && features.length > 0 
         && newFeatures
         && newFeatures.length > 0 ) {
			var resortingRequired = false;
			for(var i=0,e=features.length-2; i<=e; ++i){
				var c = $n2.olUtils.featureSorting(features[i],features[i+1]);
				if( c > 0 ) {
					resortingRequired = true;
					break;
				};
			};
			
			if( resortingRequired ){
				// At this point, resorting is required. Remove all features
				// from layer, re-sort them and add them back.
				$n2.olUtils.sortFeatures(features);

				this.layer.removeAllFeatures();
                
				this.sorting = true;
				this.layer.addFeatures(features);
                this.sorting = false;
				
			} else if( newFeatures.length > 0 ){
				// No sorting required. Just add new features
                this.sorting = true;
                this.layer.addFeatures(newFeatures);
                this.sorting = false;
			};
        };
    },

    CLASS_NAME: "OpenLayers.Strategy.NunaliitLayerSorting" 
});
	
	
}; // If OpenLayers is defined
	
})(jQuery,nunaliit2);