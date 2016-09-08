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
 ,DH = 'n2.radialTreeCanvas'
 ;
 
var $d = undefined;

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
			if (dd >= radius) return {x: pointAngle, z: 1};
			if (!dd) return {x: pointAngle, z: 10};
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
// This canvas displays "node elements" in a circle. It draws line between those elements
// using "link elements". Elements are expected to have the following format:
/* 
{
	id: <string>  (Unique identifier for this element)
	parentId: <string>  (If this element is part of a tree, id of parent element)
	isNode: <boolean>  (true if this is a node element [part of tree])
	isLink: <boolean>  (true if this is a link element [lines between nodes])
	source: <object>  (element which is at the beginning of the line [only links])
	target: <object>  (element which is at the end of the line [only links])
	sortValue: <string> (value used to sort the elements between themselves)
}

Here are attributes added by the canvas:
{
	x: <number>  (value computed by layout)
	y: <number>  (value computed by layout)
	parent: <object>  (element which is parent to this one)
	children: <array> (elements which are children to this one)
	n2_geometry: <string> ('line' or 'point', depending on link or node)
}
*/
var RadialTreeCanvas = $n2.Class({

	canvasId: null,
 	
	interactionId: null,
 	
	svgId: null,
 	
	modelId: null,
 	
	dispatchService: null,

	sourceModelId: null,
 	
	moduleDisplay: null,
 	
	background: null,
	
	toggleSelection: null,
 	
	styleRules: null,

	nodesById: null,
	
	sortedNodes: null,

	links: null,
	
	elementGenerator: null,
	
	elementsById: null,

	findableDocsById: null,
	
	dimensions: null,
	
	layout: null,
	
	line: null,
	
	bundle: null,
	
	magnify: null,
	
	magnifyThresholdCount: null,
 	
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
			,line: null
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
 		
		this.modelId = $n2.getUniqueId('radialTreeCanvas');
 		
		this.styleRules = $n2.styleRule.loadRulesFromObject(opts.styleRules);
 		
		var config = opts.config;
		if( config ){
			if( config.directory ){
				this.dispatchService = config.directory.dispatchService;
			};
		};

 		this.nodesById = {};
 		this.sortedNodes = [];
 		this.links = [];
 		this.currentMouseOver = null;
 		this.elementsById = {};
 		this.findableDocsById = {};
 		this.dimensions = {};
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
 			this.dispatchService.register(DH,'windowResized',f);
			this.dispatchService.register(DH,'findIsAvailable', f);
 		};
 		
 		this.createGraph();
 		
 		this.layout = d3.layout.cluster()
 			.size([360, this.dimensions.radius])
	 	    .sort(function(a,b){
	 	    	return d3.ascending(a.sortValue, b.sortValue);
	 	    })
	 	    .value(function(d) { return d.size; })
 			;

 		// Set up line computing
 		var lineOptions = $n2.extend({
 			interpolate: 'bundle'
 			,tension: 0.85
 		},opts.line);
 		this.line = d3.svg.line.radial()
	 	    .interpolate("bundle")
 			//.interpolate("basis")
 			//.interpolate("linear")
	 	    .tension(.85)
	 	    .radius(function(d) { return d.y; })
	 	    .angle(function(d) { return d.x / 180 * Math.PI; });
 		for(var optionName in lineOptions){
 			var value = lineOptions[optionName];
 			
 			if( 'interpolate' === optionName 
 			 && typeof value === 'string' ){
 				this.line.interpolate(value);
 			};

 			if( 'tension' === optionName 
 			 && typeof value === 'number' ){
 				this.line.tension(value);
 			};
 		};
 		
 		this.bundle = d3.layout.bundle();
 		
 		// Set up magnification
 		var magnifyOptions = $n2.extend({
 			radius: 10
 			,distortion: 2
 			,thresholdCount: 100
 		},opts.magnify);
 		this.magnify = RadialFishEye()
 			.radius(10)
 			.distortion(2)
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

 		$n2.log('RadialTreeCanvas',this);
 	},
 	
 	createGraph: function() {
 		var _this = this; // for use in callbacks

 		if( this.background 
 		 && typeof this.background.color === 'string' ){
 			var $canvas = $('#' + this.canvasId);
 			$canvas.css('background-color',this.background.color);
 		};
 		
 		this.svgId = $n2.getUniqueId();
 		var $svg = $d.select('#' + this.canvasId)
 			.append('svg')
 			.attr('id',this.svgId);

 		$svg.append('rect')
			.attr('class','radialBackground')
			.attr('x',0)
			.attr('y',0)
			.attr('stroke','none')
			.attr('fill','#000000')
			.attr('fill-opacity',0)
			.on('click', function(){
 				_this._initiateBackgroundMouseClick();
 			})
			.on('mousemove', function(){
 				_this._magnifyOut();
 			})
			;

 		var $scaleGroup = $svg.append('g')
			.attr('class','radialScale')
			;
 		
 		var $rootGroup = $scaleGroup.append('g')
			.attr('class','radialRoot')
			;

 		$rootGroup.append('circle')
			.attr('class','magnifyEvents')
			.attr('stroke','#000000')
			.attr('stroke-opacity',0)
			.attr('fill','none')
			.on('mouseover',function(){
				var e = $d.event;
				_this._magnifyLocation(e);
			})
			.on('mousemove',function(){
				var e = $d.event;
				_this._magnifyLocation(e);
			})
			;

		$rootGroup.append('g')
 			.attr('class','links');

		$rootGroup.append('g')
 			.attr('class','nodes');

		$rootGroup.append('g')
 			.attr('class','labels');
 		
 		this.resizeGraph();
 	},
 	
 	getGraphSize: function() {
 		var $canvas = $('#' + this.canvasId);
 		
 		var width = $canvas.width();
 		var height = $canvas.height();

 		return [width, height];
 	},
 	
 	resizeGraph: function() {
 		var size = this.getGraphSize();
 		
 		var minDim = size[0];
 		if( minDim > size[1] ){
 			minDim = size[1];
 		};

 		var standardDim = 800;
 		var maxTextWidth = 100;
 		
 		this.dimensions = {
 			width: size[0]
 			,height: size[1]
 			,cx: Math.floor(size[0]/2)
 			,cy: Math.floor(size[1]/2)
 			,canvasWidth: minDim
 			//,radius: Math.floor( (minDim / 2) - (maxTextWidth * 2) )
 			,radius: Math.floor( (standardDim / 2) - maxTextWidth )
 			,textWidth: maxTextWidth
 		};
 		
 		var $svg = this._getSvgElem()
 			.attr('width', size[0])
 			.attr('height', size[1]);

 		$svg.select('g.radialScale')
			.attr('transform', 
				'translate(' + this.dimensions.cx + "," + this.dimensions.cy + ')'
				+' scale(' + (minDim / standardDim) + ')'
					)
			;

 		$svg.select('rect.radialBackground')
			.attr("width", size[0])
 			.attr("height", size[1])
			;
 		
 		var $svgRoot = $svg.select('g.radialRoot')
			;
 		
 		$svgRoot.select('circle.magnifyEvents')
 			.attr('r',this.dimensions.radius + Math.floor(this.dimensions.textWidth / 2) + 5)
 			.attr('stroke-width',(this.dimensions.textWidth + 10))
 			;
 	},
 	
 	_getSvgElem: function() {
 		return $d.select('#' + this.svgId);
 	},
	
	_elementsChanged: function(addedElements, updatedElements, removedElements){

		// Reset attributes that are computed by layout
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			delete elem.parent;
			delete elem.children;
			delete elem.depth;
			delete elem.x;
			delete elem.y;
			delete elem.z;
			delete elem.orig_x;
		};

		// Remove elements that are no longer there
		for(var i=0,e=removedElements.length; i<e; ++i){
			var removed = removedElements[i];
			delete this.elementsById[removed.id];
		};
		
		// Add elements
		for(var i=0,e=addedElements.length; i<e; ++i){
			var added = addedElements[i];
			this.elementsById[ added.id ] = added;
		};
		
		// Update elements
		for(var i=0,e=updatedElements.length; i<e; ++i){
			var updated = updatedElements[i];
			this.elementsById[ updated.id ] = updated;
		};
		
		// Update list of documents that can be found
		this.findableDocsById = {};
		for(var id in this.elementsById){
			var cluster = this.elementsById[id];
			if( cluster.fragments ){
				for(var fragId in cluster.fragments){
					var frag = cluster.fragments[fragId];
					
					var context = frag.context;
					if( context ){
						var doc = context.n2_doc;
						if( doc ){
							var docId = doc._id;
							
							this.findableDocsById[docId] = doc;
						};
					};
				};
			};
		};

		// Compute tree
		var root = {
			id: '__root__'
			,name: ''
			,children: []
		};
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];

			if( elem.parentId ){
				var parent = this.elementsById[elem.parentId];
				if( parent ){
					elem.parent = parent;
					if( !parent.children ){
						parent.children = [];
					};
					parent.children.push(elem);
				};
				
			} else if( null === elem.parentId ) {
				elem.parent = root;
				root.children.push(elem);
			};
		};

		// Layout tree (sets x and y)
		this.layout.nodes(root);

		// Get nodes and links
		this.sortedNodes = [];
		this.links = [];
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			
			if( elem.isLink ){
				elem.n2_geometry = 'line';

				if( inTree(elem.source) 
				 && inTree(elem.target) ){
					this.links.push(elem);
				} else {
					$n2.log('link not in tree',elem);
				};
			};
			
			if( elem.isNode ){
				elem.n2_geometry = 'point';
				elem.orig_x = elem.x;
				delete elem.x;
				
				if( inTree(elem) ){
					this.sortedNodes.push(elem);
				} else {
					$n2.log('node not in tree.',elem);
				};
			};
		};
		this.sortedNodes.sort(function(a,b){
			if( a.orig_x < b.orig_x ) return -1;
			if( a.orig_x > b.orig_x ) return 1;
			return 0;
		});
		
		var paths = this.bundle(this.links);
		for(var i=0,e=this.links.length; i<e; ++i){
			this.links[i].path = paths[i];
		};
		
		this._documentsUpdated(this.sortedNodes, this.links);
		
		function inTree(n){
			if( !n ) return false;
			
			if( n === root ) return true;

			return inTree(n.parent);
		};
	},
	
	_intentChanged: function(changedElements){
		// Reset all temp variables
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			elem.temp_hovered = false;
			elem.temp_selected = false;
		};
		
 		// Segregate nodes and links
		var nodeMap = {};
 		var linkMap = {};
 		for(var i=0,e=changedElements.length; i<e; ++i){
 			var changedNode = changedElements[i];
 			
 			// $n2.log(changedNode.n2_id+' sel:'+changedNode.n2_selected+' foc:'+changedNode.n2_hovered+' find:'+changedNode.n2_found);
 			
 			if( changedNode.isNode ){
 				nodeMap[changedNode.id] = changedNode;
 				
 			} else if( changedNode.isLink ){
 				linkMap[changedNode.id] = changedNode;
 			};
 		};

 		// Compute derived selection and hover
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			
			if( elem.isLink ){
				// If a link is selected, both associated nodes
				// are selected (derived)
				if( elem.n2_selected ){
					elem.source.temp_selected = true;
					elem.target.temp_selected = true;
				};
				
				// If a link is hovered, both associated nodes
				// are hovered (derived)
				if( elem.n2_hovered ){
					elem.source.temp_hovered = true;
					elem.target.temp_hovered = true;
				};

				// If a link has an associated node which is selected,
				// then both the link and the other node are selected (derived)
				if( elem.source.n2_selected ){
					elem.temp_selected = true;
					elem.target.temp_selected = true;
				};
				if( elem.target.n2_selected ){
					elem.temp_selected = true;
					elem.source.temp_selected = true;
				};

				// If a link has an associated node which is hovered,
				// then both the link and the other node are hovered (derived)
				if( elem.source.n2_hovered ){
					elem.temp_hovered = true;
					elem.target.temp_hovered = true;
				};
				if( elem.target.n2_hovered ){
					elem.temp_hovered = true;
					elem.source.temp_hovered = true;
				};
			};
		};

 		// Detect changes in derived selection and hover
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			
			if( elem.n2_derived_selected !== elem.temp_selected ){
				elem.n2_derived_selected = elem.temp_selected;
				if( elem.isLink ){
					linkMap[elem.id] = elem;
				} else if( elem.isNode ){
					nodeMap[elem.id] = elem;
				};
			};
			
			if( elem.n2_derived_hovered !== elem.temp_hovered ){
				elem.n2_derived_hovered = elem.temp_hovered;
				if( elem.isLink ){
					linkMap[elem.id] = elem;
				} else if( elem.isNode ){
					nodeMap[elem.id] = elem;
				};
			};
		};

 		// Convert node map into a node array
 		var nodes = [];
 		for(var nodeId in nodeMap){
			nodes.push( nodeMap[nodeId] );
 		};

 		// Convert link map into a link array
 		var links = [];
 		for(var linkId in linkMap){
			links.push( linkMap[linkId] );
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
 		this._adjustElementStyles(selectedLinks, true);
 		
 		this._reOrderLinks();
	},
	
	_reOrderLinks: function(){
 		// Re-order the lines so that hovered are above selected, and selected are above
 		// regular
 		var links = [];
 		for(var elemId in this.elementsById){
 			var elem = this.elementsById[elemId];
 			if( elem.isLink ){
 				links.push(elem);
 			};
 		};
 		this._getSvgElem()
 			.select('g.links')
 			.selectAll('.link')
			.data(links, function(link){ return link.id; })
			.filter(function(l){return l.n2_selected || l.n2_derived_selected;})
			.each(function(l){
	 			var svgLink = this;
	 			svgLink.parentNode.appendChild(svgLink);
	 		})
			;
 		this._getSvgElem()
			.select('g.links')
			.selectAll('.link')
			.data(links, function(link){ return link.id; })
			.filter(function(l){return l.n2_found;})
			.each(function(l){
	 			var svgLink = this;
	 			svgLink.parentNode.appendChild(svgLink);
	 		})
			;
 		this._getSvgElem()
			.select('g.links')
			.selectAll('.link')
			.data(links, function(link){ return link.id; })
			.filter(function(l){return l.n2_hovered || l.n2_derived_hovered;})
			.each(function(l){
	 			var svgLink = this;
	 			svgLink.parentNode.appendChild(svgLink);
	 		})
			;
	},
 	
 	_documentsUpdated: function(updatedNodeData, updatedLinkData){
 		var _this = this;

 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(updatedNodeData, function(node){ return node.id; })
 			;

 		var selectedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
 			.data(updatedNodeData, function(node){ return node.id; })
 			;

 		var createdNodes = selectedNodes.enter()
 			.append('circle')
 			.attr('class','node')
 			.attr("r", 3)
 			.attr("transform", function(d) { 
 				return "rotate(" + (d.orig_x - 90) + ")translate(" + d.y + ",0)"; 
 			})
 			.on('click', function(n,i){
 				_this._initiateMouseClick(n);
 			})
 			.on('mouseover', function(n,i){
 				_this._initiateMouseOver(n);
 				_this._magnifyLocation($d.event);
 			})
 			.on('mousemove', function(n,i){
 				_this._magnifyLocation($d.event);
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
 				return "rotate(" + (d.orig_x - 90) + ")translate(" + (d.y + 8) + ",0)" 
 					+ (d.orig_x < 180 ? "" : "rotate(180)"); 
 			})
 			.style("text-anchor", function(d) { 
 				return d.orig_x < 180 ? "start" : "end"; 
 			})
 			.text(function(d) { 
 				return "";
 			})
 			.on('click', function(n,i){
 				_this._initiateMouseClick(n);
 			})
 			.on('mouseover', function(n,i){
 				_this._initiateMouseOver(n);
 				_this._magnifyLocation($d.event);
 			})
 			.on('mousemove', function(n,i){
 				_this._magnifyLocation($d.event);
 			})
 			.on('mouseout', function(n,i){
 				_this._initiateMouseOut(n);
 			})
 			;
 		this._adjustElementStyles(createdLabels);
 		
 		// Removals
 		selectedNodes.exit()
 			.remove();

 		selectedLabels.exit()
			.remove();

 		// Updates
 		this._adjustElementStyles(selectedNodes);

		this._adjustElementStyles(selectedLabels);

		// Links
 		var selectedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(updatedLinkData, function(link){ return link.id; })
			;

 		var createdLinks = selectedLinks.enter()
 			.append('path')
 			.attr('class','link')
// 			.attr('d',function(link){ return _this.line(link.path); })
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
 		this._adjustElementStyles(createdLinks, true);
 		
 		selectedLinks.exit()
 			.remove();
 		
 		this._adjustElementStyles(selectedLinks, true);

 		// Position everything around the circle
 		this._positionElements();

 		// Re-order links
 		this._reOrderLinks();
 	},
 	
 	_adjustElementStyles: function(selectedElements, elementsAreLinks){
 		var _this = this;
 		selectedElements.each(function(n,i){
 			n.n2_elem = this;
 			var symbolizer = _this.styleRules.getSymbolizer(n);
 			symbolizer.adjustSvgElement(this,n);
 			delete n.n2_elem;
 		});
 		
 		if( elementsAreLinks ){
 			selectedElements.attr('fill','none');
 		};
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
	
	_focusAngleFromLocation: function(x,y){
		var angle = null;
		
		var effX = x - this.dimensions.cx;
		var effY = this.dimensions.cy - y;
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
			if( angle > 360 ){
				angle = angle - 360;
			};
		};

		return angle;
	},
 	
 	_magnifyLocation: function(e){
 		var m = null;

 		try {
 			var $svg = this._getSvgElem();
 			var svgNode = $svg[0][0];
			var svgCTM = svgNode.getScreenCTM();
			m = svgCTM.inverse();
		} catch(e) {
			// ignore
		};
		
		if( m ){
			var x = (e.clientX * m.a) + (e.clientY * m.c) + m.e;
			var y = (e.clientX * m.b) + (e.clientY * m.d) + m.f;
			
			var focusAngle = this._focusAngleFromLocation(x,y);
			//$n2.log('focusAngle:'+focusAngle);
			
			if( null !== focusAngle ){
		 		this.magnify.angle(focusAngle);
		 		
		 		this._positionElements();
			};
		};
 	},
 	
 	_magnifyOut: function(){
		this.magnify.angle(null);
		this._positionElements();
 	},
 	
 	_positionElements: function(){
 		var _this = this;
 		
 		var magnifyEnabled = false;
 		if( typeof this.magnifyThresholdCount === 'number' 
 		 && this.magnifyThresholdCount <= this.sortedNodes.length ){
 			magnifyEnabled = true;
 		};
 		
 		var changedNodes = [];
 		for(var i=0,e=this.sortedNodes.length; i<e; ++i){
 			var node = this.sortedNodes[i];

 			node.transitionNeeded = false;
 			var x = null;
 			var z = null;

 			if( magnifyEnabled ){
 	 			var mag = this.magnify(node);
 	 			x = mag.x;
 	 			z = mag.z;
 	 			
 			} else {
 				x = node.orig_x;
 				z = 2;
 			};

 			var changed = false;
 			if( typeof node.x !== 'number' ){
 				node.x = x;
 				changed = true;
 			} else {
 	 			var delta = Math.abs(x - node.x);
 				if( delta > 0.01 ){
 	 				node.x = x;
 	 				changed = true;
 				};
 			};
 			if( typeof node.z !== 'number' ){
 				node.z = z;
 				changed = true;
 			} else {
 	 			var delta = Math.abs(z - node.z);
 				if( delta > 0.01 ){
 	 				node.z = z;
 	 				changed = true;
 				};
 			};
			
			if( changed ){
 				node.transitionNeeded = true;
 				changedNodes.push(node);
			};
 		};
 		
		// Animate the position of the nodes around the circle
 		var changedPoints = this._getSvgElem().select('g.nodes').selectAll('.node')
			.data(changedNodes, function(node){ return node.id; });
 		
		changedPoints.transition()
			.attr("transform", function(d) { 
				return "rotate(" + (d.x - 90) 
					+ ")translate(" + d.y + ",0)"; 
			})
			;
 		
 		this._adjustElementStyles(changedPoints);

		// Animate the position of the labels around the circle
 		var changedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
			.data(changedNodes, function(node){ return node.id; })
			;
 		
		changedLabels.transition()
			.attr("transform", function(d) { 
				return "rotate(" + (d.x - 90) 
					+ ")translate(" + (d.y + 8) + ",0)" 
					+ (d.x < 180 ? "" : "rotate(180)"); 
			})
 			.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			;
 		
 		this._adjustElementStyles(changedLabels);

 		// Animate links
 		this._getSvgElem().select('g.links').selectAll('.link')
			.data(this.links, function(link){ return link.id; })
			.filter(function(link){
				if( link.source.transitionNeeded ) return true;
				if( link.target.transitionNeeded ) return true;
				return false;
			})
			.transition()
			.attr('d',function(link){ return _this.line(link.path); })
			;
 	},
 	
 	_initiateBackgroundMouseClick: function(){
 		if( this.lastElementIdSelected ){
 			this.elementGenerator.selectOff(this.lastElementIdSelected);
 			this.lastElementIdSelected = null;
 		};
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
 			
 		} else if( 'windowResized' === m.type ) {
 			this.resizeGraph();
 			
 		} else if( 'findIsAvailable' === m.type ) {
			var doc = m.doc;
			var docId = doc._id;
 			
 			if( this.findableDocsById[docId] ){
 				m.isAvailable = true;
 			};
 		};
 	},
 	
 	_getModelInfo: function(){
 		var info = {
 			modelId: this.modelId
 			,modelType: 'radialTreeCanvas'
 			,parameters: []
 		};
 		
 		return info;
 	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	// Required library: d3
	if( !$d && window ) $d = window.d3;

	if( m.canvasType === 'radialTree' ){
		if( $d ) {
			m.isAvailable = true;
		} else {
			$n2.log('Canvas radialTree requires d3 library');
		};
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'radialTree' ){
		
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
		
		new RadialTreeCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasRadialTree = {
	RadialTreeCanvas: RadialTreeCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
