/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
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

;(function(){
"use strict";

//**************************************************
// OPEN LAYERS STYLE MAP CALLBACK
// This code is an extension of OpenLayers. It adds
// a StyleMap which calls back a function given during
// initialization.
//
// This code is not needed if OpenLayers is not installed.
if( typeof OpenLayers != 'undefined' ) {

/**
 * Class: OpenLayers.StyleMapCallback
 */
OpenLayers.StyleMapCallback = OpenLayers.Class({
    
    /**
     * Property: callback
     * Callback function that is called during "createSymbolizer".
     */
    callback: null,
    
    /**
     * Constructor: OpenLayers.StyleMap
     * 
     * Parameters:
     * callback- {Function} Function called every time the
     *           style map 'createSymbolizer' is called. This
     *           is the function that actually computes the
     *           symbolizer. It should have a signature of
     *           function(feature, intent) and return a hash
     *           of symbolizer attributes.
     * options - {Object} optional hash of additional options for this
     *           instance
     */
    initialize: function (callback, options) {
    	this.callback = callback;
    	
        OpenLayers.Util.extend(this, options);
    },

    /**
     * Method: destroy
     */
    destroy: function() {
        this.callback = null;
    },
    
    /**
     * Needed as a work around for a bug in Control/DrawFeature
     */
    styles: {},
    
    /**
     * Method: createSymbolizer
     * Creates the symbolizer for a feature for a render intent.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature>} The feature to evaluate the rules
     *           of the intended style against.
     * intent  - {String} The intent determines the symbolizer that will be
     *           used to draw the feature. Well known intents are "default"
     *           (for just drawing the features), "select" (for selected
     *           features) and "temporary" (for drawing features).
     * 
     * Returns:
     * {Object} symbolizer hash
     */
    createSymbolizer: function(feature, intent) {

        if( !this.callback ) {
            return { display: 'none' };
        }

        return this.callback(feature, intent);
    },

    CLASS_NAME: "OpenLayers.StyleMapCallback"
});

};
 
})();
