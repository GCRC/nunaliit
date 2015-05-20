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

;(function($,$n2){

if( typeof(OpenLayers) !== 'undefined'
 && OpenLayers.Strategy
 && OpenLayers.Class
 ) {

OpenLayers.Strategy.NunaliitGeometrySimplification = OpenLayers.Class(OpenLayers.Strategy, {
    
    /**
     * Constructor: OpenLayers.Strategy.NunaliitGeometrySimplification
     * Create a new simplification strategy.
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
                "featuresadded": this.featuresAdded,
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
                "featuresadded": this.featuresAdded,
                scope: this
            });
        }
        return deactivated;
    },
    
    /**
     * Method: featuresAdded
     * Detect features that new geometries with better resolutions
     *
     * Parameters:
     * event - {Object} The event that this was listening for.  This will come
     *     with a batch of features.
     *     
     */
    featuresAdded: function(event) {
    	$n2.log('NunaliitGeometrySimplification',event.features);
    	var layer = this.layer;
    	
    	var map = null;
    	if( layer ){
    		map = layer.map;
    	};
    	
    	if( map && typeof map.refreshSimplifiedGeometries === 'function' ){
    		map.refreshSimplifiedGeometries();
    	};
    	
        return true;
    },

    CLASS_NAME: "OpenLayers.Strategy.NunaliitGeometrySimplification" 
});
	
	
}; // If OpenLayers is defined
	
})(jQuery,nunaliit2);