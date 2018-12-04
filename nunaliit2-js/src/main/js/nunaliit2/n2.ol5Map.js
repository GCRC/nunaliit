/*
Copyright (c) 2018, Geomatics and Cartographic Research Centre, Carleton 
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


if( typeof(ol) !== 'undefined' && ol.Map) {
	
	ol.N2Map = $n2.Construct('N2Map', ol.Map, {
		initialize: function() {
			console.log('N2Map constructor called');
		}
		 ,val1 : 'val valriable'
		,getInfo : function() {
			
			console.log('Successfully Instantiate: '+ this._classname )
			console.log('Successfully Inherit Var: ' + this.val1)
		}
	  
    
    })
} // if ol is defined 

/*if( typeof(OpenLayers) !== 'undefined' && OpenLayers.Map ) {

OpenLayers.N2Map = OpenLayers.Class(OpenLayers.Map, {
	
	initialize: function(div, options) {
		OpenLayers.Map.prototype.initialize.apply(this, arguments);
	},
	
	*//** The baselayer is deprecated in ol5,
	 * need a new way to rotate the projection on the fly
	*//*
	//TODO: new procedure to change projection on the fly
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
    }
});
	
}; // If OpenLayers is defined
*/	
})(nunaliit2);