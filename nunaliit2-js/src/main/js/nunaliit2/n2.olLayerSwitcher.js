/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };


if( typeof(OpenLayers) !== 'undefined' ) {

/**
 * Class: OpenLayers.Control.LayerSwitcher
 * The LayerSwitcher control displays a table of contents for the map. This 
 * allows the user interface to switch between BaseLasyers and to show or hide
 * Overlays. By default the switcher is shown minimized on the right edge of 
 * the map, the user may expand it by clicking on the handle.
 *
 * To create the LayerSwitcher outside of the map, pass the Id of a html div 
 * as the first argument to the constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.NunaliitLayerSwitcher = 
  OpenLayers.Class(OpenLayers.Control, {

    /**  
     * Property: layerStates 
     * {Array(Object)} Basically a copy of the "state" of the map's layers 
     *     the last time the control was drawn. We have this in order to avoid
     *     unnecessarily redrawing the control.
     */
    layerStates: null,
    

  // DOM Elements
  
    /**
     * Property: layersDiv
     * {DOMElement} 
     */
    layersDiv: null,
    
    /** 
     * Property: baseLayersDiv
     * {DOMElement}
     */
    baseLayersDiv: null,

    /** 
     * Property: baseLayers
     * {Array(Object)}
     */
    baseLayers: null,
    
    
    /** 
     * Property: dataLbl
     * {DOMElement} 
     */
    dataLbl: null,
    
    /** 
     * Property: dataLayersDiv
     * {DOMElement} 
     */
    dataLayersDiv: null,

    /** 
     * Property: dataLayers
     * {Array(Object)} 
     */
    dataLayers: null,

    /** 
     * Property: layerSwitcherDiv
     * {DOMElement} 
     */
    layerSwitcherDiv: null,

    /**
     * Property: isLayerSwitcherOn
     * {Boolean} 
     */
    isLayerSwitcherOn: false,

    /**
     * APIProperty: ascending
     * {Boolean} 
     */
    ascending: true,
    
    /**
     * Internal Property: cachedSymbols
     * {Object}
     * Dictionary of symbol paths
     */
    cachedSymbols: null,
 
    /**
     * Constructor: OpenLayers.Control.LayerSwitcher
     * 
     * Parameters:
     * options - {Object}
     */
    initialize: function(options) {
    	var _this = this;
    	
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.layerStates = [];
        this.cachedSymbols = {};
        this.simulatingClick = false;

        // Callback for base layer radio buttons
        this.__baseFn = function(e){
        	var $elem = $(this);
        	return _this._onBaseLayerChanged($elem, e);
        };

        // Callback for vector layer checkbox buttons
        this.__overlayFn = function(e){
        	var $elem = $(this);
        	return _this._onOverlayChanged($elem, e);
        };
    },

    /**
     * APIMethod: destroy 
     */    
    destroy: function() {
        
        //clear out layers info and unregister their events 
        this.clearLayersArray("base");
        this.clearLayersArray("data");
        
        this.map.events.un({
            addlayer: this.redraw,
            changelayer: this.redraw,
            removelayer: this.redraw,
            changebaselayer: this.redraw,
            scope: this
        });
        
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /** 
     * Method: setMap
     *
     * Properties:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        this.map.events.on({
            addlayer: this.redraw,
            changelayer: this.redraw,
            removelayer: this.redraw,
            changebaselayer: this.redraw,
            scope: this
        });
        this.map.events.register("buttonclick", this, this._simulateClick);
    },

    /**
     * Method: draw
     *
     * Returns:
     * {DOMElement} A reference to the DIV DOMElement containing the 
     *     switcher tabs.
     */  
    draw: function() {
		var _this = this;

		OpenLayers.Control.prototype.draw.apply(this);

        // create layout divs
        this.loadContents();

        // set isLayerSwitcherOn to false for the first time
        if(!this.outsideViewport) {
            this.toggleLayerControl();
        }

        // populate div with current info
        this.redraw();    
        
        // Do not let click events leave the control and reach the map
        // This allows the html elements to function properly
		$(this.div).click((ev) => {
            this._suppressedClick(ev)
        });

        $(this.div).keydown((ev) => {
            if (ev.key === 'Enter') {
                const theCurrentlyVisibleButton = [...this.div.children]
                    .filter(child => child.classList.contains("olButton"))
                    .find(button => button.style.display !== 'none')
                ev.target = theCurrentlyVisibleButton
                this._simulateClick(ev)
                this._suppressedClick(ev)
            }
        });

		// Suppress double click
		$(this.div).dblclick(function(e){
        	if (e.stopPropagation) {
				e.stopPropagation();
			} else {
				e.cancelBubble = true;
			};
			return false;
		});

        return this.div;
    },

      _suppressedClick: function (e) {
            if (this.simulatingClick) {
                this._onButtonClick(e);
                this.simulatingClick = false;
            }

            if (e.stopPropagation) {
                e.stopPropagation();
            } else {
                e.cancelBubble = true;
            }
            return true;
      },

    _simulateClick: function(ev) {
        this.simulatingClick = true;
        ev?.buttonElement?.click();
    },

    _onButtonClick: function(evt) {    	
        const target = $(evt.target);

        if(target.hasClass('layerTogglerDiv')) {
            this.toggleLayerControl();
        }
    },
    
    _onBaseLayerChanged: function($elem, e){
    	if( $elem.is(':checked') ) {
	    	var _layer = $elem.attr('_layer');
	        this.map.setBaseLayer( this.map.getLayer(_layer) );
    	};
    	return true;
    },
    
    _onOverlayChanged: function($elem, e){
        this.updateMap();
    },
    
    _onSvgClick: function(elemId, e){
        var $input = $('#'+elemId);

        if( false == $input.is(':disabled') ) {
            if( $input.is(':checked') ){
            	$input.removeAttr('checked');
        	} else {
        		$input.attr('checked','checked');
        	};
            this.updateMap();
        };
    },

    /** 
     * Method: clearLayersArray
     * User specifies either "base" or "data". we then clear all the
     *     corresponding listeners, the div, and reinitialize a new array.
     * 
     * Parameters:
     * layersType - {String}  
     */
    clearLayersArray: function(layersType) {
        this[layersType + "LayersDiv"].innerHTML = "";
        this[layersType + "Layers"] = [];
    },


    /**
     * Method: checkRedraw
     * Checks if the layer state has changed since the last redraw() call.
     * 
     * Returns:
     * {Boolean} The layer state changed since the last redraw() call. 
     */
    checkRedraw: function() {
        var redraw = false;
        if ( !this.layerStates.length ||
             (this.map.layers.length != this.layerStates.length) ) {
            redraw = true;
        } else {
            for (var i=0, len=this.layerStates.length; i<len; i++) {
                var layerState = this.layerStates[i];
                var layer = this.map.layers[i];
                if ( (layerState.name != layer.name) || 
                     (layerState.inRange != layer.inRange) || 
                     (layerState.id != layer.id) || 
                     (layerState.visibility != layer.visibility) ) {
                    redraw = true;
                    break;
                }    
            }
        }    
        return redraw;
    },
    
    /** 
     * Method: redraw
     * Goes through and takes the current state of the Map and rebuilds the
     *     control to display that state. Groups base layers into a 
     *     radio-button group and lists each data layer with a checkbox.
     *
     * Returns: 
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */  
    redraw: function() {
    	var _this = this;
    	
        //if the state hasn't changed since last redraw, no need 
        // to do anything. Just return the existing div.
        if (!this.checkRedraw()) { 
            return this.div; 
        } 

        //clear out previous layers 
        this.clearLayersArray("base");
        this.clearLayersArray("data");
        
        var containsOverlays = false;
        var containsBaseLayers = false;
        
        // Save state -- for checking layer if the map state changed.
        // We save this before redrawing, because in the process of redrawing
        // we will trigger more visibility changes, and we want to not redraw
        // and enter an infinite loop.
        var len = this.map.layers.length;
        this.layerStates = new Array(len);
        for (var i=0; i <len; i++) {
            var layer = this.map.layers[i];
            this.layerStates[i] = {
                'name': layer.name, 
                'visibility': layer.visibility,
                'inRange': layer.inRange,
                'id': layer.id
            };
        }    

        var layers = this.map.layers.slice();
        if (!this.ascending) { layers.reverse(); }
        for(var i=0, len=layers.length; i<len; i++) {
            var layer = layers[i];
            var baseLayer = layer.isBaseLayer;

            if (layer.displayInLayerSwitcher) {

                if (baseLayer) {
                    containsBaseLayers = true;
                } else {
                    containsOverlays = true;
                }    

                // only check a baselayer if it is *the* baselayer, check data
                //  layers if they are visible
                var checked = (baseLayer) ? (layer == this.map.baseLayer)
                                          : layer.getVisibility();
    
                // create input element
                var inputId = $n2.getUniqueId();
                var $input = $('<input/>')
                	.attr('id',inputId)
                	.attr('_layer',layer.id)
                	.attr('_layer_switcher',this.id)
                	.attr('defaultChecked',checked)
                	.val(layer.name)
                	.addClass('olButton')
                	;
                
                if( baseLayer ){
                	$input
                		.attr('type','radio')
                		.attr('name',this.id + '_baseLayers');
                } else {
                	$input
	            		.attr('type','checkbox')
	            		.attr('name',layer.name);
                };

                if( checked ) {
                	$input.attr('checked','checked');
                };

                if (!baseLayer && !layer.inRange) {
                	$input.attr('disabled','disabled');
                }
                
                var $inputDiv = $('<div class="n2layerSwitcher_input_container"></div>')
                	.append($input);
                
                // create span
                var $label = $('<label/>')
                	.attr('for',inputId)
                	.addClass('labelSpan')
                	.addClass('olButton')
                	.attr('_layer_switcher',this.id)
                	.text(layer.name)
                	;

                if (!baseLayer && !layer.inRange) {
                	$label.addClass('n2layerSwitcher_outOfRange');
                };
                
                if( baseLayer ){
                	$label.addClass('n2layerSwitcher_alignBottom');
                } else {
                	$label.addClass('n2layerSwitcher_alignBaseline');
                };
                
                var $labelDiv = $('<div class="n2layerSwitcher_label_container"></div>')
                	.append($label);
                
                // SVG Preview
                var $previewDiv = null;
                if( !baseLayer && layer.styleMap ) {
	                var g = new OpenLayers.Geometry.Point(0,0);
	                var f = new OpenLayers.Feature.Vector(g);
	                var style = layer.styleMap.createSymbolizer(f);
	                
	                // SVG
	                var svg = this._createSVGNode('svg');
	                if( svg ) {
		                this._setAttr(svg, 'version', '1.1');
		                this._setAttr(svg, 'style', 'display:inline-block');
		                this._setAttr(svg, 'width', 14);
		                this._setAttr(svg, 'height', 14);
		                this._setAttr(svg, 'viewBox', '-7 -7 14 14');
		                this._addClass(svg, 'n2layerSwitcher_svg');
		                var $svg = $(svg);
		                
		                // Geometry
		                var geom = null;
		                if( style.graphicName 
		                 && this.cachedSymbols[style.graphicName] ){
		                	geom = this._createSVGNode('path');
			                this._setAttr(geom, 'd', this.cachedSymbols[style.graphicName]);
			                
		                } else if( style.graphicName 
				         && OpenLayers.Renderer.symbol[style.graphicName] ) {
		                	var path = this._computePathFromSymbol(OpenLayers.Renderer.symbol[style.graphicName]);
		                	this.cachedSymbols[style.graphicName] = path;
		                	geom = this._createSVGNode('path');
			                this._setAttr(geom, 'd', this.cachedSymbols[style.graphicName]);
		                	
//		                } else if( 'square' === style.graphicName ) {
//		                	geom = this._createSVGNode('path');
//			                this._setAttr(geom, 'd', 'M -4.4 -4.4 L -4.4 4.4 L 4.4 4.4 L 4.4 -4.4 Z');
		                
		                } else {
			                geom = this._createSVGNode('circle');
			                this._setAttr(geom, 'r', 5);
		                };
		                if( geom ) {
			                for(var name in style){
			                	var styleValue = style[name];
			                	
			                	if( 'fillColor' === name ){
				                	this._setAttr(geom, 'fill', styleValue);
				                	
			                	} else if( 'fillOpacity' === name ){
				                	this._setAttr(geom, 'fill-opacity', styleValue);
				                	
			                	} else if( 'strokeColor' === name ){
				                	this._setAttr(geom, 'stroke', styleValue);
				                	
			                	} else if( 'strokeOpacity' === name ){
				                	this._setAttr(geom, 'stroke-opacity', styleValue);
				                	
			                	} else if( 'strokeWidth' === name ){
				                	this._setAttr(geom, 'stroke-width', styleValue);
				                	
			                	} else if( 'strokeLinecap' === name ){
				                	this._setAttr(geom, 'stroke-linecap', styleValue);
		
			                	} else {
			                		this._setAttr(geom, name, styleValue);
			                	};
			                };
			                svg.appendChild(geom);
			                
			                geom.onclick = createSvgClickHandler(inputId);
		                };
		                
		                $previewDiv = $('<div class="n2layerSwitcher_preview_container"></div>')
		                	.append($svg);
	                };
                };
                
                var groupArray = (baseLayer) ? this.baseLayers
                                             : this.dataLayers;
                groupArray.push({
                    'layer': layer,
                    'inputElem': $input,
                    'labelSpan': $label
                });
                                                     
    
                var groupDiv = (baseLayer) ? this.baseLayersDiv
                                           : this.dataLayersDiv;
                var $div = $('<div class="n2layerSwitcher_layer"/>')
                	.append($inputDiv)
                	.append($labelDiv)
                	.appendTo( $(groupDiv) );
                if( $previewDiv ){
                	$div.append($previewDiv);
                };
                
                if( baseLayer ){
                	$input.change(this.__baseFn);
                } else {
                	$input.change(this.__overlayFn);
                };
            };
        };

        // if no overlays, dont display the overlay label
        this.dataLbl.style.display = (containsOverlays) ? "" : "none";        
        
        // if no baselayers, dont display the baselayer label
        this.baseLbl.style.display = (containsBaseLayers) ? "" : "none";        

        return this.div;
        
        function createSvgClickHandler(elemId){
        	return function(e){
        		return _this._onSvgClick(elemId,e);
        	};
        };
    },
    
    _createSVGNode: function(type, id) {
        var node = null;
        if( document.createElementNS ) {
	        node = document.createElementNS('http://www.w3.org/2000/svg', type);
	        if (id) {
	            node.setAttributeNS(null, 'id', id);
	        };
        };
        return node;    
    },
    
    _setAttr: function(node, name, value) {
    	node.setAttributeNS(null, name, value);
    },
    
    _addClass: function(elem, className) {
    	var classNames = [];

    	var currentClasses = elem.getAttribute('class') || '';
    	if( currentClasses ) {
    		classNames = currentClasses.split(' ');
    	};

    	if( classNames.indexOf(className) < 0 ){
        	classNames.push(className);
    	};
    	
    	elem.setAttribute('class',classNames.join(' '));
    },

    /** 
     * Method: updateMap
     * Cycles through the loaded data and base layer input arrays and makes
     *     the necessary calls to the Map object such that that the map's 
     *     visual state corresponds to what the user has selected in 
     *     the control.
     */
    updateMap: function() {

        // set the newly selected base layer        
        for(var i=0, len=this.baseLayers.length; i<len; i++) {
            var layerEntry = this.baseLayers[i];
            if (layerEntry.inputElem.is(':checked')) {
                this.map.setBaseLayer(layerEntry.layer, false);
            };
        };

        // set the correct visibilities for the overlays
        for(var i=0, len=this.dataLayers.length; i<len; i++) {
            var layerEntry = this.dataLayers[i];
            var checked = layerEntry.inputElem.is(':checked');
            layerEntry.layer.setVisibility(checked);
        };

    },

    /** 
     * Method: toggleLayerControl
     * Hide all the contents of the control, shrink the size, 
     *     add the maximize icon
     *
     * Parameters:
     * e - {Event} 
     */
    toggleLayerControl: function(e) {

        this.layersDiv.style.display = !this.isLayerSwitcherOn ? "none" : "";
        this.isLayerSwitcherOn = !this.isLayerSwitcherOn;

        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },
    
    /** 
     * Method: loadContents
     * Set up the labels and divs for the control
     */
    loadContents: function() {
        // layer switcher button div
        var img = OpenLayers.Util.getImageLocation('layer-switcher-maximize.png');
        this.layerSwitcherDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MaximizeDiv", 
                                    null, 
                                    null, 
                                    img, 
                                    "absolute");
        OpenLayers.Element.addClass(this.layerSwitcherDiv, "layerTogglerDiv olButton");
        this.layerSwitcherDiv.setAttribute("tabindex", "0");
        this.div.appendChild(this.layerSwitcherDiv);

        // layers list div        
        this.layersDiv = document.createElement("div");
        this.layersDiv.id = this.id + "_layersDiv";
        OpenLayers.Element.addClass(this.layersDiv, "layersDiv");

        this.events = new OpenLayers.Events(this, this.layersDiv, null, false);
        this.events.on({
            "touchstart": (ev) => {
                ev.stopPropagation()
            },
            "touchmove": (ev) => {
                ev.stopPropagation()
            },
            scope: this
        });

        this.baseLbl = document.createElement("div");
        this.baseLbl.innerHTML = _loc("Base Layer");
        OpenLayers.Element.addClass(this.baseLbl, "baseLbl");
        
        this.baseLayersDiv = document.createElement("div");
        OpenLayers.Element.addClass(this.baseLayersDiv, "baseLayersDiv");

        this.dataLbl = document.createElement("div");
        this.dataLbl.innerHTML = _loc("Overlays");
        OpenLayers.Element.addClass(this.dataLbl, "dataLbl");
        
        this.dataLayersDiv = document.createElement("div");
        OpenLayers.Element.addClass(this.dataLayersDiv, "dataLayersDiv");

        if (this.ascending) {
            this.layersDiv.appendChild(this.baseLbl);
            this.layersDiv.appendChild(this.baseLayersDiv);
            this.layersDiv.appendChild(this.dataLbl);
            this.layersDiv.appendChild(this.dataLayersDiv);
        } else {
            this.layersDiv.appendChild(this.dataLbl);
            this.layersDiv.appendChild(this.dataLayersDiv);
            this.layersDiv.appendChild(this.baseLbl);
            this.layersDiv.appendChild(this.baseLayersDiv);
        }    
 
        this.div.appendChild(this.layersDiv);
    },
    
    /** 
     * Method: _computePathFromSymbol
     * Given an OpenLayers symbol (array of points, which are tuples of x,y coordinates),
     * create a SVG path with an approximate area of 30 (area of a circle with a radius of 5)
     * Example for symbol: [0,0, 1,0, 1,1, 0,1, 0,0]
     * Examplke fo SVG Path: 'M -4.4 -4.4 L -4.4 4.4 L 4.4 4.4 L 4.4 -4.4 Z'
     */
    _computePathFromSymbol: function(symbol){
    	var area = 0,
    	 minx = undefined,
    	 maxx = undefined,
    	 miny = undefined,
    	 maxy = undefined;

    	// Figure out bounding box
    	for(var i=0,e=symbol.length; i<e; i=i+2){
    		var x = symbol[i];
    		var y = symbol[i+1];
    		
    		if( typeof minx === 'undefined' ){
    			minx = x;
    		} else if( minx > x ){
    			minx = x;
    		};
    		
    		if( typeof maxx === 'undefined' ){
    			maxx = x;
    		} else if( maxx < x ){
    			maxx = x;
    		};
    		
    		if( typeof miny === 'undefined' ){
    			miny = y;
    		} else if( miny > y ){
    			miny = y;
    		};
    		
    		if( typeof maxy === 'undefined' ){
    			maxy = y;
    		} else if( maxy < y ){
    			maxy = y;
    		};
    	};
    	
    	// Compute path, recentering the symbol and adjusting the area so
    	// it fits a bounding box of 10x10
    	var path = [],
    	 transx = (minx+maxx)/2,
    	 transy = (miny+maxy)/2,
    	 width = maxx-minx,
    	 height = maxy-miny,
    	 factor = (width > height) ? width / 10 : height / 10;
    	if( factor <= 0 ){
    		factor = 1;
    	};
    	for(var i=0,e=symbol.length; i<e; i=i+2){
    		var x = symbol[i];
    		var y = symbol[i+1];

    		var effX = (x-transx)/factor;
    		var effY = (y-transy)/factor;
    		
    		// Round to .01
    		effX = Math.floor(effX * 100) / 100;
    		effY = Math.floor(effY * 100) / 100;
    		
    		if( 0 === i ){
        		path.push('M ');
    		} else {
        		path.push('L ');
    		};
    		
    		path.push(''+effX);
    		path.push(' '+effY+' ');
    	};
    	path.push('Z');
    	
    	return path.join('');
    },
    
    CLASS_NAME: "OpenLayers.Control.LayerSwitcher"
});

}; // if(typeof(OpenLayers) !== 'undefined')

})(jQuery,nunaliit2);
