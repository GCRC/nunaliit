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
 var $d = window.d3;
 if( !$d ) return;

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
	
	_display: function(){
		var $elem = this._getElem()
			.empty();
		
		// No map, no widget
		if( !this.mapControl ) return;
		
 		var $svg = $d.select('#' + this.elemId)
 			.append('svg')
 			.attr('width', this.width)
 			.attr('height', this.height)
 			.attr('viewbox', '0 0 100 100')
 			;

 		var $center = $svg.append('g')
			.attr('class','centerGroup')
			.attr('transform','translate(50,50)')
			;
 		
 		var $rotateGroup = $center.append('g')
 			.attr('class','rotateGroup')
 			.attr('transform','rotate(0)')
 			;
		
 		$rotateGroup.append('image')
 			.attr('x',0 - Math.floor(this.width / 2))
 			.attr('y',0 - Math.floor(this.height / 2))
 			.attr('width',this.width)
 			.attr('height',this.height)
 			.attr('xlink:href',this.imageLocation)
 			;
 		
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
 		
 		var _this = this;
 		var lastAngle = 0;
 		function kick(){
 			window.setTimeout(function(){
 				lastAngle += 60;
 				if( lastAngle > 180 ){
 					lastAngle -= 360;
 				};
 				_this._rotateTo(lastAngle);
 				kick();
 			},2000);
 		};
 		kick();
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
		m.isAvailable = true;
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
