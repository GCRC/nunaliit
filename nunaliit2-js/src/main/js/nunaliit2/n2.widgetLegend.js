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

;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.widgetLegend'
 ;

//--------------------------------------------------------------------------
var LegendWidget = $n2.Class('LegendWidget',{
	
	dispatchService: null,
	
	sourceCanvasName: null,
	
	elemId: null,
	
	stylesInUse: null,
	
	cachedSymbols: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,sourceCanvasName: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.sourceCanvasName = opts.sourceCanvasName;

		this.stylesInUse = null;
		this.cachedSymbols = {};

		if( typeof this.sourceCanvasName !== 'string' ){
			throw new Error('sourceCanvasName must be specified');
		};
		
		// Set up model listener
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			this.dispatchService.register(DH,'canvasReportStylesInUse',f);
			
			// Obtain current styles in use
			var msg = {
				type: 'canvasGetStylesInUse'
				,canvasName: this.sourceCanvasName
			};
			this.dispatchService.synchronousCall(DH,msg);
			this.stylesInUse = msg.stylesInUse;
		};

		// Get container
		var containerId = opts.containerId;
		if( !containerId ){
			throw new Error('containerId must be specified');
		};
		var $container = $('#'+containerId);
		
		this.elemId = $n2.getUniqueId();
		
		$('<div>')
			.attr('id',this.elemId)
			.addClass('n2widgetLegend')
			.appendTo($container);
		
		$n2.log(this._classname, this);

		this._refresh();
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},

	_handle: function(m, addr, dispatcher){
		var _this = this;

		if( 'canvasReportStylesInUse' === m.type ){
			if( m.canvasName === this.sourceCanvasName ){
				this.stylesInUse = m.stylesInUse;
				this._refresh();
			};
		};
	},
	
	_refresh: function(){
		var _this = this;

		var $elem = this._getElem();
		
		$elem.empty();
		
		// Make a map of styles by label
		var stylesByLabel = {};
		var atLeastOne = false;
		for(var styleId in this.stylesInUse){
			var styleInfo = _this.stylesInUse[styleId];
			var style = styleInfo.style;
			if( style.label ){
				var effectiveLabel = _loc( style.label );
				var labelInfo = stylesByLabel[effectiveLabel];
				if( !labelInfo ){
					labelInfo = {};
					stylesByLabel[effectiveLabel] = labelInfo;
				};
				labelInfo[styleId] = styleInfo;
				atLeastOne = true;
			};
		};
		
		// If at least one style with label, then must display
		if( atLeastOne ){
			var $outer = $('<div>')
				.addClass('n2widgetLegend_outer')
				.appendTo($elem);

			var labelNames = [];
			for(var labelName in stylesByLabel){
				labelNames.push(labelName);
			};
			labelNames.sort();
			
			labelNames.forEach(function(labelName){
				var labelInfo = stylesByLabel[labelName];

				var $div = $('<div>')
					.addClass('n2widgetLegend_labelEntry')
					.appendTo($outer);
			
				$('<div>')
					.addClass('n2widgetLegend_labelName')
					.text(labelName)
					.appendTo($div);
				
				var styleIds = [];
				for(var styleId in labelInfo){
					styleIds.push(styleId);
				};
				styleIds.sort();
				
				styleIds.forEach(function(styleId){
					var styleInfo = labelInfo[styleId];
					var style = styleInfo.style;

					if( styleInfo.point ){
						var $preview = $('<div>')
							.addClass('n2widgetLegend_preview n2widgetLegend_previewPoint')
							.attr('n2-style-id',style.id)
							.appendTo($div);
						_this._insertSvgPreviewPoint($preview, style, styleInfo.point);
					};

					if( styleInfo.line ){
						var $preview = $('<div>')
							.addClass('n2widgetLegend_preview n2widgetLegend_previewLine')
							.attr('n2-style-id',style.id)
							.appendTo($div);
						_this._insertSvgPreviewLine($preview, style, styleInfo.line);
					};

					if( styleInfo.polygon ){
						var $preview = $('<div>')
							.addClass('n2widgetLegend_preview n2widgetLegend_previewPolygon')
							.attr('n2-style-id',style.id)
							.appendTo($div);
						_this._insertSvgPreviewPolygon($preview, style, styleInfo.polygon);
					};
				});
			});
		};
	},

	_insertSvgPreviewPoint: function($parent, style, context_){
		var _this = this;

        var context = {};
        for(var key in context_){
        	var value = context_[key];
        	
        	if( 'n2_hovered' === key ){
        		context[key] = false;
        	} else if( 'n2_selected' === key ){
        		context[key] = false;
        	} else if( 'n2_found' === key ){
        		context[key] = false;
        	} else {
        		context[key] = value;
        	};
        };
        
        var symbolizer = style.getSymbolizer(context);
        
        // SVG
        var svg = this._createSVGNode('svg');
        if( svg ) {
            this._setAttr(svg, 'version', '1.1');
            this._setAttr(svg, 'viewBox', '-7 -7 14 14');
            this._addClass(svg, 'n2widgetLegend_svg');
            var $svg = $(svg);
            
            // Geometry
            var graphicName = symbolizer.getSymbolValue('graphicName',context);
            var geom = null;
            if( graphicName 
             && this.cachedSymbols[graphicName] ){
            	geom = this._createSVGNode('path');
                this._setAttr(geom, 'd', this.cachedSymbols[graphicName]);
                
            } else if( graphicName 
	         && OpenLayers.Renderer.symbol[graphicName] ) {
            	var path = this._computePathFromSymbol(OpenLayers.Renderer.symbol[graphicName]);
            	this.cachedSymbols[graphicName] = path;
            	geom = this._createSVGNode('path');
                this._setAttr(geom, 'd', this.cachedSymbols[graphicName]);
            
            } else {
                geom = this._createSVGNode('circle');
                this._setAttr(geom, 'r', 5);
            };
            if( geom ) {
            	symbolizer.forEachSymbol(function(name,value){
            		if( 'r' === name ){
            			// Do not adjust radius
            		} else if( 'fill-opacity' === name ) {
            			// Make opacity more pronounced
            			var effectiveValue = (value * 0.5) + 0.5;
                		_this._setAttr(geom, name, effectiveValue);
            		} else {
                		_this._setAttr(geom, name, value);
            		};
            	},context);

                svg.appendChild(geom);
            };
            
            $parent.append($svg);
        };
	},

	_insertSvgPreviewLine: function($parent, style, context_){
		var _this = this;

        var context = {};
        for(var key in context_){
        	var value = context_[key];
        	
        	if( 'n2_hovered' === key ){
        		context[key] = false;
        	} else if( 'n2_selected' === key ){
        		context[key] = false;
        	} else if( 'n2_found' === key ){
        		context[key] = false;
        	} else {
        		context[key] = value;
        	};
        };
        
        var symbolizer = style.getSymbolizer(context);
        
        // SVG
        var svg = this._createSVGNode('svg');
        if( svg ) {
            this._setAttr(svg, 'version', '1.1');
            this._setAttr(svg, 'viewBox', '-7 -7 14 14');
            this._addClass(svg, 'n2widgetLegend_svg');
            var $svg = $(svg);
            
            // Geometry
            var geom = this._createSVGNode('line');
            this._setAttr(geom, 'x1', -5);
            this._setAttr(geom, 'y1', 0);
            this._setAttr(geom, 'x2', 5);
            this._setAttr(geom, 'y2', 0);
            if( geom ) {
            	symbolizer.forEachSymbol(function(name,value){
       				_this._setAttr(geom, name, value);
            	},context);

                svg.appendChild(geom);
            };
            
            $parent.append($svg);
        };
	},

	_insertSvgPreviewPolygon: function($parent, style, context_){
		var _this = this;

        var context = {};
        for(var key in context_){
        	var value = context_[key];
        	
        	if( 'n2_hovered' === key ){
        		context[key] = false;
        	} else if( 'n2_selected' === key ){
        		context[key] = false;
        	} else if( 'n2_found' === key ){
        		context[key] = false;
        	} else {
        		context[key] = value;
        	};
        };
        
        var symbolizer = style.getSymbolizer(context);
        
        // SVG
        var svg = this._createSVGNode('svg');
        if( svg ) {
            this._setAttr(svg, 'version', '1.1');
            this._setAttr(svg, 'viewBox', '-7 -7 14 14');
            this._addClass(svg, 'n2widgetLegend_svg');
            var $svg = $(svg);
            
            // Geometry
            var geom = this._createSVGNode('path');
            this._setAttr(geom, 'd', 'M -5 -5 L -2.5 5 L 5 5 L 2.5 -5 Z');
            if( geom ) {
            	symbolizer.forEachSymbol(function(name,value){
        			if( 'fill-opacity' === name ) {
	        			// Make opacity more pronounced
	        			var effectiveValue = (value * 0.5) + 0.5;
	            		_this._setAttr(geom, name, effectiveValue);
        			} else {
        				_this._setAttr(geom, name, value);
        			};
            	},context);

                svg.appendChild(geom);
            };
            
            $parent.append($svg);
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
    }
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'legendWidget' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'legendWidget' ){
		var widgetOptions = m.widgetOptions;
		var containerId = m.containerId;
		var config = m.config;
		
		var options = {};
		
		if( widgetOptions ){
			for(var key in widgetOptions){
				var value = widgetOptions[key];
				options[key] = value;
			};
		};

		options.containerId = containerId;
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
		};
		
		new LegendWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetLegend = {
	LegendWidget: LegendWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
