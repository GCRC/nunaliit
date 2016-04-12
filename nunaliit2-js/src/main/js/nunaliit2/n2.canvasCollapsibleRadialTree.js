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
 ,DH = 'n2.collapsibleRadialTreeCanvas'
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

//--------------------------------------------------------------------------
// This is a d3 layout function used to position a collapsible tree in a
// two-dimension space. The layout accepts a tree structure and assigns
// x,y values to each node.
// The tree requires nodes with the following format:
// {
//    parent: <object> Parent node to this node. Not defined for root node.
//    children: <array> Array of nodes that are children to this node
// }
//
// Options to layout:
// xSize: Dimension of X axis. Defaults to 1. All shown nodes are distributed
//        evenly over this axis. The order of the nodes is based on a depth-first
//        visit strategy, respecting sorting of sibling nodes.
// ySize: Dimension of Y axis. Defaults to 1. All shown nodes are given a value on
//        this axis based on the depth of the node in the tree. The root node is assigned
//        0, while the nodes farthest from root are assigned 1.
// shownFn: Function that reports whether a node is shown or not. This function returns a boolean
//          which is true if the node should be considered visible. This function has the
//          following signature: function(node){}. If no shownFn is specified, then all nodes in
//          the tree are considered visible.
// comparatorFn: Function used to compare the sort order of two nodes. This function has the 
//               following signature: function(node1,node2){}. This function returns 0 if both
//               nodes are equivalent in the collation order. It returns -1 is node1 comes before
//               node2. Finally, it return 1 if node1 comes after node2. If this function is
//               not specified, then the order of the children array is respected for assigning
//               values.
// assignFn: Function used to assign values to the node. This function has the following
//           signature: function(node,values){}. If this function is not specified, then a default
//           assignment functions is supplied where x and y are assigned to the properties 'x' and
//           'y', respectively. The format of the argument 'values' is as follow:
//           {
//               x: <number> value on X-axis
//               xMax: <number> maximum value on X-axis from children nodes
//               y: <number> value on Y-axis
//               level: <number> Integer that represents the depth of this node in the tree
//               xIndent: <number> distance between two nodes in the X-axis
//               yIndent: <number> distance between two levels in the Y-axis
//           }
var CollapsibleLayout = $n2.Class({
	
	xSize: null,

	ySize: null,
	
	shownFn: null,
	
	assignFn: null,
	
	comparatorFn: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			xSize: 1
			,ySize: 1
			,shownFn: null
			,assignFn: null
			,comparatorFn: null
		},opts_);

		this.xSize = opts.xSize;
		this.ySize = opts.ySize;
		this.shown( opts.shownFn );
		this.assign( opts.assignFn );
		this.comparator( opts.comparatorFn );
		
		if( !this.shownFn ){
			this.shownFn = function(n){
				return true;
			};
		};

		if( !this.assignFn ){
			this.assignFn = function(n, v){
				n.x = v.x;
				n.y = v.y;
			};
		};
	},

	nodes: function(root){
		var _this = this;
		
		var nodesShown = [];
		var numberOfLevels = 0;
		
		processLevel([ root ], 0, undefined);

		// Compute xIndent
		var xIndent = 0;
		if( this.xSize > 0 && nodesShown.length > 0 ){
			xIndent = this.xSize / nodesShown.length;
		};

		// Compute yIndent
		var yIndent = 0;
		if( this.ySize > 0 && numberOfLevels > 0 ){
			yIndent = this.ySize / numberOfLevels;
		};
		
		// Compute values. Values that are set by visiting
		// all nodes: parent, level
		// Derived values: x, y, xIndent, yIndent
		for(var i=0,e=nodesShown.length; i<e; ++i){
			var wrapper = nodesShown[i];

			if( wrapper ){
				var node = wrapper.node;

				wrapper.x = i * xIndent;
				wrapper.y = wrapper.level * yIndent;
				wrapper.xIndent = xIndent;
				wrapper.yIndent = yIndent;
				
				assignMaxX(wrapper, wrapper.x);
			};
		};

		// Assign values to shown nodes
		var nodes = [];
		for(var i=0,e=nodesShown.length; i<e; ++i){
			var wrapper = nodesShown[i];

			if( wrapper ){
				var node = wrapper.node;

				this.assignFn(node, wrapper);
				
				nodes.push(node);
			};
		};
		
		return nodes;
		
		function processLevel(nodes, level, parent){
			var anyNodeShown = false;
			
			for(var i=0,e=nodes.length; i<e; ++i){
				var node = nodes[i];
				var wrapper = {
					level: level
					,node: node
					,parent: parent
				};

				var shown = _this.shownFn(node);
				if( shown ){
					anyNodeShown = true;
					
					nodesShown.push(wrapper);
				};
				
				if( node.children ){
					if( _this.comparatorFn ){
						var children = node.children.slice(0); // clone
						children.sort(_this.comparatorFn);
						processLevel(children, level+1, wrapper);
					} else {
						processLevel(node.children, level+1, wrapper);
					};
				};
			};
			
			if( anyNodeShown ){
				// Add a null for spacing
				//nodesShown.push(null);

				// Add a level, if needed
				if( numberOfLevels < level ){
					numberOfLevels = level;
				};
			};
		};
		
		function assignMaxX(wrapper, xMax){
			if( wrapper ){
				wrapper.xMax = xMax;
				assignMaxX(wrapper.parent, xMax);
			};
		};
	},
	
	size: function(xSize, ySize){
		this.xSize = xSize;
		this.ySize = ySize;
	},
	
	shown: function(f){
		if( typeof f === 'function' ){
			this.shownFn = f;

		} else if( typeof f === 'string' ){
			this.shownFn = function(n){
				return n[f];
			};
		};
	},
	
	assign: function(f){
		if( typeof f === 'function' ){
			this.assignFn = f;
		};
	},
	
	comparator: function(f){
		if( typeof f === 'function' ){
			this.comparatorFn = f;
		};
	}
});


