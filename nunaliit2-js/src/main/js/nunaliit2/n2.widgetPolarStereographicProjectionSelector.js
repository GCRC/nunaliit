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

;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.widgetPolarStereographicProjectionSelector'
 ;

// Required library: d3
var $d = null;
if( window ){ $d = window.d3; };

var DEFAULT_IMAGE_LOCATION = 'nunaliit2/images/arctic.svg';

//--------------------------------------------------------------------------
var ProjectionSelector = $n2.Class({
	
	dispatchService: null,
	
	elemId: null,
	
	mapControl: null,
	
	width: null,
	
	height: null,
	
	imageLocation: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			contentId: null
			,containerId: null
			,dispatchService: null
			,rootPath: './'
			,moduleDisplay: null
			,width: 100
			,height: 100
			,imageLocation: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.rootPath = opts.rootPath;
		this.width = 1 * opts.width;
		this.height = 1 * opts.height;
		
		// Retrieve map controls if provided
		if( opts.moduleDisplay ){
			this.mapControl = opts.moduleDisplay.mapControl;
		};
		
		if( opts.imageLocation ){
			this.imageLocation = this.rootPath + opts.imageLocation;
		} else {
			this.imageLocation = this.rootPath + DEFAULT_IMAGE_LOCATION;
		};
		
		// Wait for map control, if not yet available
		if( this.dispatchService && !this.mapControl ){
			this.dispatchService.register(DH,'reportModuleDisplay',function(m){
				if( m.moduleDisplay 
				 && m.moduleDisplay.mapControl ){
					_this.mapControl = m.moduleDisplay.mapControl;
					_this._display();
				};
			});
		};

		// Get container
		var containerId = opts.containerId;
		if( !containerId ){
			containerId = opts.contentId;
		};
		var $container = $('#'+containerId);
		
		this.elemId = $n2.getUniqueId();
		
		$('<div>')
			.attr('id',this.elemId)
			.addClass('n2polarStereographicProjectionSelector')
			.appendTo($container);
		
		this._display();
		
		$n2.log('ProjectionSelector', this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_getBaseLayers: function(mapControl){
		var result = [];
		
		if( mapControl && mapControl.map && mapControl.map.layers ){
			for(var i=0,e=mapControl.map.layers.length; i<e; ++i){
				var layer = mapControl.map.layers[i];
				if( layer.isBaseLayer ){
					result.push(layer);
				};
			};
		};
		
		return result;
	},
	
	_selectPolarStereographicLayers: function(layers){
		var result = [];
		
		for(var i=0,e=layers.length; i<e; ++i){
			var layer = layers[i];
			var projection = layer.projection;
			if( projection 
			 && projection.proj ){
				if( 'laea' === projection.proj.projName 
				 && typeof projection.proj.long0 === 'number'){
					result.push(layer);
				};
			};
		};
		
		return result;
	},
	
	_createSelectionMap: function(layers){
		var result = {};
		
		for(var i=0,e=layers.length; i<e; ++i){
			var layer = layers[i];
			var proj = layer.projection.proj;
			var long = proj.long0 * 180 / Math.PI;
			var id = layer.id;

			var angle = 360 - long;
			if( angle > 180 ){
				angle -= 360;
			};
			
			result[id] = {
				angle: angle
				,long: long
				,srsCode: proj.srsCode
			};
		};
		
		return result;
	},
	
	_display: function(){
		var $elem = this._getElem()
			.empty();
		
		// No map, no widget
		if( !this.mapControl ) return;
		
		// Extract all base layers
		var baseLayers = this._getBaseLayers(this.mapControl);
		var polarLayers = this._selectPolarStereographicLayers(baseLayers);
		
		if( baseLayers.length < 1 ){
			$n2.log('ProjectionSelector: no base layer');
			return;
		} else if( baseLayers.length != polarLayers.length ){
			$n2.log('ProjectionSelector: not all base layers are polar stereographic');
			return;
		};
		
		this.selectionMap = this._createSelectionMap(polarLayers);
		
		var imagePadding = 10;
		var imageRadius = null;
		if( this.width > this.height ){
			imageRadius = Math.floor( (this.height/2) - imagePadding );
		} else {
			imageRadius = Math.floor( (this.width/2) - imagePadding );
		};
		
 		var $svg = $d.select('#' + this.elemId)
 			.append('svg')
 			.attr('width', this.width)
 			.attr('height', this.height)
 			.attr('viewbox', '0 0 100 100')
 			;

 		var $center = $svg.append('g')
			.attr('class','centerGroup')
			.attr('transform','translate('+Math.floor(this.width/2)+','+Math.floor(this.height/2)+')')
			;
 		
 		var $rotateGroup = $center.append('g')
 			.attr('class','rotateGroup')
 			.attr('transform','rotate(0)')
 			;
		
 		$rotateGroup.append('image')
 			.attr('x',0 - imageRadius)
 			.attr('y',0 - imageRadius)
 			.attr('width',imageRadius*2)
 			.attr('height',imageRadius*2)
 			.attr('xlink:href',this.imageLocation)
 			;
 		
 		for(var baseLayerId in this.selectionMap){
 			var info = this.selectionMap[baseLayerId];
 			var long = info.angle;
 			
 			$rotateGroup.append('path')
 				.attr('transform','rotate('+long+') translate(0,'+imageRadius+')')
 				.attr('d','M 0 0 L -4 -8 L 4 -8 Z')
 				.attr('fill','#000000')
 				.attr('stroke','#ffffff')
 				.attr('stroke-width',1)
 				;
 		};
 		
//        var svg = $n2.svg.createSVGNode('svg');
//        if( svg ) {
//        	$n2.svg.setAttr(svg, 'version', '1.1');
//        	$n2.svg.setAttr(svg, 'style', 'display:inline-block');
//        	$n2.svg.setAttr(svg, 'width', 100);
//        	$n2.svg.setAttr(svg, 'height', 100);
//        	$n2.svg.setAttr(svg, 'viewBox', '0 0 100 100');
//        	
//        	$(svg).appendTo($elem);
//
//        	var image = $n2.svg.createSVGNode('image');
//        	$n2.svg.setAttr(image, 'x', 0);
//        	$n2.svg.setAttr(image, 'y', 0);
//        	$n2.svg.setAttr(image, 'width', 100);
//        	$n2.svg.setAttr(image, 'height', 100);
//        	$n2.svg.setAttrNS(image, $n2.svg.xlinkNs, 'xlink:href', this.rootPath + DEFAULT_IMAGE_LOCATION);
//        	
//        	$(image).appendTo($(svg));
//        };

 		
//		$('img')
//			.attr('src',this.rootPath + DEFAULT_IMAGE_LOCATION)
//			.attr('width',100)
//			.attr('height',100)
//			.appendTo($elem);
 		
// 		var _this = this;
// 		var lastAngle = 0;
// 		function kick(){
// 			window.setTimeout(function(){
// 				lastAngle += 60;
// 				if( lastAngle > 180 ){
// 					lastAngle -= 360;
// 				};
// 				_this._rotateTo(lastAngle);
// 				kick();
// 			},2000);
// 		};
// 		kick();
	},
	
	_rotateTo: function(angle){
		$d.select('#' + this.elemId)
			.select('g.rotateGroup')
			.transition()
			.attr('transform', 'rotate(' + angle + ')')
			;
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'polarStereographicProjectionSelector' ){
		var available = true;
		
		 if( !$d ) {
			 available = false;
			 $n2.log('Widget polarStereographicProjectionSelector requires d3 library');
		 };

		m.isAvailable = available;
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'polarStereographicProjectionSelector' ){
		var widgetOptions = m.widgetOptions;
		var contentId = m.contentId;
		var containerId = m.containerId;
		var moduleDisplay = m.moduleDisplay;
		var config = m.config;
		
		var options = {
			contentId: contentId
			,containerId: containerId
			,moduleDisplay: moduleDisplay
		};
		
		if( config && config.directory ){
			options.rootPath = config.rootPath;
			
			if( config.directory ){
				options.dispatchService = config.directory.dispatchService;
			};
		};
		
		if( widgetOptions ){
			if( widgetOptions.sourceModelId ) options.sourceModelId = widgetOptions.sourceModelId;
		};
		
		new ProjectionSelector(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetPolarStereographicProjectionSelector = {
	ProjectionSelector: ProjectionSelector
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
