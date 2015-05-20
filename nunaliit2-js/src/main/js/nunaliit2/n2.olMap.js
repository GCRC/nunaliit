/*
Copyright (c) 2015, Geomatics and Cartographic Research Centre, Carleton 
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

if( typeof(OpenLayers) !== 'undefined' && OpenLayers.Map ) {

OpenLayers.N2Map = OpenLayers.Class(OpenLayers.Map, {
	
	initialize: function(div, options) {
		OpenLayers.Map.prototype.initialize.apply(this, arguments);
	},
	
	/**
	 * Finds all geometries on vector layers, verify if the geometry displayed
	 * is the one that should be displayed based on the resolution, and requests
	 * new geometries where needed
	 */
	refreshSimplifiedGeometries: function(){
		var proj = new OpenLayers.Projection('EPSG:4326');
		var epsg4326Resolution = this._getResolutionInProjection(proj);
		$n2.log('epsg4326Resolution',epsg4326Resolution);
		
		// Accumulate all geometries that are required
		var geomsNeeded = {};
		
		// Iterate over layers
		var layers = this.layers;
		for(var li=0,le=layers.length; li<le; ++li){
			var layer = layers[li];

			// Iterate features
			if( layer.features ){
				for(var fi=0;fe=layer.features.length; fi<fe; ++fi){
					var feature = layer.features[fi];
					
					// If feature is a cluster, iterate over its components
					if( feature.cluster ){
						for(var ci=0,ce=feature.cluster.length; ci<ce; ++ci){
							var f = feature.cluster[ci];
							checkFeature(f,epsg4326Resolution,geomsNeeded);
						};
					} else {
						checkFeature(feature,epsg4326Resolution,geomsNeeded);
					};
				};
			};
		};
		
		function checkFeature(f, res, geomsNeeded){
			// Operate only on features that have simplification information
			if( f.data 
			 && f.data.simplified
			 && f.data.simplified.resolutions ){
				// Compute which attachment name and resolution would be
				// ideal for this feature. The best resolution is the greatest
				// one defined which is smaller than the one requested by the map
				var bestAttName = undefined;
				var bestResolution = undefined;
				for(var attName in f.data.simplified.resolutions){
					var attRes = 1 * f.data.simplified.resolutions[attName];
					if( attRes < res ){
						if( typeof bestResolution === 'undefined' ){
							bestResolution = attRes;
							bestAttName = attName;
						} else if( attRes > bestResolution ){
							bestResolution = attRes;
							bestAttName = attName;
						};
					};
				};
			};
		};
	},
	
    /** 
     * APIMethod: setBaseLayer
     * Allows user to specify one of the currently-loaded layers as the Map's
     *     new base layer.
     * 
     * Parameters:
     * newBaseLayer - {<OpenLayers.Layer>}
     */
    setBaseLayer: function(newBaseLayer) {
        
        if (newBaseLayer != this.baseLayer) {
            var oldProjection = null;
            var oldExtent = null;
            if (this.baseLayer) {
            	oldExtent = this.baseLayer.getExtent();
                oldProjection = this.getProjectionObject();
            };
          
            // ensure newBaseLayer is already loaded
            if (OpenLayers.Util.indexOf(this.layers, newBaseLayer) != -1) {

                // preserve center and scale when changing base layers
                var center = this.getCachedCenter();
                var newResolution = OpenLayers.Util.getResolutionFromScale(
                    this.getScale(), newBaseLayer.units
                );

                // make the old base layer invisible 
                if (this.baseLayer != null && !this.allOverlays) {
                    this.baseLayer.setVisibility(false);
                };

                // set new baselayer
                this.baseLayer = newBaseLayer;
                
                if(!this.allOverlays || this.baseLayer.visibility) {
                    this.baseLayer.setVisibility(true);
                    // Layer may previously have been visible but not in range.
                    // In this case we need to redraw it to make it visible.
                    if (this.baseLayer.inRange === false) {
                        this.baseLayer.redraw();
                    };
                };
                
                // Handle change in projection
                var newCenter = center;
            	var newZoom = null;
                var newProjection = this.getProjectionObject();
                if( oldProjection 
                 && !oldProjection.equals(newProjection)) {
                	if( newCenter ){
                        newCenter.transform(oldProjection, newProjection);
                	};

                	if( oldExtent ){
                    	var newExtent = this._reprojectExtent(oldExtent, oldProjection, newProjection);
                    	newZoom = this.getZoomForExtent(newExtent, true);
                	};
                };

                // recenter the map
                if (newCenter != null) {
                    // new zoom level derived from old scale
                	if( !newZoom ){
                        newZoom = this.getZoomForResolution(
                            newResolution || this.resolution, true
                        );
                	};

                	// zoom and force zoom change
                    this.setCenter(newCenter, newZoom, false, true);
                };

                this.events.triggerEvent("changebaselayer", {
                    layer: this.baseLayer
                    ,oldProjection: oldProjection
                });
            };        
        };
    },

    // The concept here is to find a rectangle of the same dimension as in the previous
    // projection, however oriented in the new projection. This does not ensure that all
    // geometries visible in the previous projection will remain in the new one. However,
    // it keeps the same center of view and similar scale.
    _reprojectExtent: function(oldExtent, sourceProj, targetProj){
    	var center = {
    		x: (oldExtent.right + oldExtent.left)/2
    		,y: (oldExtent.top + oldExtent.bottom)/2
    	};
    	var topRight = {'x': oldExtent.right, 'y': oldExtent.top};
    	var bottomLeft = {'x': oldExtent.left, 'y': oldExtent.bottom};
    	var topRightAngle = this._getAngle(center, topRight);
    	
    	var newCenter = OpenLayers.Projection.transform(center, sourceProj, targetProj);
    	var newTopRight = OpenLayers.Projection.transform(topRight, sourceProj, targetProj);
    	var newBottomLeft = OpenLayers.Projection.transform(bottomLeft, sourceProj, targetProj);
    	
    	var newTopRightAngle = this._getAngle(newCenter, newTopRight);
    	var rotateAngle = topRightAngle - newTopRightAngle;
    	
    	var rotatedTopRight = this._rotatePoint(newCenter, newTopRight, rotateAngle);
    	var rotatedBottomLeft = this._rotatePoint(newCenter, newBottomLeft, rotateAngle);
    	
    	var newExtent = new OpenLayers.Bounds(
    		rotatedBottomLeft.x // left
    		,rotatedBottomLeft.y // bottom
    		,rotatedTopRight.x // right
    		,rotatedTopRight.y // top
    	);
    	
    	return newExtent;
    },
    
    _getAngle: function(center, point){
    	var angle = null;
    	if( point.x === center.x ){
    		if( point.y > center.y ){
    			angle = Math.PI / 2;
    		} else {
    			angle = 0 - (Math.PI / 2);
    		};
    	} else if( point.x < center.x ){
    		angle = Math.PI + Math.atan((point.y - center.y) / (point.x - center.x));

    	} else {
    		angle = Math.atan((point.y - center.y) / (point.x - center.x));
    	};
    	
    	return angle;
    },
    
    _rotatePoint: function(center, point, angle){
    	var relX = point.x - center.x;
    	var relY = point.y - center.y;
    	
    	var newX = (relX * Math.cos(angle)) - (relY * Math.sin(angle));
    	var newY = (relX * Math.sin(angle)) + (relY * Math.cos(angle));
    	
    	var newPoint = {
    		x: newX + center.x
    		,y: newY + center.y
    	};
    	
    	return newPoint;
    },
    
    _getResolutionInProjection: function(proj){
    	var targetResolution = this.resolution;
    	
    	if( this.projection.getCode() !== proj.getCode() ){
    		// Convert [0,0] and [0,1] to proj
    		var p0 = OpenLayers.Projection.transform({x:0,y:0},this.projection,proj);
    		var p1 = OpenLayers.Projection.transform({x:0,y:1},this.projection,proj);
    		
    		var factor = Math.sqrt( ((p0.x-p1.x)*(p0.x-p1.x)) + ((p0.y-p1.y)*(p0.y-p1.y)) );
    		
    		targetResolution = this.resolution * factor;
    	};
    	
    	return targetResolution;
    }
});
	
}; // If OpenLayers is defined
	
})(nunaliit2);