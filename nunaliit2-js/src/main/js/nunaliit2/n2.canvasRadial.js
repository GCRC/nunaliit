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
 ,DH = 'n2.radialCanvas'
 ;
 
// Required library: d3
var $d = window.d3;
if( !$d ) return;

//--------------------------------------------------------------------------
// Fish eye distortion
function RadialFishEye(){
	var radius = 10,
		distortion = 2,
		k0,
		k1,
		focusAngle = null,
		angleAttribute = 'x';
	
	function fisheye(d) {
		var pointAngle = d[angleAttribute];
		
		if( null === focusAngle ){
			return {x: pointAngle, z: 1};

		} else {
			var dx = pointAngle - focusAngle;
			
			if( dx > 180 ) dx -= 360;
			if( dx < -180 ) dx += 360;
			
			var dd = Math.sqrt(dx * dx);
			if (!dd || dd >= radius) return {x: pointAngle, z: 1};
			var k = k0 * (1 - Math.exp(-dd * k1)) / dd * .75 + .25;
			
			var effAngle = focusAngle + (dx * k);
			if( effAngle < 0 ) effAngle += 360;
			if( effAngle > 360 ) effAngle -= 360;
			
			return {
				x: effAngle
				,z: Math.min(k, 10)
			};
		};
 	}

	function rescale() {
		k0 = Math.exp(distortion);
		k0 = k0 / (k0 - 1) * radius;
		k1 = distortion / radius;
		return fisheye;
	}

	fisheye.radius = function(_) {
		if (!arguments.length) return radius;
		radius = +_;
		return rescale();
	};

	fisheye.distortion = function(_) {
		if (!arguments.length) return distortion;
		distortion = +_;
		return rescale();
	};

	fisheye.angle = function(_) {
		if (!arguments.length) return focusAngle;
		focusAngle = _;
		return fisheye;
	};

	fisheye.angleAttribute = function(_) {
		if (!arguments.length) return angleAttribute;
		angleAttribute = _;
		return fisheye;
	};
	
	rescale();
	
	return fisheye;
};

