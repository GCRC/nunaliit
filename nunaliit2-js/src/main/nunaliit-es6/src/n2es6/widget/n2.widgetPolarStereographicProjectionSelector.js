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

var DEFAULT_IMAGE_LOCATION = 'nunaliit2/images/arctic.png';

//--------------------------------------------------------------------------
var ProjectionSelector = $n2.Class({
	
	dispatchService: null,
	
	elemId: null,
	
	mapControl: null,
	
	width: null,
	
	height: null,
	
	imageLocation: null,
	
	imageRotation: null,
	
	selectionMap: null,
	
	currentLng: null,
	
	svgCTM: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,rootPath: './'
			,moduleDisplay: null
			,width: 100
			,height: 100
			,imageLocation: null
			,imageRotation: 0
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.rootPath = opts.rootPath;
		this.width = 1 * opts.width;
		this.height = 1 * opts.height;
		
		// Retrieve map controls if provided
		if( opts.moduleDisplay ){
			this._setMapControl(opts.moduleDisplay.mapControl);
		};
		
		if( opts.imageLocation ){
			this.imageLocation = this.rootPath + opts.imageLocation;
			this.imageRotation = opts.imageRotation;
		} else {
			this.imageLocation = this.rootPath + DEFAULT_IMAGE_LOCATION;
			this.imageRotation = 0;
		};
		
		// Wait for map control, if not yet available
		if( this.dispatchService && !this.mapControl ){
			this.dispatchService.register(DH,'reportModuleDisplay',function(m){
				if( m.moduleDisplay 
				 && m.moduleDisplay.mapControl ){
					_this._setMapControl(m.moduleDisplay.mapControl);
					_this._display();
				};
			});
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
			.addClass('n2polarStereographicProjectionSelector')
			.appendTo($container);
		
		this._display();
		
		$n2.log('ProjectionSelector', this);
	},
	
	_setMapControl: function(mapControl){
		var _this = this;
		
		this.mapControl = mapControl;
		
		if( this.mapControl 
		 && this.mapControl.map
		 && this.mapControl.map.events ){
			this.mapControl.map.events.register('changebaselayer',null,function(evt){
	        	_this._updateFromMap();
	        });
		};
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
			var lng = proj.long0 * 180 / Math.PI;
			var id = layer.id;

			var angle = 360 - lng;
			if( angle > 180 ){
				angle -= 360;
			};
			
			result[id] = {
				id: id
				,angle: angle
				,lng: lng
				,srsCode: proj.srsCode
			};
		};
		
		return result;
	},
	
	_display: function(){
		var _this = this;
		
		this._getElem().empty();
		
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
		var overlayRadius = null;
		if( this.width > this.height ){
			imageRadius = Math.floor( (this.height/2) - imagePadding );
			overlayRadius = Math.floor(this.height/2);
		} else {
			imageRadius = Math.floor( (this.width/2) - imagePadding );
			overlayRadius = Math.floor(this.width/2);
		};
		
 		var $svg = $d.select('#' + this.elemId)
 			.append('svg')
 			.attr('width', this.width)
 			.attr('height', this.height)
 			//.attr('viewbox', '0 0 100 100')
 			;
 		
 		$svg.each(function(){
 			var svgNode = this;

 			try {
	 			var svgCTM = svgNode.getScreenCTM();
	 			var inverseScreenCTM = svgCTM.inverse();
	 			_this.svgCTM = inverseScreenCTM;
 			} catch(e) {
 				// ignore
 				$n2.log('Unable to obtain SVG CTM: '+ e);
 			};
 		});

 		var $center = $svg.append('g')
			.attr('class','centerGroup')
			.attr('transform','translate('+Math.floor(this.width/2)+','+Math.floor(this.height/2)+')')
			;
 		
 		$center.append('circle')
 			.attr('r',Math.floor(this.width/2)-Math.floor(imagePadding/2))
 			.attr('fill','none')
 			.attr('stroke','#aaaaaa')
 			.attr('stroke-width',Math.floor(imagePadding/2))
 			;

 		$center.append('path')
			.attr('d','M 0 0 L -4 -8 L 4 -8 Z')
			.attr('transform','translate(0,' + imageRadius + ') rotate(180)')
			.attr('fill','#ff0000')
			.attr('stroke','#ffffff')
			.attr('stroke-width',1)
			;
 		
 		var $rotateGroup = $center.append('g')
 			.attr('class','rotateGroup')
 			.attr('transform','rotate(0)')
 			;
 		
 		$center.append('circle')
 			.attr('r',overlayRadius)
 			.attr('fill','#000000')
 			.attr('fill-opacity',0.0)
 			.attr('stroke','none')
 			.on('mouseover', function(n){
 				var e = $d.event;
 				_this._initiateMouseOver(n,e);
 			})
 			.on('mousemove', function(n){
 				var e = $d.event;
 				_this._initiateMouseMove(n,e);
 			})
 			.on('mouseout', function(n){
 				var e = $d.event;
 				_this._initiateMouseOut(n,e);
 			})
 			.on('click', function(n){
 				var e = $d.event;
 				_this._initiateMouseClick(n,e);
 			})
 			;
		
 		$rotateGroup.append('image')
 			.attr('transform','rotate('+this.imageRotation+')')
 			.attr('x',0 - imageRadius)
 			.attr('y',0 - imageRadius)
 			.attr('width',imageRadius*2)
 			.attr('height',imageRadius*2)
 			.attr('xlink:href',this.imageLocation)
 			;

 		var $arrowsGroup = $rotateGroup
 			.append('g')
 			.attr('class', 'projArrows')
 			;
 		
 		var baseLayerData = [];
 		for(var baseLayerId in this.selectionMap){
 			var info = this.selectionMap[baseLayerId];
 			baseLayerData.push(info);
 		};
 		
 		var $arrows = $arrowsGroup.selectAll('.projArrow')
 			.data(baseLayerData, function(d){ return d.id; })
 			;
 		
 		$arrows.enter()
 			.append('path')
			.attr('class','projArrow')
			.attr('transform',function(d){ return 'rotate('+d.angle+') translate(0,'+imageRadius+')'; })
			.attr('d','M 0 0 L -4 -8 L 4 -8 Z')
			.attr('fill','#000000')
			.attr('stroke','#ffffff')
			.attr('stroke-width',1)
			;
 		
 		this._updateFromMap();
	},
	
	_rotateTo: function(lng){
		this.currentLng = lng;
		
		$d.select('#' + this.elemId)
			.select('g.rotateGroup')
			.transition()
			.attr('transform', 'rotate(' + lng + ')')
			;
	},
	
	_updateFromMap: function(){
		if( this.mapControl 
		 && this.mapControl.map 
		 && this.mapControl.map.baseLayer ){
			var id = this.mapControl.map.baseLayer.id;
			
			var lng = null;
			if( this.selectionMap ){
				for(var layerId in this.selectionMap){
					var layerInfo = this.selectionMap[layerId];
					layerInfo.selected = false;
					
					if( layerId === id ){
						layerInfo.selected = true;
						lng = layerInfo.lng;
					};
				};
			};
			
			if( typeof lng === 'number' ){
				this._rotateTo(lng);
			};
		};
		
		this._updateArrowStyles();
	},
	
	_updateArrowStyles: function(){
		if( this.selectionMap ){
	 		var $arrowsGroup = $d.select('#' + this.elemId).select('g.projArrows');
	 		
	 		var baseLayerData = [];
	 		for(var baseLayerId in this.selectionMap){
	 			var info = this.selectionMap[baseLayerId];
	 			baseLayerData.push(info);
	 		};
	 		
	 		$arrowsGroup.selectAll('.projArrow')
	 			.data(baseLayerData, function(d){ return d.id; })
	 			.attr('fill', function(d){
	 				if( d.hovered ){
	 					return '#0000ff';
	 				} else if( d.selected ){
	 					return '#ff0000';
	 				} else {
	 					return '#000000';
	 				};
	 			})
	 			;
		};
	},
	
	_angleFromMouseHover: function(x,y){
		var angle = null;
		
		var effX = x - Math.floor(this.width/2);
		var effY = y - Math.floor(this.height/2);
		if( 0 == effX && 0 == effY){
			return null;
			
		} else if( 0 == effY ){
			if( effX < 0 ){
				angle = -90;
			} else {
				angle = 90;
			}
		} else {
			angle = Math.atan(effX / effY) * 180 / Math.PI;
			if( effY < 0 ){
				angle += 180;
			};
			if( angle > 180 ){
				angle = angle - 360;
			};
		};

		return angle;
	},
	
	_getSelectionFromAngle: function(lng){
		var selected = null;
		var delta = null;
		for(var id in this.selectionMap){
			var selection = this.selectionMap[id];
			
			var d = selection.lng - lng;
			d = Math.abs(d);
			if( d > 180 ){
				d = 360 - d;
			};
			
			if( !selected ){
				selected = selection;
				delta = d;
			} else if( d < delta ){
				selected = selection;
				delta = d;
			};
		};
		
		return selected;
	},
	
	_userMouseHover: function(x,y){
		var angle = this._angleFromMouseHover(x, y);
		//$n2.log('angle: '+angle);

		if( typeof angle === 'number' 
		 && typeof this.currentLng === 'number' ){
			var effLng = angle + this.currentLng;
			if( effLng > 180 ){
				effLng -= 360;
			};
			if( effLng < -180 ){
				effLng += 360;
			};
			//$n2.log('effLng: '+effLng);
			
			// Select closest info
			var selection = this._getSelectionFromAngle(effLng);
			for(var id in this.selectionMap){
				var s = this.selectionMap[id];

				if( selection === s ){
					s.hovered = true;
				} else {
					s.hovered = false;
				};
			};
			
			this._updateArrowStyles();
		};
	},
	
	_getLocationFromEvent: function(e){
		var loc = null;
		
		if( typeof e.offsetX === 'number' ){
			loc = {
				x: e.offsetX
				,y: e.offsetY
			};
		} else {
			if( this.svgCTM ){
				var m = this.svgCTM;
				var x = (e.clientX * m.a) + (e.clientY * m.c) + m.e;
				var y = (e.clientX * m.b) + (e.clientY * m.d) + m.f;

				loc = {
					x: x
					,y: y
				};
			};
		};

		//$n2.log('loc x:'+(loc ? loc.x : null)+' y:'+(loc ? loc.y : null));
		
		return loc;
	},
	
	_initiateMouseOver: function(n,e){
		var loc = this._getLocationFromEvent(e);
		if( loc ){
			//$n2.log('over x:'+loc.x+' y:'+loc.y);
			this._userMouseHover(loc.x, loc.y);
		};
	},
	
	_initiateMouseMove: function(n,e){
		var loc = this._getLocationFromEvent(e);
		if( loc ){
			//$n2.log('move x:'+loc.x+' y:'+loc.y);
			this._userMouseHover(loc.x, loc.y);
		};
	},
	
	_initiateMouseOut: function(n,e){
		// Turn off all
		for(var id in this.selectionMap){
			var s = this.selectionMap[id];
			s.hovered = false;
		};
		
		this._updateArrowStyles();
	},
	
	_initiateMouseClick: function(n,e){
		var loc = this._getLocationFromEvent(e);
		if( loc ){
			//$n2.log('click x:'+loc.x+' y:'+loc.y);
			
			var angle = this._angleFromMouseHover(loc.x, loc.y);
			//$n2.log('angle: '+angle);
	
			if( typeof angle === 'number' 
			 && typeof this.currentLng === 'number' ){
				var effLng = angle + this.currentLng;
				if( effLng > 180 ){
					effLng -= 360;
				};
				if( effLng < -180 ){
					effLng += 360;
				};
				//$n2.log('effLng: '+effLng);
				
				// Select closest info
				var selection = this._getSelectionFromAngle(effLng);
				for(var id in this.selectionMap){
					var s = this.selectionMap[id];
	
					if( selection === s ){
						if( this.mapControl 
						 && this.mapControl.setBaseLayer ){
							this.mapControl.setBaseLayer(s.id);
						};
					};
				};
			};
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	// Required library: d3
	if( !$d && window ) $d = window.d3;

	if( m.widgetType === 'polarStereographicProjectionSelector' ){
		if( $d ) {
			m.isAvailable = true;
		} else {
			$n2.log('Widget polarStereographicProjectionSelector requires d3 library');
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'polarStereographicProjectionSelector' ){
		var widgetOptions = m.widgetOptions;
		var containerId = m.containerId;
		var moduleDisplay = m.moduleDisplay;
		var config = m.config;
		
		var options = {};
		
		if( widgetOptions ){
			for(var key in widgetOptions){
				var value = widgetOptions[key];
				options[key] = value;
			};
		};

		options.containerId = containerId;
		options.moduleDisplay = moduleDisplay;
		
		if( config && config.directory ){
			options.rootPath = config.rootPath;
			
			if( config.directory ){
				options.dispatchService = config.directory.dispatchService;
			};
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
