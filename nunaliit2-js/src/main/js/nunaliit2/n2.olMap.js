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
            if (this.baseLayer) {
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
                
                var newCenter = center;
                var newProjection = this.getProjectionObject();
                if( oldProjection 
                 && !oldProjection.equals(newProjection)) {
                	if( newCenter ){
                        newCenter.transform(oldProjection, newProjection);
                	};
                };

                // recenter the map
                if (newCenter != null) {
                    // new zoom level derived from old scale
                    var newZoom = this.getZoomForResolution(
                        newResolution || this.resolution, true
                    );
                    // zoom and force zoom change
                    this.setCenter(newCenter, newZoom, false, true);
                };

                this.events.triggerEvent("changebaselayer", {
                    layer: this.baseLayer
                    ,oldProjection: oldProjection
                });
            };        
        };
    }
});
	
}; // If OpenLayers is defined
	
})(nunaliit2);