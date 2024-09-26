/*
Copyright (c) 2024, Geomatics and Cartographic Research Centre, Carleton 
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

; (function ($n2) {
    "use strict"

    if (typeof (OpenLayers) !== 'undefined' && OpenLayers.Handler) {

        OpenLayers.Control.MapAndControlsKeyboardControls = OpenLayers.Class(OpenLayers.Control.KeyboardDefaults, {
            initialize: function (layers, options) {
                OpenLayers.Control.prototype.initialize.apply(this, [options]);
                if (OpenLayers.Util.isArray(layers)) {
                    this.layers = layers
                }
                else {
                    this.layers = [layers]
                }
                if (options.dispatch) this.dispatch = options.dispatch
                this.DH = 'MapAndControlsKeyboardControls'
            },

            selectAtMapCenter: function (position) {
                // Select everything in the bounds
                let docs = []
                var bounds = new OpenLayers.Bounds(
                    position.lon + 100000, position.lat + 100000, position.lon - 100000, position.lat - 100000
                );
                var layers = this.layers || [this.layer];
                var layer;
                for (var l = 0; l < layers.length; ++l) {
                    layer = layers[l];
                    for (var i = 0, len = layer.features.length; i < len; ++i) {
                        var feature = layer.features[i];
                        if (!feature.getVisibility()) {
                            continue;
                        }
                        if (bounds.toGeometry().intersects(feature.geometry)) {
                            // layer.events.triggerEvent("featureselected", {feature: feature});
                            const cluster = feature.cluster
                            if (cluster) {
                                docs = docs.concat(cluster.map(v => v.data._id))
                            }
                            else {
                                docs.push(feature.data._id)
                            }
                        }
                    }
                }
                this.dispatch.send(this.DH, {
                    type: 'userSelect',
                    docIds: docs
                })
            },

            defaultKeyPress: function (evt) {
                var size, handled = true;

                var target = OpenLayers.Event.element(evt);
                if (target &&
                    (target.tagName == 'INPUT' ||
                        target.tagName == 'TEXTAREA' ||
                        target.tagName == 'SELECT')) {
                    return;
                }

                switch (evt.keyCode) {
                    case OpenLayers.Event.KEY_LEFT:
                        this.map.pan(-this.slideFactor, 0);
                        break;
                    case OpenLayers.Event.KEY_RIGHT:
                        this.map.pan(this.slideFactor, 0);
                        break;
                    case OpenLayers.Event.KEY_UP:
                        this.map.pan(0, -this.slideFactor);
                        break;
                    case OpenLayers.Event.KEY_DOWN:
                        this.map.pan(0, this.slideFactor);
                        break;
                    case OpenLayers.Event.KEY_RETURN:
                        this.selectAtMapCenter(this.map.getCenter())
                        break;

                    case 33: // Page Up. Same in all browsers.
                        size = this.map.getSize();
                        this.map.pan(0, -0.75 * size.h);
                        break;
                    case 34: // Page Down. Same in all browsers.
                        size = this.map.getSize();
                        this.map.pan(0, 0.75 * size.h);
                        break;
                    case 35: // End. Same in all browsers.
                        size = this.map.getSize();
                        this.map.pan(0.75 * size.w, 0);
                        break;
                    case 36: // Home. Same in all browsers.
                        size = this.map.getSize();
                        this.map.pan(-0.75 * size.w, 0);
                        break;

                    case 43:  // +/= (ASCII), keypad + (ASCII, Opera)
                    case 61:  // +/= (Mozilla, Opera, some ASCII)
                    case 187: // +/= (IE)
                    case 107: // keypad + (IE, Mozilla)
                        this.map.zoomIn();
                        break;
                    case 45:  // -/_ (ASCII, Opera), keypad - (ASCII, Opera)
                    case 109: // -/_ (Mozilla), keypad - (Mozilla, IE)
                    case 189: // -/_ (IE)
                    case 95:  // -/_ (some ASCII)
                        this.map.zoomOut();
                        break;
                    default:
                        handled = false;
                }
                if (handled) {
                    // prevent browser default not to move the page
                    // when moving the page with the keyboard
                    OpenLayers.Event.stop(evt);
                }
            }
        })


    }

})(nunaliit2)