// --------------------------------------------------------------------------
var RadialCanvas = $n2.Class({

	canvasId: null,
 	
	interactionId: null,
 	
	svgId: null,
 	
	modelId: null,
 	
	dispatchService: null,

	sourceModelId: null,
 	
	moduleDisplay: null,
 	
	background: null,
	
	toggleSelection: null,
	
	line: null,
	
	magnify: null,
	
	magnifyThresholdCount: null,
 	
	styleRules: null,

	nodesById: null,
	
	sortedNodes: null,

	linksById: null,
	
	elementGenerator: null,
 	
	currentMouseOver: null,

	lastElementIdSelected: null,
 	
	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,interactionId: null
			,config: null
			,moduleDisplay: null
			,sourceModelId: null
			,background: null
			,magnify: null
			,styleRules: null
			,toggleSelection: true
			,elementGeneratorType: 'default'
			,elementGeneratorOptions: null
			,elementGenerator: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
 		
		var _this = this;
 	
		this.canvasId = opts.canvasId;
		this.interactionId = opts.interactionId;
		this.moduleDisplay = opts.moduleDisplay;
		this.sourceModelId = opts.sourceModelId;
		this.background = opts.background;
		this.toggleSelection = opts.toggleSelection;
		this.elementGenerator = opts.elementGenerator;
 		
		this.modelId = $n2.getUniqueId('radialCanvas');
 		
		this.styleRules = $n2.styleRule.loadRulesFromObject(opts.styleRules);
 		
		var config = opts.config;
		if( config ){
			if( config.directory ){
				this.dispatchService = config.directory.dispatchService;
			};
		};

 		this.nodesById = {};
 		this.sortedNodes = [];
 		this.linksById = {};
 		this.currentMouseOver = null;
 		this.lastElementIdSelected = null;
 		this.focusInfo = null;
 		this.selectInfo = null;
 		this.magnifyThresholdCount = null;

 		// Element generator
 		if( !this.elementGenerator ){
 			// If not defined, use the one specified by type
 	 		this.elementGenerator = $n2.canvasElementGenerator.CreateElementGenerator({
 	 			type: opts.elementGeneratorType
 	 			,options: opts.elementGeneratorOptions
 	 			,config: opts.config
 	 		});
 		};
 		if( this.elementGenerator ){
			this.elementGenerator.setElementsChangedListener(function(added, updated, removed){
				_this._elementsChanged(added, updated, removed);
			});
			this.elementGenerator.setIntentChangedListener(function(updated){
				_this._intentChanged(updated);
			});
 		};
 		
 		// Register to events
 		if( this.dispatchService ){
 			var f = function(m){
 				_this._handleDispatch(m);
 			};
 			
 			this.dispatchService.register(DH,'modelGetInfo',f);
 			this.dispatchService.register(DH,'modelStateUpdated',f);
 		};
 		
 		this.line = d3.svg.line.radial()
	 	    //.interpolate("bundle")
 			.interpolate("basis")
	 	    .tension(.85)
	 	    .radius(function(d) { return d.y; })
	 	    .angle(function(d) { return d.x / 180 * Math.PI; });
 		
 		// Set-up magnification
 		var magnifyOptions = $n2.extend({
 			radius: 10
 			,distortion: 2
 			,thresholdCount: 120
 		},opts.magnify);
 		this.magnify = RadialFishEye()
			.angleAttribute('orig_x')
 			;
 		for(var optionName in magnifyOptions){
 			var value = magnifyOptions[optionName];
 			
 			if( 'radius' === optionName 
 			 && typeof value === 'number' ){
 				this.magnify.radius(value);
 			};

 			if( 'distortion' === optionName 
 			 && typeof value === 'number' ){
 				this.magnify.distortion(value);
 			};

 			if( 'thresholdCount' === optionName 
 			 && typeof value === 'number' ){
 				this.magnifyThresholdCount = value;
 			};
 		};
 		
 		this.createGraph();
 		
 		opts.onSuccess();

 		if( this.sourceModelId ){
 			if( this.dispatchService ){
 				var msg = {
 					type: 'modelGetState'
 					,modelId: this.sourceModelId
 					,state: null
 				};
 				this.dispatchService.synchronousCall(DH,msg);
 				if( msg.state ){
 					this._sourceModelUpdated(msg.state);
 				};
 			};
 		};

 		$n2.log('RadialCanvas',this);
 	},
 	
 	createGraph: function() {
 		var _this = this; // for use in callbacks

 		this.svgId = $n2.getUniqueId();
 		var $svg = $d.select('#' + this.canvasId)
 			.append('svg')
 			.attr('id',this.svgId);
 		
 		var $background = $svg.append('rect')
 			.attr({
 				x: '0'
 				,y:'0'
 			})
 			.classed({
 				'n2CanvasRadial_background': true
 			})
 			.on('click', function(){
	 			_this._backgroundClicked();
	 		});

 		if( this.background 
 			&& typeof this.background === 'object' ){
 			var allowedAttributes = $n2.svg.presentationAttributeMap;
 			for(var key in this.background){
 				if( typeof key === 'string' 
 					&& allowedAttributes[key] ){
 					var value = this.background[key];
 					if( typeof value === 'string' ){
 						$background.attr(key,value);
 					} else if( typeof value === 'number' ){
 						$background.attr(key,value);
 					};
 				};
 			};
 		} else {
 			$background.attr({
 				'stroke-opacity': 0
 				,'fill-opacity': 0
 			});
 		};

 		var $rootGroup = $svg.append('g')
			.attr('class','radialRoot');

		$rootGroup.append('g')
 			.attr('class', 'links');

		$rootGroup.append('g')
 			.attr('class', 'nodes');

		$rootGroup.append('g')
 			.attr('class', 'labels');
 
 		this.resizeGraph();
 	},
 	
 	getGraphSize: function() {
 		var $canvas = $('#' + this.canvasId);
 		
 		var width = $canvas.width();
 		var height = $canvas.height();
 		
 		/*
 		 * apply minimum sizes
 		 */
// 		if (width < this.options.sizes.canvas_min.width) {
// 			width = this.options.sizes.canvas_min.width;
// 		};
// 		if (height < this.options.sizes.canvas_min.height) {
// 			height = this.options.sizes.canvas_min.height;
// 		};
 		return [width, height];
 	},
 	
 	resizeGraph: function() {
 		var size = this.getGraphSize();
 		
 		var $svg = this._getSvgElem()
 			.attr('width', size[0])
 			.attr('height', size[1]);
 		
 		var $background = $svg.select('.n2CanvasRadial_background')
 			.attr({
 				width: size[0]
				,height: size[1]
 			});
 		
 		var $rootGroup = $svg.select('g.radialRoot')
			.attr("transform", "translate(" + (size[0]/2) + "," + (size[1]/2) + ")");
			;
 		
 		var minDim = size[0];
 		if( minDim > size[1] ){
 			minDim = size[1];
 		};
 		
 		this.canvasWidth = minDim;
 		this.radius = Math.floor( (minDim / 2) - 120 );
 		
 		this._documentsUpdated([],[]);
 	},
 	
 	_getSvgElem: function() {
 		return $d.select('#' + this.svgId);
 	},
	
	_elementsChanged: function(addedElements, updatedElements, removedElements){
		// Remove elements that are no longer there
		for(var i=0,e=removedElements.length; i<e; ++i){
			var removed = removedElements[i];
			
			if( removed.isNode ){
				delete this.nodesById[ removed.id ];
			} else if( removed.isLink ){
				delete this.linksById[ removed.id ];
			};
		};
		
		// Add elements
		for(var i=0,e=addedElements.length; i<e; ++i){
			var added = addedElements[i];
			
			if( added.isNode ){
				added.n2_geometry = 'point';
				this.nodesById[ added.id ] = added;
			} else if( added.isLink ){
				added.n2_geometry = 'line';
				this.linksById[ added.id ] = added;
			};
		};

		// Updated nodes
		var updatedNodes = [];
		var updatedLinks = [];
		for(var i=0,e=updatedElements.length; i<e; ++i){
			var updated = updatedElements[i];
			
			if( updated.isNode ){
				updated.n2_geometry = 'point';
				updatedNodes.push(updated);
			} else if( updated.isLink ){
				updated.n2_geometry = 'line';
				updatedLinks.push(updated);
			};
		};
		
		this._documentsUpdated(updatedNodes, updatedLinks);
	},
	
	_intentChanged: function(changedElements){
 		// Segregate nodes and active links
 		var nodes = [];
 		var links = [];
 		for(var i=0,e=changedElements.length; i<e; ++i){
 			var changedNode = changedElements[i];
 			
 			// $n2.log(changedNode.n2_id+' sel:'+changedNode.n2_selected+' foc:'+changedNode.n2_hovered+' find:'+changedNode.n2_found);
 			
 			if( changedNode.isNode ){
 				nodes.push(changedNode);
 				
 				if( changedNode.n2_found 
 				 && !changedNode.forceFound ){
 					changedNode.forceFound = true;

 				} else if( !changedNode.n2_found 
 				 && changedNode.forceFound ){
 					changedNode.forceFound = false;
 				};
 				
 			} else if( changedNode.isLink ){
 				links.push(changedNode);
 			};
 		};

 		// Update style on nodes
 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(nodes, function(node){ return node.id; });
 		this._adjustElementStyles(selectedNodes);

 		var selectedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
			.data(nodes, function(node){ return node.id; });
		this._adjustElementStyles(selectedLabels);

 		// Update style on links
 		var selectedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(links, function(link){ return link.id; });
 		this._adjustElementStyles(selectedLinks);
 		
 		// Re-order the lines so that hovered are above selected, and selected are above
 		// regular
 		links = [];
 		for(var linkId in this.linksById){
 			var link = this.linksById[linkId];
			links.push(link);
 		};
 		this._getSvgElem()
 			.select('g.links')
 			.selectAll('.link')
			.data(links, function(link){ return link.id; })
			.filter(function(l){return l.n2_selected;})
			.each(function(l){
	 			var svgLink = this;
	 			svgLink.parentNode.appendChild(svgLink);
	 		})
			;
 		this._getSvgElem()
			.select('g.links')
			.selectAll('.link')
			.data(links, function(link){ return link.id; })
			.filter(function(l){return l.n2_hovered;})
			.each(function(l){
	 			var svgLink = this;
	 			svgLink.parentNode.appendChild(svgLink);
	 		})
			;
	},
 	
 	_documentsUpdated: function(updatedNodeData, updatedLinkData){
 		var _this = this;
 		
 		this.sortedNodes = [];
 		for(var id in this.nodesById){
 			var node = this.nodesById[id];
 			this.sortedNodes.push(node);
 		};
 		
 		// Sort the nodes
 		this.sortedNodes.sort(function(a,b){
 			return d3.ascending(a.sortValue, b.sortValue);
 		});
 		
 		// Assign x and y
 		if( this.sortedNodes.length > 0 ){
 	 		var xDelta = 360 / this.sortedNodes.length;
 	 		var x = 0;
 	 		for(var i=0,e=this.sortedNodes.length; i<e; ++i){
 	 			var node = this.sortedNodes[i];
 	 			
 	 			node.orig_x = x;
 	 			node.y = this.radius;
 	 			
 	 			var mag = this.magnify(node);
 	 			node.x = mag.x;
 	 			node.z = mag.z;
 	 			
 	 			x += xDelta;
 	 		};
 		};

 		var links = [];
 		for(var id in this.linksById){
 			var link = this.linksById[id];
 			links.push(link);
 		};

 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(this.sortedNodes, function(node){ return node.id; })
 			;

 		var selectedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
 			.data(this.sortedNodes, function(node){ return node.id; })
 			;

 		// Animate the position of the nodes around the circle
 		selectedNodes.transition()
		.attr("transform", function(d) { 
			return "rotate(" + (d.x - 90) 
				+ ")translate(" + d.y + ",0)"; 
		})
		;
 		
 		// Animate the position of the labels around the circle
 		selectedLabels.transition()
			.attr("transform", function(d) { 
				return "rotate(" + (d.x - 90) 
					+ ")translate(" + (d.y + 8) + ",0)" 
					+ (d.x < 180 ? "" : "rotate(180)"); 
			})
 			.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			;

 		var createdNodes = selectedNodes.enter()
 			.append('circle')
 			.attr('class','node')
 			.attr("r", 3)
 			.attr("transform", function(d) { 
 				return "rotate(" + (d.x - 90) + ")translate(" + d.y + ",0)"; 
 			})
 			.on('click', function(n,i){
 				_this._initiateMouseClick(n);
 			})
 			.on('mouseover', function(n,i){
 				_this._initiateMouseOver(n);
 				_this._magnifyElement(n);
 			})
 			.on('mouseout', function(n,i){
 				_this._initiateMouseOut(n);
 			})
 			;
 		this._adjustElementStyles(createdNodes);

 		var createdLabels = selectedLabels.enter()
 			.append(function(){
 				var args = arguments;
 				return this.ownerDocument.createElementNS(this.namespaceURI, "text");
 			})
 			.attr('class','label')
 			.attr("dy", ".31em")
 			.attr("transform", function(d) { 
 				return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" 
 					+ (d.x < 180 ? "" : "rotate(180)"); 
 			})
 			.style("text-anchor", function(d) { 
 				return d.x < 180 ? "start" : "end"; 
 			})
 			.text(function(d) { 
 				//return d.key; 
 				return "";
 			})
 			.on('click', function(n,i){
 				_this._initiateMouseClick(n);
 			})
 			.on('mouseover', function(n,i){
 				_this._initiateMouseOver(n);
 				_this._magnifyElement(n);
 			})
 			.on('mouseout', function(n,i){
 				_this._initiateMouseOut(n);
 			})
 			;
 		this._adjustElementStyles(createdLabels);
 		
 		selectedNodes.exit()
 			.remove();

 		selectedLabels.exit()
			.remove();
 		
 		var updatedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(updatedNodeData, function(node){ return node.id; })
 			;
 		this._adjustElementStyles(updatedNodes);

 		var updatedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
			.data(updatedNodeData, function(node){ return node.id; })
			;
		this._adjustElementStyles(updatedLabels);

 		var selectedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(links, function(link){ return link.id; })
			;
 		
 		selectedLinks.transition()
			.attr('d',function(link){ return _this.line([link.source,{x:0,y:0},link.target]); })
			;

 		var createdLinks = selectedLinks.enter()
 			.append('path')
 			.attr('class','link')
 			.attr('d',function(link){ return _this.line([link.source,{x:0,y:0},link.target]); })
 			.on('click', function(n,i){
 				_this._initiateMouseClick(n);
 			})
 			.on('mouseover', function(n,i){
 				_this._initiateMouseOver(n);
 			})
 			.on('mouseout', function(n,i){
 				_this._initiateMouseOut(n);
 			})
 			;
 		this._adjustElementStyles(createdLinks);
 		
 		selectedLinks.exit()
 			.remove();
 		
 		var updatedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(updatedLinkData, function(link){ return link.linkId; })
			;
 		this._adjustElementStyles(updatedLinks);

 	},
 	
 	_adjustElementStyles: function(selectedElements){
 		var _this = this;
 		selectedElements.each(function(n,i){
 			n.n2_elem = this;
 			var symbolizer = _this.styleRules.getSymbolizer(n);
 			symbolizer.adjustSvgElement(this,n);
 			delete n.n2_elem;
 		});
 	},
 	
 	_dispatch: function(m){
 		var d = this.dispatchService;
 		if( d ){
 			d.send(DH,m);
 		};
 	},
 	
 	_sourceModelUpdated: function(opts_){
 		this.elementGenerator.sourceModelUpdated(opts_);
 	},
 	
 	_magnifyElement: function(magnifiedNode){
 		var _this = this;
 		
 		var focusAngle = magnifiedNode.orig_x;
 		this.magnify.angle(focusAngle);

 		var magnifyEnabled = false;
 		if( typeof this.magnifyThresholdCount === 'number' 
 		 && this.magnifyThresholdCount <= this.sortedNodes.length ){
 			magnifyEnabled = true;
 		};
 		
 		var changedNodes = [];
 		for(var i=0,e=this.sortedNodes.length; i<e; ++i){
 			var node = this.sortedNodes[i];

 			node.transitionNeeded = false;

 			if( magnifyEnabled ){
 	 			var mag = this.magnify(node);

 	 			if( mag.z === node.z ) {
 	 				// nothing to do
 	 			} else {
 	 				node.z = mag.z;
 	 				node.x = mag.x;
 	 				node.transitionNeeded = true;
 	 				
 	 				changedNodes.push(node);
 	 			};
 	 			
 			} else {
 				if( node.z !== 1 ){
 	 				node.z = 1;
 	 				node.x = node.orig_x;
 	 				node.transitionNeeded = true;
 	 				
 	 				changedNodes.push(node);
 				};
 			};
 		};
 		
		// Animate the position of the nodes around the circle
 		this._getSvgElem().select('g.nodes').selectAll('.node')
			.data(changedNodes, function(node){ return node.id; })
			.transition()
			.attr("transform", function(d) { 
				return "rotate(" + (d.x - 90) 
					+ ")translate(" + d.y + ",0)"; 
			})
			;

		// Animate the position of the labels around the circle
 		this._getSvgElem().select('g.labels').selectAll('.label')
			.data(changedNodes, function(node){ return node.id; })
			.transition()
			.attr("transform", function(d) { 
				return "rotate(" + (d.x - 90) 
					+ ")translate(" + (d.y + 8) + ",0)" 
					+ (d.x < 180 ? "" : "rotate(180)"); 
			})
 			.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			;

 		var links = [];
 		for(var linkId in this.linksById){
 			var link = this.linksById[linkId];
 			links.push(link);
 		};
 		this._getSvgElem().select('g.links').selectAll('.link')
			.data(links, function(link){ return link.id; })
			.filter(function(link){
				if( link.source.transitionNeeded ) return true;
				if( link.target.transitionNeeded ) return true;
				return false;
			})
			.transition()
			.attr('d',function(link){ return _this.line([link.source,{x:0,y:0},link.target]); })
			;
 	},
 	
 	_initiateMouseClick: function(elementData){
 		var elementId = elementData.id;
 		if( this.toggleSelection 
 		 && this.lastElementIdSelected === elementId ){
 			this.elementGenerator.selectOff(elementData);
 			this.lastElementIdSelected = null;
 		} else {
 			this.elementGenerator.selectOn(elementData);
 			this.lastElementIdSelected = elementId;
 		};
 	},
 	
 	_initiateMouseOver: function(elementData){
 		var elementId = elementData.id;
 		if( elementId !== this.currentMouseOver ){
 			// Focus Off before Focus On
 			if( this.currentMouseOver ){
 	 			this.elementGenerator.focusOff(this.currentMouseOver);
 				this.currentMouseOver = null;
 			};
 			
 			this.elementGenerator.focusOn(elementData);
 			this.currentMouseOver = elementId;
 		};
 	},
 	
 	_initiateMouseOut: function(elementData){
 		var elementId = elementData.id;
 		if( elementId === this.currentMouseOver ){
 			this.elementGenerator.focusOff(elementData);
			this.currentMouseOver = null;
 		};
 	},
 	
 	_backgroundClicked: function(){
 		this._dispatch({
 			type: 'userUnselect'
 		});
 	},
 	
 	_handleDispatch: function(m){
 		if( 'modelGetInfo' === m.type ){
 			if( m.modelId === this.modelId ){
 				m.modelInfo = this._getModelInfo();
 			};
 			
 		} else if( 'modelStateUpdated' === m.type ) {
 			if( this.sourceModelId === m.modelId ){
 				if( m.state ){
 					this._sourceModelUpdated(m.state);
 				};
 			};
 		};
 	},
 	
 	_getModelInfo: function(){
 		var info = {
 			modelId: this.modelId
 			,modelType: 'radialCanvas'
 			,parameters: []
 		};
 		
 		return info;
 	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'radial' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'radial' ){
		
		var options = {};
		if( m.canvasOptions ){
			for(var key in m.canvasOptions){
				options[key] = m.canvasOptions[key];
			};
		};
		
		options.canvasId = m.canvasId;
		options.interactionId = m.interactionId;
		options.config = m.config;
		options.moduleDisplay = m.moduleDisplay;
		options.onSuccess = m.onSuccess;
		options.onError = m.onError;
		
		new RadialCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasRadial = {
	RadialCanvas: RadialCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