// --------------------------------------------------------------------------
// This canvas displays "node elements" in a circle. It draws line between those
// elements
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
	expanded: <boolean> True if the children of this element are to appear in the graph
}

The nodes are expected to form a tree. Nodes that do not have a parent identifier are assumed
to be children of the "root" node. If no nodes define a parent, then it is a flat tree with
only one level.

The collapsible radial tree shows only the first level nodes (the ones directly children to
root) until a node is expanded. When a node is expanded, the children of the expanded node are
shown instead of their parent.
*/
var CollapsibleRadialTreeCanvas = $n2.Class({

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
	
	expandedNodesById: null,
 	
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
 		
		this.modelId = $n2.getUniqueId('collapsibleRadialTreeCanvas');
 		
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
 		this.expandedNodesById = {};

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
 		
 		this.layout = new CollapsibleLayout({
 			xSize: 360
 			,assignFn: function(node,v){
 				node.x = v.x;
 				node.xMax = v.xMax
 				node.xIndent = v.xIndent
 				node.y = _this.dimensions.radius;
 				node.shown = true; // if assigned a value, then it is shown
 			}
 			,shownFn: function(node){
 				node.shown = false; // Reset shown flag when visited by layout

 				if( node.parent ) {
 					return isExpanded(node.parent);
 				};
 				
 				// Root is hidden
 				return false;
 				
 				function isExpanded(n){
 	 				var expanded = n.expanded;
 	 				if( expanded && n.parent ){
 	 					expanded = isExpanded(n.parent);
 	 				};
 	 				return expanded;
 				};
 			}
 			,comparatorFn: function(n1, n2){
 				if( n1.sortValue < n2.sortValue ) return -1;
 				if( n1.sortValue > n2.sortValue ) return 1;
 				return 0;
 			}
 		});

 		// Set up line computing
 		var lineOptions = $n2.extend({
 			interpolate: 'bundle' // 'bundle' 'basis' 'linear'
 			,tension: 0.85
 		},opts.line);
 		this.line = d3.svg.line.radial()
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

 		$n2.log('collapsibleRadialTreeCanvas',this);
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
			.attr('class','collapsibleRadialTreeBackground')
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
			.attr('class','collapsibleRadialTreeScale')
			;
 		
 		var $rootGroup = $scaleGroup.append('g')
			.attr('class','collapsibleRadialTreeRoot')
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
			.attr('class','arcs');

		$rootGroup.append('g')
 			.attr('class','links');

		$rootGroup.append('g')
 			.attr('class','nodes');

		$rootGroup.append('g')
			.attr('class','controls');

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

 		$svg.select('g.collapsibleRadialTreeScale')
			.attr('transform', 
				'translate(' + this.dimensions.cx + "," + this.dimensions.cy + ')'
				+' scale(' + (minDim / standardDim) + ')'
					)
			;

 		$svg.select('rect.collapsibleRadialTreeBackground')
			.attr("width", size[0])
 			.attr("height", size[1])
			;
 		
 		var $svgRoot = $svg.select('g.collapsibleRadialTreeRoot')
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
		
		this._createGraphicalElements();
	},
	
	_createGraphicalElements: function(){
		var _this = this;

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
			delete elem.expanded;
		};
		
		// Compute tree
		var root = {
			id: '__root__'
			,name: ''
			,x: 0
			,y: 0
			,children: []
			,expanded: true
		};
		var links = [];
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			
			if( elem.isNode ){
				if( !elem.children ){
					elem.children = [];
				};

				if( this.expandedNodesById[elemId] ){
					elem.expanded = true;
				} else {
					elem.expanded = false;
				};

				if( elem.parentId ){
					var parent = this.elementsById[elem.parentId];
					elem.parent = parent;
					if( !parent.children ){
						parent.children = [];
					};
					parent.children.push(elem);
					
				} else {
					elem.parent = root;
					root.children.push(elem);
				};
			};

			if( elem.isLink ){
				links.push(elem);
			};
		};

		// Layout tree (sets x and y)
		this.sortedNodes = this.layout.nodes(root);
		
		// Create links. Here, we collapse the links that join two visible nodes.
		// Since some nodes are collapsed into one, links can collide on source/target
		// combination. 
		var effectiveLinksById = {};
		this.links = [];
		for(var i=0,e=links.length; i<e; ++i){
			var elem = links[i];
			var elemId = elem.id;

			var sourceNode = findVisibleNode(elem.source);
			var targetNode = findVisibleNode(elem.target);
			
			if( sourceNode && targetNode ){
				var effectiveLinkId = computeLinkId(sourceNode,targetNode);
				var effectiveLink = effectiveLinksById[effectiveLinkId];
				if( !effectiveLink ){
					effectiveLink = {
						id: effectiveLinkId
						,isLink: true
						,source: sourceNode
						,target: targetNode
						,fragments: {}
						,n2_geometry: 'line'
					};
					effectiveLinksById[effectiveLinkId] = effectiveLink;
					this.links.push(effectiveLink);
				};

				adoptFragments(effectiveLink, sourceNode);
				adoptFragments(effectiveLink, targetNode);

				if( elem.isShown ){
					effectiveLink.isShown = true;
				};
			};
		};

		//var paths = this.bundle(this.links);
		for(var i=0,e=this.links.length; i<e; ++i){
			var link = this.links[i];
			//var path = paths[i];
			var path = [link.source, root, link.target];
			link.path = path;
		};

		// Adjust nodes and sort
		for(var i=0,e=this.sortedNodes.length; i<e; ++i){
			var node = this.sortedNodes[i];

			node.n2_geometry = 'point';
			node.orig_x = node.x;
			delete node.x;
		};
		
		this._documentsUpdated(this.sortedNodes, this.links);
		
		function inTree(n){
			if( !n ) return false;
			
			if( n === root ) return true;

			return inTree(n.parent);
		};

		function findVisibleNode(n){
			if( !n ) return null;

			if( !inTree(n) ){
				return null;
			};
			
			if( n.shown ) return n;
			
			var parent = n.parent;
			if( !parent ) return null;

			return findVisibleNode(parent);
		};
		
		function computeLinkId(node1,node2){
			var ids = [ node1.id, node2.id ];
			ids.sort();
			return ids.join('_to_');
		};
		
		/*
		 * cluster1 adopts all the fragments from cluster2
		 */
		function adoptFragments(cluster1, cluster2){
			if( !cluster1 || !cluster2 ) return;
			
			if( !cluster1.fragments ){
				cluster1.fragments = {};
			};

			if( !cluster2.fragments ) return;
			
			for(var fragId in cluster2.fragments){
				var frag = cluster2.fragments[fragId];
				cluster1.fragments[fragId] = frag;
			};
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

 		var selectedControls = this._getSvgElem().select('g.controls').selectAll('.control')
			.data(nodes, function(node){ return node.id; });
 		this._adjustElementStyles(selectedControls);

 		var selectedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
			.data(nodes, function(node){ return node.id; });
		this._adjustElementStyles(selectedLabels);

 		var selectedArcs = this._getSvgElem().select('g.arcs').selectAll('.arc')
			.data(nodes, function(node){ return node.id; });
		this._adjustElementStyles(selectedArcs);

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
			.filter(function(l){return l.n2_hovered;})
			.each(function(l){
	 			var svgLink = this;
	 			svgLink.parentNode.appendChild(svgLink);
	 		})
			;
	},
	
 	_documentsUpdated: function(updatedNodeData, updatedLinkData){
 		var _this = this;

 		// Circles that are used to select/hover nodes
 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
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

 		selectedNodes.exit().remove();

 		// Elements that are used to expand/collapse nodes
 		var controlData = updatedNodeData.filter(function(node){
			return node.children ? (node.children.length > 0) : false;
		});
 		var selectedControls = this._getSvgElem().select('g.controls').selectAll('.control')
 			.data(controlData, function(node){ return node.id; })
 			;

 		var createdControls = selectedControls.enter()
 			.append('circle')
 			.attr('class','control')
 			.attr("r", 3)
 			.attr("transform", function(d) { 
 				return "rotate(" + (d.orig_x - 90) + ")translate(" + (d.y + 10) + ",0)"; 
 			})
 			.on('click', function(n,i){
 				_this._initiateExpandCollapse(n);
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
 		this._adjustElementStyles(createdControls);

 		selectedControls.exit().remove();

 		this._adjustElementStyles(selectedControls);

 		// Labels that name the nodes
 		var selectedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
			.data(updatedNodeData, function(node){ return node.id; });

 		var createdLabels = selectedLabels.enter()
 			.append(function(){
 				var args = arguments;
 				return this.ownerDocument.createElementNS(this.namespaceURI, "text");
 			})
 			.attr('class','label')
 			.attr("dy", ".31em")
 			.attr("transform", function(d) { 
 				return "rotate(" + (d.orig_x - 90) + ")translate(" + (d.y + 16) + ",0)" 
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
 		
 		selectedLabels.exit().remove();

		this._adjustElementStyles(selectedLabels);

		// Elements that are used to draw arcs to show parent/children relationship
		var arcData = updatedNodeData.filter(function(node){
			return node.children ? (node.children.length > 0) : false;
		});
 		var selectedArcs = this._getSvgElem().select('g.arcs').selectAll('.arc')
 			.data(arcData,function(node){ return node.id; });

 		var createdArcs = selectedArcs.enter()
 			.append('path')
 			.attr('class','arc')
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
 		this._adjustElementStyles(createdArcs);

 		selectedArcs.exit().remove();

 		this._adjustElementStyles(selectedArcs);

		// Links
 		var selectedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(updatedLinkData, function(link){ return link.id; });

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

		// Animate the position of the controls around the circle
 		var changedControls = this._getSvgElem().select('g.controls').selectAll('.control')
			.data(changedNodes, function(node){ return node.id; });
 		
 		changedControls.transition()
			.attr("transform", function(d) { 
				return "rotate(" + (d.x - 90) 
					+ ")translate(" + (d.y + 10) + ",0)"; 
			})
			;
 		
 		this._adjustElementStyles(changedControls);

		// Animate the position of the labels around the circle
 		var changedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
			.data(changedNodes, function(node){ return node.id; })
			;
 		
		changedLabels.transition()
			.attr("transform", function(d) { 
				return "rotate(" + (d.x - 90) 
					+ ")translate(" + (d.y + 16) + ",0)" 
					+ (d.x < 180 ? "" : "rotate(180)"); 
			})
 			.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			;
 		
 		this._adjustElementStyles(changedLabels);

 		// Animate the position of the arcs around the circle
 		var changedArcs = this._getSvgElem().select('g.arcs').selectAll('.arc')
			.data(changedNodes, function(node){ return node.id; });
 		
 		changedArcs
 			.transition()
			.attr('transform', function(d) { 
				return 'rotate(' + (d.x - 90) + ')';
			})
			.attr('d', function(d) {
				var angle = (d.xMax - d.x + d.xIndent) / 180 * Math.PI;
				var x = (d.y - 10) * Math.cos(angle);
				var y = (d.y - 10) * Math.sin(angle);
				var path = [
				   'M', (d.y - 10), ' 0'
				   ,' A ', (d.y - 10), ' ',  (d.y - 10), ' 0 0 1 ', x, ' ', y
				].join('');
				return path;
			})
			;
 		
 		this._adjustElementStyles(changedArcs);

 		// Animate links
 		this._getSvgElem().select('g.links').selectAll('.link')
			.data(this.links, function(link){ return link.id; })
			.filter(function(link){
				if( link.source.transitionNeeded ) return true;
				if( link.target.transitionNeeded ) return true;
				return false;
			})
			.transition()
			.attr('d',function(link){ 
				return _this.line(link.path); 
			})
			;
 	},
 	
 	_initiateBackgroundMouseClick: function(){
 		if( this.lastElementIdSelected ){
 			this.elementGenerator.selectOff(this.lastElementIdSelected);
 			this.lastElementIdSelected = null;
 		};
 	},
 	
 	_initiateExpandCollapse: function(elementData){
 		var elementId = elementData.id;
 		if( this.expandedNodesById[elementId] ){
 			delete this.expandedNodesById[elementId];
 		} else {
 			this.expandedNodesById[elementId] = true;
 		};
 		
 		// Need to initiate redrawing
 		this._createGraphicalElements();
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
 			,modelType: 'collapsibleRadialTreeCanvas'
 			,parameters: []
 		};
 		
 		return info;
 	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'collapsibleRadialTree' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'collapsibleRadialTree' ){
		
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
		
		new CollapsibleRadialTreeCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasCollapsibleRadialTree = {
	CollapsibleRadialTreeCanvas: CollapsibleRadialTreeCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
