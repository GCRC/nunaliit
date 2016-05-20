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
 ,DH = 'n2.collapsibleRadialTreeCanvas'
 ,uniqueId = 0
 ;
 
var $d = undefined;


//--------------------------------------------------------------------------
function Degrees(num){
	if( typeof num !== 'number' ){
		throw new Error('Degrees() accepts only numbers');
	};
	
	if( num > 360 ){
		num = num % 360;
	};
	
	if( num < -360 ){
		num = num % 360;
	};

	if( num < 0 ){
		num = num + 360;
	};
	
	return num;
};

Degrees.toRadians = function(num){
	if( typeof num !== 'number' ){
		throw new Error('Degrees.toRadians() accepts only numbers');
	};
	
	return num * Math.PI / 180;
};

Degrees.sin = function(deg){
	var rad = Degrees.toRadians(deg);
	return Math.sin(rad);
};

Degrees.cos = function(deg){
	var rad = Degrees.toRadians(deg);
	return Math.cos(rad);
};

Degrees.atan = function(frac){
	var rad = Math.atan(frac);
	return rad * 180 / Math.PI;
};

//--------------------------------------------------------------------------
var Angle = $n2.Class('Angle',{
	
	degrees: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			degrees: undefined
			,radians: undefined
		},opts_);
		
		if( typeof opts.degrees === 'number' ){
			this.degrees = opts.degrees;
		} else if( typeof opts.radians === 'number' ){
			this.degrees = opts.radians * 180 / Math.PI;
		};
		
		if( typeof this.degrees !== 'number' ){
			throw new Error('An angle must be specified in degrees or radians');
		};
		
		this._adjust();
	},
	
	asDegrees: function(){
		return this.degrees;
	},
	
	asRadians: function(){
		return this.degrees * Math.PI / 180;
	},
	
	sin: function(){
		return Math.sin(this.degrees * Math.PI / 180);
	},
	
	cos: function(){
		return Math.cos(this.degrees * Math.PI / 180);
	},
	
	add: function(angle){
		return new Angle({
			degrees: (this.degrees + angle.degrees)
		});
	},
	
	subtract: function(angle){
		return new Angle({
			degrees: (this.degrees - angle.degrees)
		});
	},
	
	_adjust: function(){
		this.degrees = Degrees(this.degrees);
	}
});

//--------------------------------------------------------------------------
var AngleInterval = $n2.Class('AngleInterval',{
	
	min: null,

	max: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			min: undefined
			,max: undefined
		},opts_);
		
		this.min = opts.min;
		this.max = opts.max;
		
		if( typeof this.min === 'object' 
		 && typeof this.min.degrees === 'number' ){
			// OK
		} else {
			throw new Error('AngleInterval must be given an angle as min property');
		};
		
		if( typeof this.max === 'object' 
		 && typeof this.max.degrees === 'number' ){
			// OK
		} else {
			throw new Error('AngleInterval must be given an angle as max property');
		};
	},
	
	getMin: function(){
		return this.min;
	},
	
	getMax: function(){
		return this.max;
	},
	
	add: function(angle){
		var min = this.min.add(angle);
		var max = this.max.add(angle);
		
		return new AngleInterval({
			min: min
			,max: max
		});
	},
	
	subtract: function(angle){
		var min = this.min.subtract(angle);
		var max = this.max.subtract(angle);
		
		return new AngleInterval({
			min: min
			,max: max
		});
	},

	includes: function(angle){
		if( this.min.degrees === this.max.degrees ){
			if( this.min.degrees === angle.degrees ){
				return true;
			};

		} else if( this.min.degrees < this.max.degrees ){
			if( this.min.degrees <= angle.degrees 
			 && angle.degrees <= this.max.degrees ){
				return true;
			};

		} else if( this.min.degrees > this.max.degrees ){
			if( this.min.degrees >= angle.degrees 
			 || angle.degrees >= this.max.degrees ){
				return true;
			};
		};
		
		return false;
	}
});

//--------------------------------------------------------------------------
// Tree
// node: {
//    parent: <object> node that is parent of this one
//    children: <array> array of nodes that are children to this one
// }
function Tree(){
	
};
// Tree visiting
// root: node from which to start visit
// callback: function(node, depth){
// }
Tree.visitNodes = function(root, callback){
	if( typeof root === 'object' 
	 && null !== root 
	 && typeof callback === 'function' ){
		visitNode(root, 0, callback);
	};
	
	function visitNode(node, depth, callback){
		callback(node, depth);
		
		if( $n2.isArray(node.children) ){
			for(var i=0,e=node.children.length; i<e; ++i){
				var child = node.children[i];
				visitNode(child, (depth+1), callback);
			};
		};
	};
};
Tree.getNodeDepth = function(node){
	if( node && node.parent ){
		return 1 + Tree.getNodeDepth(node.parent);
	};
	return 0;
};
Tree.visitParents = function(node, callback){
	if( node && typeof callback === 'function' ){
		var depth = Tree.getNodeDepth(node);
		if( node.parent ){
			visitParent(node.parent, depth-1, callback);
		};
	};
	
	function visitParent(p, depth, callback){
		callback(p, depth);

		if( p.parent ){
			visitParent(p.parent, depth-1, callback);
		};
	};
};
Tree.isNodeInTree = function(n,root){
	if( !n ) return false;
	if( !root ) return false;
	
	if( n === root ) return true;

	return Tree.isNodeInTree(n.parent,root);
};
Tree.isRoot = function(n){
	if( n.parent ) return false;

	return true;
};

//--------------------------------------------------------------------------
// Fish eye distortion
function RadialFishEye(){
	var radius = 10,
    	distortion = 2,
    	k0,
    	k1,
    	focusAngle = null,
    	angleAttribute = function(d){
			return d.x;
		};
	
	function valueFromPoint(pointAngle) {
		if( typeof focusAngle !== 'number' ){
			return {x: pointAngle, z: 1};

		} else {
			var dx = Degrees(pointAngle) - focusAngle;
			
			if( dx > 180 ) dx -= 360;
			if( dx < -180 ) dx += 360;
			
			var dd = Math.abs(dx);
			if (dd >= radius) return {x: pointAngle, z: 1};
			if (!dd) return {x: pointAngle, z: distortion};
			
			// This formula returns a number between 1 and distortion
			var k = k0 * (1 - Math.exp(-dd * k1)) / dd * .75 + .25;
			
			var effAngle = Degrees(focusAngle + (dx * k));
			
			return {
				x: effAngle
				,z: Math.min(k, distortion)
			};
		};
    };

    function fisheye(d) {
		var pointAngle = angleAttribute(d);
		return valueFromPoint(pointAngle);
    };

    function rescale() {
        k0 = Math.exp(distortion);
        k0 = k0 / (k0 - 1) * radius;
        k1 = distortion / radius;
        return fisheye;
    };

    fisheye.compute = function(_) {
        return valueFromPoint( Degrees(_) );
    };

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
        if( typeof _ === 'number' ){
            focusAngle = Degrees(_);
        } else {
            focusAngle = _;
        };
        return fisheye;
    };

    fisheye.angleAttribute = function(_) {
        if (!arguments.length) return angleAttribute;
        if( typeof _ === 'function' ){
            angleAttribute = _;
        } else if( typeof _ === 'string' ){
            angleAttribute = function(d){
            	return d[_];
            };
        } else {
        	throw new Error('Invalid angleAttribute property');
        };
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
//               xMin: <number> minimum value on X-axis from children nodes
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
	
	reverseOrder: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			xSize: 1
			,ySize: 1
			,shownFn: null
			,assignFn: null
			,comparatorFn: null
			,reverseOrder: false
		},opts_);

		this.xSize = opts.xSize;
		this.ySize = opts.ySize;
		this.shown( opts.shownFn );
		this.assign( opts.assignFn );
		this.comparator( opts.comparatorFn );
		this.reverseOrder = opts.reverseOrder;
		
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
		
		// Capture the nodes that are shown, sorted in order
		// of presentation. Also, compute the depth of the tree.
		// The array 'nodesShown' is an array of node wrappers of the
		// following format:
		// {
		//     level: <number> depth at which the node is at [0,...]
		//     ,node: <object> An original node from the given tree
		//     ,parent: <object> Parent wrapper object, if any
		// }
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
		// Derived values: x, y, xIndent, yIndent, xMax, xMin
		for(var i=0,e=nodesShown.length; i<e; ++i){
			var wrapper = nodesShown[i];

			if( wrapper ){
				wrapper.x = i * xIndent;
				wrapper.y = wrapper.level * yIndent;
				wrapper.xIndent = xIndent;
				wrapper.yIndent = yIndent;
				
				assignMinMaxX(wrapper, wrapper.x);
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
				if( shown && !_this.reverseOrder ){
					anyNodeShown = true;
					
					nodesShown.push(wrapper);
				};
				
				if( node.children ){
					if( _this.comparatorFn ){
						var children = node.children.slice(0); // clone
						children.sort(_this.comparatorFn);
						if( _this.reverseOrder ){
							children.reverse();
						};
						processLevel(children, level+1, wrapper);
					} else {
						processLevel(node.children, level+1, wrapper);
					};
				};

				if( shown && _this.reverseOrder ){
					anyNodeShown = true;
					
					nodesShown.push(wrapper);
				};
			};
			
			if( anyNodeShown ){
				// Add a level, if needed
				if( numberOfLevels < level ){
					numberOfLevels = level;
				};
			};
		};
		
		function assignMinMaxX(wrapper, x){
			if( wrapper ){
				if( typeof wrapper.xMax !== 'number' ){
					wrapper.xMax = x;
				} else if( wrapper.xMax < x ){
					wrapper.xMax = x;
				};

				if( typeof wrapper.xMin !== 'number' ){
					wrapper.xMin = x;
				} else if( wrapper.xMin > x ){
					wrapper.xMin = x;
				};

				assignMinMaxX(wrapper.parent, x);
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

//--------------------------------------------------------------------------
// Instances of this class keep track of selections
var SelectionTracker = $n2.Class({
	
	dispatchService: null,
	
	selectedMap: null,
	
	//foundMap: null,
	
	onChangeFn: null,
	
	eventSourcesToIgnoreMap: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		this.selectedMap = {};
		//this.foundMap = {};
		this.eventSourcesToIgnoreMap = {};
		
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};

			this.dispatchService.register(DH, 'selected', f);
			this.dispatchService.register(DH, 'selectedSupplement', f);
			this.dispatchService.register(DH, 'unselected', f);
			this.dispatchService.register(DH, 'find', f);
		};
	},
	
	onChange: function(onChangeFn){
		if( typeof onChangeFn === 'function' ){
			this.onChangeFn = onChangeFn;
		};
	},
	
	addIgnoreEventSource: function(eventSource){
		this.eventSourcesToIgnoreMap[eventSource] = true;
	},
	
	_reportChange: function(){
		if( typeof this.onChangeFn === 'function' ){
			var map = {};
			for(var docId in this.selectedMap){
				map[docId] = true;
			};
//			for(var docId in this.foundMap){
//				map[docId] = true;
//			};
			this.onChangeFn(map);
		};
	},
	
	_performUnselected: function(suppressChangeReport){
		var changed = false;

		for(var docId in this.selectedMap){
			changed = true;
		};
//		for(var docId in this.foundMap){
//			changed = true;
//		};
		
		this.selectedMap = {};
//		this.foundMap = {};
		
		if( changed && !suppressChangeReport ){
			this._reportChange();
		};
		
		return changed;
	},
	
	_performSelected: function(docIds){
		var changed = this._performUnselected(true);
		
		if( typeof docIds === 'string' ){
			this.selectedMap[docIds] = true;
			changed = true;

		} else if( $n2.isArray(docIds) ){
			for(var i=0,e=docIds.length; i<e; ++i){
				var docId = docIds[i];
				this.selectedMap[docId] = true;
				changed = true;
			};
		};

		if( changed ){
			this._reportChange();
		};
		
		return changed;
	},
	
	_performSelectedSupplement: function(docId){
		var changed = false;
		
		if( !this.selectedMap[docId] ){
			this.selectedMap[docId] = true;
			changed = true;
		};

		if( changed ){
			this._reportChange();
		};
		
		return changed;
	},

	_performFind: function(docId){
		var changed = false;

//		if( !this.foundMap[docId] ){
//			this.foundMap[docId] = true;
//			changed = true;
//		};

		if( changed ){
			this._reportChange();
		};
		
		return changed;
	},
	
	_shoudIgnoreEvent: function(m){
		if( m._source ){
			if( this.eventSourcesToIgnoreMap[m._source] ){
				return true;
			};
		};
		
		return false;
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'selected' === m.type ){
			if( !this._shoudIgnoreEvent(m) ){
				if( m.docId ){
					this._performSelected(m.docId);
				} else if( m.docIds ){
					this._performSelected(m.docIds);
				};
			};

		} else if( 'selectedSupplement' === m.type ){
			if( !this._shoudIgnoreEvent(m) ){
				if( m.origin ){
					if( this.selectedMap[m.origin] ){
						this._performSelectedSupplement(m.docId);
					};
				} else if( m.docId ) {
					this._performSelectedSupplement(m.docId);
				};
			};

		} else if( 'unselected' === m.type ){
			if( !this._shoudIgnoreEvent(m) ){
				this._performUnselected();
			};

		} else if( 'find' === m.type ){
			if( !this._shoudIgnoreEvent(m) ){
				if( m.docId ) {
					this._performFind(m.docId);
				};
			};
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
	group: <string> (Optional. Grouping nodes)
	showArc: <boolean> (Optional. If set, an arc is drawn around this node)
}

Here are attributes added by the canvas:
{
	x: <number>  (value computed by layout)
	y: <number>  (value computed by layout)
	z: <number>  (value computed by magnify range 1 to distortion (generally 2). Defaults to 1)
	zFactor: <number>  (value representing how close nodes are, range 0 to 1. 0 is closer, 1 is farther)
	parent: <object>  (element which is parent to this one)
	children: <array> (elements which are children to this one)
	n2_geometry: <string> ('line' or 'point', depending on link or node)
	expanded: <boolean> True if the children of this element are to appear in the graph
	detailedView: <boolean> Set if the node or link is associated with the expanded nodes
	generalView: <boolean> Set if detailedView is not set
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
	
	radius: null,
 	
	background: null,
	
	toggleSelection: null,
	
	/*
	 * Rotation of the graph as an angle. Positive angle
	 * is clockwise.
	 */
	originAngle: null,
	
	transitionDuration: null,

	collapseBeforeExpand: null,
 	
	styleRules: null,

	/*
	 * Displayed nodes
	 */
	displayedNodesSorted: null,

	/*
	 * Displayed links. These are effective links
	 */
	displayedLinks: null,
	
	eventSource: null,
	
	elementGenerator: null,
	
	/*
	 * This is a dictionary of all elements received by the element
	 * generator, stored by id
	 */
	elementsById: null,

	/*
	 * This is a dictionary of all elements received by the element
	 * generator, organized by group names
	 */
	elementsByGroup: null,
	
	/*
	 * This is a dictionary of all elements received by the generator
	 * that are associated with a group. This dictionary maps element identifier
	 * to group name.
	 */
	elementIdToGroupName: null,

	elementsByDocId: null,
	
	/*
	 * This is a map of all effective elements, stored by
	 * id. Effective elements are displayed on the canvas.
	 * Some effective elements (like nodes) are the source elements
	 * received from the element generator. Other effective elements 
	 * are derived from the ones provided by the generator and might
	 * even combine multiple source elements.
	 */
	effectiveElementsById: null,

	/*
	 * Effective elements are derived from one or multiple
	 * source elements (the ones from the generator). This maps the
	 * source element ids to effective element ids
	 */
	elementToEffectiveId: null,
	
	dimensions: null,
	
	layout: null,
	
	line: null,
	
	bundle: null,
	
	magnifyOptions: null,
	
	magnify: null,
	
	magnifyThresholdCount: null,
	
	filterOptions: null,
	
	arcOptions: null,
 	
	currentMouseOver: null,

	lastElementIdSelected: null,
	
	selectedDocIdMap: null,
	
	expandedNodesById: null,
	
	/*
	 * This is a structure that is used when a node is expanded/collapsed.
	 * It stores the node is being that is expanded/collapsed and the position
	 * it had at time of expansion/collapse. Used to adjust originAngle. Format:
	 * {
	 * 	  id: <string> Node identifier
	 *    position: <number> Original position of node
	 * }
	 */
	fixOriginOnNode: null,
 	
	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,interactionId: null
			,config: null
			,moduleDisplay: null
			,sourceModelId: null
			,radius: 300
			,background: null
			,layout: null
			,line: null
			,magnify: null
			,styleRules: null
			,filter: null
			,arcs: null
			,toggleSelection: false
			,originAngle: 0
			,transitionDuration: 250
			,collapseBeforeExpand: true
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
		this.radius = 0 + opts.radius;
		this.background = opts.background;
		this.toggleSelection = opts.toggleSelection;
		this.elementGenerator = opts.elementGenerator;
		this.transitionDuration = opts.transitionDuration;
		this.collapseBeforeExpand = opts.collapseBeforeExpand;
 		
		this.modelId = $n2.getUniqueId('collapsibleRadialTreeCanvas');
 		
		this.styleRules = $n2.styleRule.loadRulesFromObject(opts.styleRules);
 		
		var config = opts.config;
		if( config ){
			if( config.directory ){
				this.dispatchService = config.directory.dispatchService;
			};
		};
		
		// originAngle
		if( typeof opts.originAngle !== 'number' ){
			opts.originAngle = 0 + opts.originAngle;
		};
		if( typeof opts.originAngle !== 'number' ){
			opts.originAngle = 0;
		};
		this.originAngle = Degrees(opts.originAngle);

 		this.elementsByGroup = {};
 		this.elementIdToGroupName = {};
 		this.displayedNodesSorted = [];
 		this.displayedLinks = [];
 		this.currentMouseOver = null;
 		this.elementsById = {};
 		this.elementsByDocId = {};
 		this.effectiveElementsById = {};
 		this.elementToEffectiveId = {};
 		this.dimensions = {};
 		this.lastElementIdSelected = null;
 		this.focusInfo = null;
 		this.selectInfo = null;
 		this.magnifyThresholdCount = null;
 		this.selectedDocIdMap = null;
 		this.expandedNodesById = {};
 		this.fixOriginOnNode = null;

 		// Element generator
 		this.eventSource = 'CollapsibleRadialTreeCanvas_' + uniqueId;
 		++uniqueId;
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
			
			if( typeof this.elementGenerator.setEventSource === 'function' ){
				this.elementGenerator.setEventSource(this.eventSource);
			};
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
			this.dispatchService.register(DH,'find', f);
			
			// Track selection
			this.selectionTracker = new SelectionTracker({
				dispatchService: this.dispatchService
			});
			this.selectionTracker.addIgnoreEventSource(this.eventSource);
			this.selectionTracker.onChange(function(docIdMap){
				_this._selectionChanged(docIdMap);
			});
 		};
 		
 		this.createGraph();
 		
 		var layoutOptions = $n2.extend(
 			{
	 			reverseOrder: false
	 		}
	 		,opts.layout
	 		,{
	 			xSize: 360
	 			,assignFn: function(node,v){
	 				node.x = v.x;
	 				node.xMax = v.xMax;
	 				node.xMin = v.xMin;
	 				node.xIndent = v.xIndent;
	 				node.y = _this.dimensions.radius;
	 			}
	 			,shownFn: function(node){
	 				if( node.canvasVisible ) return true;
	 				if( node.canvasVisibleDerived ) return true;
	 				return false;
	 			}
	 			,comparatorFn: function(n1, n2){
	 				if( n1.sortValue < n2.sortValue ) return -1;
	 				if( n1.sortValue > n2.sortValue ) return 1;
	 				return 0;
	 			}
	 		}
	 	);
 		this.layout = new CollapsibleLayout(layoutOptions);

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
 		this.magnifyOptions = $n2.extend({
 			enabled: true
 			,radius: 10
 			,distortion: 2
 			,thresholdCount: 100
 		},opts.magnify);
 		this.magnify = RadialFishEye()
 			.radius(10)
 			.distortion(2)
 			.angleAttribute(function(n){
 				return n.orig_x;
 			})
 			;
 		for(var optionName in this.magnifyOptions){
 			var value = this.magnifyOptions[optionName];
 			
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
 		
 		// Filter options
 		this.filterOptions = $n2.extend({
 			expand: false
 			,showGroupMembers: true
 		},opts.filter);
 		
 		// Arc options
 		this.arcOptions = $n2.extend({
 			show: true
 			,offset: 0
 			,extent: 200
 		},opts.arcs);
 		
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
 		var $svg = d3.select('#' + this.canvasId)
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
			.on('click', function(){
 				_this._initiateBackgroundMouseClick();
 			})
			.on('mouseover',function(){
				var e = d3.event;
				_this._magnifyLocation(e);
			})
			.on('mousemove',function(){
				var e = d3.event;
				_this._magnifyLocation(e);
			})
			;

		$rootGroup.append('g')
			.attr('class','arcs');

		$rootGroup.append('g')
 			.attr('class','links');

		$rootGroup.append('g')
 			.attr('class','nodes');

//		$rootGroup.append('g')
//			.attr('class','controls');

		$rootGroup.append('g')
 			.attr('class','labels');
 		
 		this.resizeGraph();

 		// Report canvas
 		if( this.dispatchService ){
 			var m = {
 				type: 'canvasReportSvg'
 				,canvasType: 'collapsibleRadialTree'
 				,canvas: this
 				,svg: undefined
 			};
 			$svg.each(function(){
 				m.svg = this;
 			});
 			this.dispatchService.send(DH,m);
 		};
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
 		var maxTextWidth = standardDim - this.radius;
 		
 		this.dimensions = {
 			width: size[0]
 			,height: size[1]
 			,cx: Math.floor(size[0]/2)
 			,cy: Math.floor(size[1]/2)
 			,canvasWidth: minDim
 			,radius: Math.floor( this.radius )
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
 		return d3.select('#' + this.svgId);
 	},
	
	_elementsChanged: function(addedElements, updatedElements, removedElements){

		// Remove elements that are no longer there
		for(var i=0,e=removedElements.length; i<e; ++i){
			var removed = removedElements[i];
			delete this.elementsById[removed.id];
			
			// Groups
			var groupName = this.elementIdToGroupName[removed.id];
			if( groupName ){
				var groupElems = this.elementsByGroup[groupName];
				if( groupElems ){
					groupElems = groupElems.filter(function(elem){
						if( elem.id === removed.id ){
							return false;
						};
						return true;
					});
					this.elementsByGroup[groupName] = groupElems;
				};
				
				delete this.elementIdToGroupName[removed.id];
			};
		};
		
		// Add elements
		for(var i=0,e=addedElements.length; i<e; ++i){
			var added = addedElements[i];
			this.elementsById[ added.id ] = added;
			
			// Groups
			if( added.group ){
				var groupName = added.group;
				var groupElems = this.elementsByGroup[groupName];
				if( !groupElems ){
					groupElems = [];
					this.elementsByGroup[groupName] = groupElems;
				};
				groupElems.push(added);
				this.elementIdToGroupName[added.id] = groupName;
			};
		};
		
		// Update elements
		for(var i=0,e=updatedElements.length; i<e; ++i){
			var updated = updatedElements[i];
			this.elementsById[ updated.id ] = updated;
			
			// Groups
			var groupName = this.elementIdToGroupName[updated.id];
			if( groupName !== updated.group ){
				if( groupName ){
					var groupElems = this.elementsByGroup[groupName];
					if( groupElems ){
						groupElems = groupElems.filter(function(elem){
							if( elem.id === updated.id ){
								return false;
							};
							return true;
						});
						this.elementsByGroup[groupName] = groupElems;
					};

					delete this.elementIdToGroupName[updated.id];
				};
				
				if( updated.group ){
					var groupName = updated.group;
					var groupElems = this.elementsByGroup[groupName];
					if( !groupElems ){
						groupElems = [];
						this.elementsByGroup[groupName] = groupElems;
					};
					groupElems.push(updated);
					this.elementIdToGroupName[updated.id] = groupName;
				};
			};
		};
		
		// Update list of documents that can be found
		this.elementsByDocId = {};
		for(var id in this.elementsById){
			var element = this.elementsById[id];
			if( element.fragments ){
				for(var fragId in element.fragments){
					var frag = element.fragments[fragId];
					
					var context = frag.context;
					if( context ){
						var doc = context.n2_doc;
						if( doc ){
							var docId = doc._id;
							
							var elements = this.elementsByDocId[docId];
							if( !elements ){
								elements = [];
								this.elementsByDocId[docId] = elements;
							};
							elements.push(element);
						};
					};
				};
			};
		};
		
		this._createGraphicalElements();
		
		this.dispatchService.send(DH,{
			type: 'findAvailabilityChanged'
		});
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
			delete elem.zFactor;
			delete elem.orig_x;
			delete elem.expanded;
		};
		
		// Reset effective map
		this.effectiveElementsById = {};
		this.elementToEffectiveId = {};
		
		// If nodes have been selected, recomute expanded map
		if( this.selectedDocIdMap ){
			
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
		var sourceLinks = [];
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
				sourceLinks.push(elem);
			};
		};
		
		// Find which nodes are visible
		if( this.filterOptions.expand ){
			var deepestExpandedNode = undefined;
			var maxDepth = -1;
			
			// Compute which nodes are available for display
			Tree.visitNodes(root,function(n,d){
				n.canvasVisible = false;
				n.canvasVisibleDerived = false;
				
				if( n.expanded && maxDepth < d ){
					deepestExpandedNode = n;
					maxDepth = d;
				};

				if( root === n ){
					n.canvasAvailable = false;
				} else if( n.parent && isExpandedNode(n.parent) ) {
					n.canvasAvailable = true;
				} else {
					n.canvasAvailable = false;
				};
			});
			
			// The children of the deepest expanded node are visible, including
			// the parents
			if( deepestExpandedNode && deepestExpandedNode.children ){
				for(var i=0,e=deepestExpandedNode.children.length; i<e; ++i){
					var node = deepestExpandedNode.children[i];
					node.canvasVisible = true;
				};
				
				deepestExpandedNode.canvasVisible = true;

				Tree.visitParents(deepestExpandedNode, function(n,d){
					if( root === n ){
						n.canvasVisible = false;
					} else {
						n.canvasVisible = true;
					};
				});
			};
			
			// Nodes that are linked to visible ones are also visible
			for(var i=0,e=sourceLinks.length; i<e; ++i){
				var link = sourceLinks[i];

				var sourceNodeVisible = findVisibleNode(link.source);
				var targetNodeVisible = findVisibleNode(link.target);

				var sourceNodeAvailable = findAvailableNode(link.source);
				var targetNodeAvailable = findAvailableNode(link.target);
				
				if( sourceNodeVisible && targetNodeVisible ){
					// Both are visible, nothing to do
				} else if( sourceNodeVisible && targetNodeAvailable ){
					targetNodeAvailable.canvasVisibleDerived = true;
				} else if( targetNodeVisible && sourceNodeAvailable ){
					sourceNodeAvailable.canvasVisibleDerived = true;
				};
			};

			// If by option, we show nodes that are grouped, then
			// add back the nodes that are grouped
			var showGroupMembers = this.filterOptions.showGroupMembers;
			Tree.visitNodes(root,function(n,d){
				if( showGroupMembers && n.group ){
					n.canvasAvailable = true;
					n.canvasVisible = true;
				};
			});
			
		} else {
			// Do not filter on expand
			Tree.visitNodes(root,function(n,d){
				if( root === n ){
					n.canvasVisible = false;
				} else if( n.parent && n.parent.expanded ) {
					n.canvasVisible = true;
				} else {
					n.canvasVisible = false;
				};
			});
		};
		
		// Never show root node
		root.canvasVisible = false;
		root.canvasVisibleDerived = false;

		// Layout tree (sets x and y)
		this.displayedNodesSorted = this.layout.nodes(root);
		
		// Adjust origin based on expanded/collapsed node
		if( this.fixOriginOnNode ){
			var nodeId = this.fixOriginOnNode.id;
			var position = this.fixOriginOnNode.position;
			this.fixOriginOnNode = null;
			
			if( typeof position === 'number' ){
				for(var i=0,e=this.displayedNodesSorted.length; i<e; ++i){
					var node = this.displayedNodesSorted[i];
					if( nodeId === node.id ){
						var offset = position - node.x;
						this.originAngle = Degrees(this.originAngle + offset);
					};
				};
			};
		};
		
		// Create links. Here, we collapse the links that join two visible nodes.
		// Since some nodes are collapsed into one, links can collide on source/target
		// combination. 
		this.displayedLinks = [];
		for(var i=0,e=sourceLinks.length; i<e; ++i){
			var elem = sourceLinks[i];
			var elemId = elem.id;

			var sourceNode = findShownNode(elem.source);
			var targetNode = findShownNode(elem.target);
			
			if( sourceNode && targetNode ){
				var effectiveLinkId = computeEffectiveLinkId(sourceNode,targetNode);
				var effectiveLink = this.effectiveElementsById[effectiveLinkId];
				if( !effectiveLink ){
					effectiveLink = {
						id: effectiveLinkId
						,isLink: true
						,source: sourceNode
						,target: targetNode
						,elementIds: [
							sourceNode.id
							,targetNode.id
						]
						,fragments: {}
						,n2_geometry: 'line'
					};
					this.effectiveElementsById[effectiveLinkId] = effectiveLink;
					this.displayedLinks.push(effectiveLink);
				};
				
				// Adopt the fragments from both nodes. This is to perform translation
				// of selection to the model
				adoptFragments(effectiveLink, sourceNode);
				adoptFragments(effectiveLink, targetNode);
				
				// Remember mapping from element to effective link
				this.elementToEffectiveId[elemId] = effectiveLinkId;

			};
		};

		// Compute paths for displayed links
		for(var i=0,e=this.displayedLinks.length; i<e; ++i){
			var link = this.displayedLinks[i];
			var path = [link.source, root, link.target];
			link.path = path;
			
			// Adjust intent
			this._refreshEffectiveLinkIntent(link);
		};

		// Adjust nodes and sort
		var zFactor = 1;
		if( this.displayedNodesSorted.length > 0 ){
			zFactor = 80 / this.displayedNodesSorted.length;
			if( zFactor > 1 ){
				zFactor = 1;
			};
		};
		for(var i=0,e=this.displayedNodesSorted.length; i<e; ++i){
			var node = this.displayedNodesSorted[i];

			node.n2_geometry = 'point';
			node.orig_x = Degrees(node.x + this.originAngle);
			delete node.x;
			
			if( typeof node.xMax === 'number' ){
				node.xMax = Degrees(node.xMax + this.originAngle);
			};
			if( typeof node.xMin === 'number' ){
				node.xMin = Degrees(node.xMin + this.originAngle);
			};
			
			node.zFactor = zFactor;
			
			// Add to map of displayed elements
			this.effectiveElementsById[node.id] = node;
		};
		
		// Assign attributes on nodes and links to keep track of which part of the
		// graph is part of the detailed look. The algorithm here is to:
		// 1. visit all nodes and comute their depth
		// 2. all nodes with the largest depth, assign the attribute "detailedView"
		// 3. all links that touch a node "detailedView" is marked as "detailedView"
		// 4. all nodes that touch a link "detailedView" is marked as "detailedView"
		// 5. all nodes and links that are not marked "detailedView", are mark "generalView"
		{
			var maxDepth = undefined;
			var maxDepthNodes = undefined;
			Tree.visitNodes(root,function(n,depth){
				delete n.detailedView;
				delete n.generalView;

				if( n.canvasVisible || n.canvasVisibleDerived ){
					if( typeof maxDepth === 'number' ){
						if( maxDepth < depth ){
							maxDepth = depth;
							maxDepthNodes = [];
							maxDepthNodes.push(n);
						} else if( maxDepth === depth ){
							maxDepthNodes.push(n);
						};
					} else {
						maxDepth = depth;
						maxDepthNodes = [];
						maxDepthNodes.push(n);
					};
				};
			});
			
			// Assign "detailedView" to the deepest nodes
			if( maxDepthNodes ){
				for(var i=0,e=maxDepthNodes.length; i<e; ++i){
					var node = maxDepthNodes[i];
					node.detailedView = true;
				};
			};
	
			// Propagate detailedView to links
			for(var i=0,e=this.displayedLinks.length; i<e; ++i){
				var link = this.displayedLinks[i];
				
				delete link.detailedView;
				delete link.generalView;

				if( link.source.detailedView ){
					link.detailedView = true;
				} else if( link.target.detailedView ){
					link.detailedView = true;
				} else {
					link.generalView = true;
				};
			};

			// Propagate detailedView from links to nodes
			for(var i=0,e=this.displayedLinks.length; i<e; ++i){
				var link = this.displayedLinks[i];

				if( link.detailedView ){
					link.source.detailedView = true;
					link.target.detailedView = true;
				};
			};
			
			// Assign general view to nodes
			for(var i=0,e=this.displayedNodesSorted.length; i<e; ++i){
				var node = this.displayedNodesSorted[i];

				if( !node.detailedView ){
					node.generalView = true;
				};
			};
		};

		// Compute derived intents
		this._computeDerivedIntent({}, {});
		
		this._documentsUpdated(this.displayedNodesSorted, this.displayedLinks);
		
		function findVisibleNode(n){
			if( !n ) return null;

			if( !Tree.isNodeInTree(n,root) ){
				return null;
			};
			
			if( n.canvasVisible ) return n;
			
			var parent = n.parent;
			if( !parent ) return null;

			return findVisibleNode(parent);
		};

		function findAvailableNode(n){
			if( !n ) return null;

			if( !Tree.isNodeInTree(n,root) ){
				return null;
			};
			
			if( n.canvasAvailable ) return n;
			
			var parent = n.parent;
			if( !parent ) return null;

			return findAvailableNode(parent);
		};
		
		/*
		 * A node is expanded if it is marked expanded and all
		 * parents are also expanded
		 */
		function isExpandedNode(n){
			if( !n ) return false;

			if( !Tree.isNodeInTree(n,root) ){
				return false;
			};
			
			if( !n.expanded ){
				return false;
			};
			
			if( n.parent && !isExpandedNode(n.parent) ){
				return false;
			};
			
			return true;
		};

		function findShownNode(n){
			if( !n ) return null;

			if( !Tree.isNodeInTree(n,root) ){
				return null;
			};
			
			if( n.canvasVisible ) return n;
			if( n.canvasVisibleDerived ) return n;
			
			var parent = n.parent;
			if( !parent ) return null;

			return findVisibleNode(parent);
		};
		
		function computeEffectiveLinkId(node1,node2){
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
	
	_refreshEffectiveLinkIntent: function(effectiveElement){
		// On links, all elements must be selected for the link to
		// be selected. Start assuming that the link is selected. If any
		// element is not selected, then turn off selection
		effectiveElement.n2_selected = true;
		effectiveElement.n2_selectedIntent = undefined;
		effectiveElement.n2_hovered = true;
		effectiveElement.n2_hoveredIntent = undefined;
		effectiveElement.n2_found = true;
		effectiveElement.n2_intent = undefined;
		
		var atLeastOneElement = false;
		if( effectiveElement.elementIds ){
			for(var i=0,e=effectiveElement.elementIds.length; i<e; ++i){
				var elemId = effectiveElement.elementIds[i];
				var elem = this.elementsById[elemId];
				
				if( elem ){
					atLeastOneElement = true;
					
					if( !elem.n2_selected ){
						effectiveElement.n2_selected = false;
					};
					if( !elem.n2_hovered ){
						effectiveElement.n2_hovered = false;
					};
					if( !elem.n2_found ){
						effectiveElement.n2_found = false;
					};
					if( elem.n2_selectedIntent ){
						if( effectiveElement.n2_selectedIntent === null ){
							// collision
						} else if( effectiveElement.n2_selectedIntent === undefined ){
							effectiveElement.n2_selectedIntent = elem.n2_selectedIntent;
						} else {
							effectiveElement.n2_selectedIntent = null;
						};
					};
					if( elem.n2_hoveredIntent ){
						if( effectiveElement.n2_hoveredIntent === null ){
							// collision
						} else if( effectiveElement.n2_hoveredIntent === undefined ){
							effectiveElement.n2_hoveredIntent = elem.n2_hoveredIntent;
						} else {
							effectiveElement.n2_hoveredIntent = null;
						};
					};
					if( elem.n2_intent ){
						if( effectiveElement.n2_intent === null ){
							// collision
						} else if( effectiveElement.n2_intent === undefined ){
							effectiveElement.n2_intent = elem.n2_intent;
						} else {
							effectiveElement.n2_intent = null;
						};
					};
				};
			};
		};
		
		// It is not selected if not associated with any element
		if( !atLeastOneElement ){
			effectiveElement.n2_selected = false;
			effectiveElement.n2_hovered = false;
			effectiveElement.n2_intent = false;
		};
		
		// Turn off intent if not selected
		if( !effectiveElement.n2_selected ){
			effectiveElement.n2_selectedIntent = undefined;
		};
		if( !effectiveElement.n2_hovered ) {
			effectiveElement.n2_hoveredIntent = undefined;
		};
		if( !effectiveElement.n2_found ){
			effectiveElement.n2_intent = undefined;
		};
	},
	
	_computeDerivedIntent: function(changedNodeMap, changedLinkMap){
 		// Count number of visible nodes selected and hovered.
 		var nodesSelectedCount = 0;
		var nodesHoveredCount = 0;
		for(var elemId in this.effectiveElementsById){
			var elem = this.effectiveElementsById[elemId];
			if( elem.isNode ){
				if( elem.n2_selected ){
					++nodesSelectedCount;
				};
				if( elem.n2_hovered ){
					++nodesHoveredCount;
				};
			};
		};

 		// Compute derived selection and hover
		for(var elemId in this.effectiveElementsById){
			var elem = this.effectiveElementsById[elemId];
			
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

				// If a link is associated with a node which is the sole node selected,
				// then both the link and the other node are selected (derived)
				if( elem.source.n2_selected 
				 && nodesSelectedCount < 2 ){
					elem.temp_selected = true;
					elem.target.temp_selected = true;
				};
				if( elem.target.n2_selected 
				 && nodesSelectedCount < 2 ){
					elem.temp_selected = true;
					elem.source.temp_selected = true;
				};

				// If a link is associated node which is the sole node hovered,
				// then both the link and the other node are hovered (derived)
				if( elem.source.n2_hovered 
				 && nodesHoveredCount < 2 ){
					elem.temp_hovered = true;
					elem.target.temp_hovered = true;
				};
				if( elem.target.n2_hovered 
				 && nodesHoveredCount < 2 ){
					elem.temp_hovered = true;
					elem.source.temp_hovered = true;
				};
			};
		};

 		// Detect changes in derived selection and hover
		for(var elemId in this.effectiveElementsById){
			var elem = this.effectiveElementsById[elemId];
			
			if( elem.n2_derived_selected !== elem.temp_selected ){
				elem.n2_derived_selected = elem.temp_selected;
				if( elem.isLink ){
					changedLinkMap[elem.id] = elem;
				} else if( elem.isNode ){
					changedNodeMap[elem.id] = elem;
				};
			};
			
			if( elem.n2_derived_hovered !== elem.temp_hovered ){
				elem.n2_derived_hovered = elem.temp_hovered;
				if( elem.isLink ){
					changedLinkMap[elem.id] = elem;
				} else if( elem.isNode ){
					changedNodeMap[elem.id] = elem;
				};
			};
		};
	},
	
	_intentChanged: function(changedElements){
		// Reset all temp variables
		for(var elemId in this.effectiveElementsById){
			var elem = this.effectiveElementsById[elemId];
			elem.temp_hovered = false;
			elem.temp_selected = false;
		};

		// Keep track of modified nodes and links
		var nodeMap = {};
 		var linkMap = {};

		// Update effective elements from the ones received from the element generator
		var effectiveIdsToUpdate = {};
		for(var i=0,e=changedElements.length; i<e; ++i){
			var changedElement = changedElements[i];
			var changedElementId = changedElement.id;
			var changedEffectiveElementId = this.elementToEffectiveId[changedElementId];
			if( changedEffectiveElementId ){
				effectiveIdsToUpdate[changedEffectiveElementId] = true;
			} else {
				effectiveIdsToUpdate[changedElementId] = true;
			};
		};
		for(var changedEffectiveElementId in effectiveIdsToUpdate){
			var effectiveElement = this.effectiveElementsById[changedEffectiveElementId];
			if( effectiveElement ){
				if( effectiveElement.isNode ){
	 				nodeMap[effectiveElement.id] = effectiveElement;
				} else if( effectiveElement.isLink ){
					this._refreshEffectiveLinkIntent(effectiveElement);
	 				linkMap[effectiveElement.id] = effectiveElement;
				};
			};
		};

		// Compute derived intent
		this._computeDerivedIntent(nodeMap, linkMap);

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

// 		var selectedControls = this._getSvgElem().select('g.controls').selectAll('.control')
//			.data(nodes, function(node){ return node.id; });
// 		this._adjustElementStyles(selectedControls);

 		var selectedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
			.data(nodes, function(node){ return node.id; });
		this._adjustElementStyles(selectedLabels);

		if( this.arcOptions.show ){
	 		var selectedArcs = this._getSvgElem().select('g.arcs').selectAll('.arc')
				.data(nodes, function(node){ return node.id; });
			this._adjustElementStyles(selectedArcs);
		};

 		// Update style on links
 		var selectedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(links, function(link){ return link.id; });
 		this._adjustElementStyles(selectedLinks, true);
 		
 		this._reOrderElements();
	},
	
	_reOrderElements: function(){
 		// Re-order the lines so that hovered are above selected, and selected are above
 		// regular
 		this._getSvgElem()
 			.select('g.links')
 			.selectAll('.link')
			.data(this.displayedLinks, function(link){ return link.id; })
			.filter(function(l){return l.n2_selected;})
			.each(function(l){
	 			var svgLink = this;
	 			svgLink.parentNode.appendChild(svgLink);
	 		})
			;
 		this._getSvgElem()
			.select('g.links')
			.selectAll('.link')
			.data(this.displayedLinks, function(link){ return link.id; })
			.filter(function(l){return l.n2_found;})
			.each(function(l){
	 			var svgLink = this;
	 			svgLink.parentNode.appendChild(svgLink);
	 		})
			;
 		this._getSvgElem()
			.select('g.links')
			.selectAll('.link')
			.data(this.displayedLinks, function(link){ return link.id; })
			.filter(function(l){return l.n2_hovered;})
			.each(function(l){
	 			var svgLink = this;
	 			svgLink.parentNode.appendChild(svgLink);
	 		})
			;

 		// Re-order the arcs so that hovered are above found, found are above
 		// selected, and selected are above regular
 		this._getSvgElem()
 			.select('g.arcs')
 			.selectAll('.arc')
			.data(this.displayedNodesSorted, function(n){ return n.id; })
			.filter(function(n){return n.n2_selected;})
			.each(function(n){
	 			var elem = this;
	 			elem.parentNode.appendChild(elem);
	 		})
			;
 		this._getSvgElem()
			.select('g.arcs')
			.selectAll('.arc')
			.data(this.displayedNodesSorted, function(n){ return n.id; })
			.filter(function(n){return n.n2_found;})
			.each(function(n){
	 			var elem = this;
	 			elem.parentNode.appendChild(elem);
	 		})
			;
 		this._getSvgElem()
			.select('g.arcs')
			.selectAll('.arc')
			.data(this.displayedNodesSorted, function(n){ return n.id; })
			.filter(function(n){return n.n2_hovered;})
			.each(function(n){
	 			var elem = this;
	 			elem.parentNode.appendChild(elem);
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
 				return "rotate(" + Degrees(d.orig_x - 90) + ")translate(" + d.y + ",0)"; 
 			})
 			.on('click', function(n,i){
 				_this._initiateMouseClick(n);
 			})
 			.on('mouseover', function(n,i){
 				_this._initiateMouseOver(n);
 				_this._magnifyLocation(d3.event);
 			})
 			.on('mousemove', function(n,i){
 				_this._magnifyLocation(d3.event);
 			})
 			.on('mouseout', function(n,i){
 				_this._initiateMouseOut(n);
 			})
 			;
 		this._adjustElementStyles(createdNodes);

 		selectedNodes.exit().remove();

 		// Elements that are used to expand/collapse nodes
// 		var controlData = updatedNodeData.filter(function(node){
//			return node.children ? (node.children.length > 0) : false;
//		});
// 		var selectedControls = this._getSvgElem().select('g.controls').selectAll('.control')
// 			.data(controlData, function(node){ return node.id; })
// 			;
//
// 		var createdControls = selectedControls.enter()
// 			.append('circle')
// 			.attr('class','control')
// 			.attr("r", 3)
// 			.attr("transform", function(d) { 
// 				return "rotate(" + Degrees(d.orig_x - 90) + ")translate(" + (d.y + 10) + ",0)"; 
// 			})
// 			.on('click', function(n,i){
// 				_this._initiateExpandCollapse(n);
// 			})
// 			.on('mouseover', function(n,i){
// 				_this._initiateMouseOver(n);
// 				_this._magnifyLocation(d3.event);
// 			})
// 			.on('mousemove', function(n,i){
// 				_this._magnifyLocation(d3.event);
// 			})
// 			.on('mouseout', function(n,i){
// 				_this._initiateMouseOut(n);
// 			})
// 			;
// 		this._adjustElementStyles(createdControls);
//
// 		selectedControls.exit().remove();
//
// 		this._adjustElementStyles(selectedControls);

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
 				return "rotate(" + Degrees(d.orig_x - 90) + ")translate(" + (d.y + 6) + ",0)" 
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
 				_this._initiateExpandCollapse(n);
 			})
 			.on('mouseover', function(n,i){
 				_this._initiateMouseOver(n);
 				_this._magnifyLocation(d3.event);
 			})
 			.on('mousemove', function(n,i){
 				_this._magnifyLocation(d3.event);
 			})
 			.on('mouseout', function(n,i){
 				_this._initiateMouseOut(n);
 			})
 			;
 		this._adjustElementStyles(createdLabels);
 		
 		selectedLabels.exit().remove();

		this._adjustElementStyles(selectedLabels);

		// Elements that are used to draw arcs to show parent/children relationship
		if( this.arcOptions.show ){
			var arcData = updatedNodeData.filter(function(node){
				return (typeof node.showArc === 'boolean') ? node.showArc : false;
			});
	 		var selectedArcs = this._getSvgElem().select('g.arcs').selectAll('.arc')
	 			.data(arcData,function(node){ return node.id; });
	
	 		var createdArcs = selectedArcs.enter()
	 			.append('path')
	 			.attr('class','arc')
	 			.on('click', function(n,i){
	 				_this._initiateMouseClick(n);
	 				_this._initiateExpandCollapse(n);
	 			})
	 			.on('mouseover', function(n,i){
	 				_this._initiateMouseOver(n);
	 				_this._magnifyLocation(d3.event);
	 			})
	 			.on('mousemove', function(n,i){
	 				_this._magnifyLocation(d3.event);
	 			})
	 			.on('mouseout', function(n,i){
	 				_this._initiateMouseOut(n);
	 			})
	 			;
	 		this._adjustElementStyles(createdArcs);
	
	 		selectedArcs.exit().remove();
	
	 		this._adjustElementStyles(selectedArcs);
		};

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
 		this._reOrderElements();
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
			angle = Degrees.atan(effX / effY);
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
 		
 		var magnifyEnabled = this.magnifyOptions.enabled;
 		if( magnifyEnabled 
 		 && typeof this.magnifyThresholdCount === 'number' 
 		 && this.magnifyThresholdCount > this.displayedNodesSorted.length ){
 			magnifyEnabled = false;
 		};
 		
 		var changedNodes = [];
 		for(var i=0,e=this.displayedNodesSorted.length; i<e; ++i){
 			var node = this.displayedNodesSorted[i];

 			node.transitionNeeded = false;
 			var m = null;

 			if( magnifyEnabled ){
 	 			m = magnifyNode(node);
 	 			
 			} else {
 				m = {};
 				m.x = node.orig_x;
 				m.z = 1;

 				if( typeof node.xMax === 'number' ){
 	 				m.xArcStart = node.xMin - (node.xIndent / 2);
 	 				m.xArcEnd = node.xMax + (node.xIndent / 2);
 	 			};
 			};

 			var changed = false;
 			if( assignToNode(node, 'x', m.x) ){
 				changed = true;
 			};
 			if( assignToNode(node, 'z', m.z) ){
 				changed = true;
 			};
 			if( assignToNode(node, 'xArcStart', m.xArcStart) ){
 				changed = true;
 			};
 			if( assignToNode(node, 'xArcEnd', m.xArcEnd) ){
 				changed = true;
 			};
			
			if( changed ){
 				node.transitionNeeded = true;
 				changedNodes.push(node);
			};
 		};
 		
		// Animate the position of the nodes around the circle
 		var changedPoints = this._getSvgElem().select('g.nodes').selectAll('.node')
			.data(changedNodes, function(node){ return node.id; });
 		
		changedPoints
			.transition()
			.duration(this.transitionDuration)
			.attr("transform", function(d) { 
				return "rotate(" + (d.x - 90) 
					+ ")translate(" + d.y + ",0)"; 
			})
			;
 		
 		this._adjustElementStyles(changedPoints);

		// Animate the position of the controls around the circle
// 		var changedControls = this._getSvgElem().select('g.controls').selectAll('.control')
//			.data(changedNodes, function(node){ return node.id; });
// 		
// 		changedControls
// 			.transition()
//			.duration(this.transitionDuration)
//			.attr("transform", function(d) { 
//				return "rotate(" + (d.x - 90) 
//					+ ")translate(" + (d.y + 10) + ",0)"; 
//			})
//			;
// 		
// 		this._adjustElementStyles(changedControls);

		// Animate the position of the labels around the circle
 		var changedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
			.data(changedNodes, function(node){ return node.id; })
			;
 		
		changedLabels
			.transition()
			.duration(this.transitionDuration)
			.attr("transform", function(d) { 
				return "rotate(" + (d.x - 90) 
					+ ")translate(" + (d.y + 6) + ",0)" 
					+ (d.x < 180 ? "" : "rotate(180)"); 
			})
 			.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			;
 		
 		this._adjustElementStyles(changedLabels);

 		// Animate the position of the arcs around the circle
		if( this.arcOptions.show ){
	 		var changedArcs = this._getSvgElem().select('g.arcs').selectAll('.arc')
				.data(changedNodes, function(node){ return node.id; });
	 		
	 		var arcOffset = this.arcOptions.offset;
	 		var arcExtent = this.arcOptions.extent;
	 		
	 		changedArcs
	 			.transition()
				.duration(this.transitionDuration)
		 		.attr('transform', function(d) { 
					return 'rotate(-90)';
				})
				.attr('d', function(d) {
					var innerRadius = d.y + arcOffset;
					var outerRadius = d.y + arcOffset + arcExtent;
					var angleExtent = Degrees(d.xArcEnd - d.xArcStart);
					
					var x1 = innerRadius * Degrees.cos(d.xArcStart);
					var y1 = innerRadius * Degrees.sin(d.xArcStart);
					
					var x2 = innerRadius * Degrees.cos(d.xArcEnd);
					var y2 = innerRadius * Degrees.sin(d.xArcEnd);
					
					var x3 = outerRadius * Degrees.cos(d.xArcEnd);
					var y3 = outerRadius * Degrees.sin(d.xArcEnd);
	
					var x4 = outerRadius * Degrees.cos(d.xArcStart);
					var y4 = outerRadius * Degrees.sin(d.xArcStart);
	
					// A rx ry x-axis-rotation large-arc-flag sweep-flag x y
					var path = [
					   'M', x1, y1
					   ,'A', innerRadius, innerRadius, '0'
					   ,(angleExtent > 180 ? '1' : '0') // large arc
					   ,'1', x2, y2
					   ,'L', x3, y3
					   ,'A', outerRadius, outerRadius, '0'
					   ,(angleExtent > 180 ? '1' : '0') // large arc
					   ,'0', x4, y4
					   ,'Z'
					].join(' ');
					return path;
				})
				;
	 		
	 		this._adjustElementStyles(changedArcs);
		};

 		// Animate links
 		this._getSvgElem().select('g.links').selectAll('.link')
			.data(this.displayedLinks, function(link){ return link.id; })
			.filter(function(link){
				if( link.source.transitionNeeded ) return true;
				if( link.target.transitionNeeded ) return true;
				return false;
			})
			.transition()
			.duration(this.transitionDuration)
			.attr('d',function(link){ 
				return _this.line(link.path); 
			})
			;
 		
 		function magnifyNode(n){
 			var m = _this.magnify(n);
 			
 			if( typeof n.xMin === 'number' ){
 				m.xArcStart = _this.magnify.compute(
 					n.xMin - (n.xIndent / 2)
				).x;
 			};
 	 		if( typeof n.xMax === 'number' ){
 				m.xArcEnd = _this.magnify.compute(
 					n.xMax + (n.xIndent / 2)
				).x;
 			};
 			
 			return m;
 		};

 		function assignToNode(node, attrName, value, resolution){
 			var current = node[attrName];
 			
 			if( typeof current !== typeof value ){
 				node[attrName] = value;
 				return true;
 			};
 			
 			if( typeof current === 'number' 
 			 && typeof resolution === 'number' ){
 	 			var delta = Math.abs(value - current);
 				if( delta > resolution ){
 	 				node[attrName] = value;
 	 				return true;
 				};
 			} else {
 				if( current != value ){
 	 				node[attrName] = value;
 	 				return true;
 				};
 			};
 			
 			return false;
 		};
 	},
 	
 	_initiateBackgroundMouseClick: function(){
		this.lastElementIdSelected = null;
 		this.dispatchService.send(DH,{
 			type: 'userUnselect'
 		});
// 		if( this.lastElementIdSelected ){
// 			this.elementGenerator.selectOff(this.lastElementIdSelected);
// 			this.lastElementIdSelected = null;
// 		};
 	},
 	
 	_initiateExpandCollapse: function(elementData){
 		var _this = this;

 		// No collapse/expand on nodes that do not have children
 		if( !elementData.children ){
 			return;
 		};
 		if( elementData.children.length < 1 ){
 			return;
 		};
 		
 		var elementId = elementData.id;
 		if( this.expandedNodesById[elementId] ){
 			// Collapse
 	 		this.fixOriginOnNode = {
 	 			id: elementData.id
 	 			,position: Degrees(elementData.orig_x - this.originAngle)
 	 		};
 	 	 		
 			delete this.expandedNodesById[elementId];

 		} else {
 			// If expanding a node and the node is part of a group,
 			// then collapse all nodes associated with the same group
 			var groupName = elementData.group;
 			if( groupName ){
 				var groupElems = this.elementsByGroup[groupName];
 				if( groupElems ){
 					for(var i=0,e=groupElems.length; i<e; ++i){
 						var groupNode = groupElems[i];
 						if( groupNode.id !== elementData.id 
 						 && this.expandedNodesById[groupNode.id] ){
 							// Collapse this node
 							if( this.collapseBeforeExpand ){
 	 							// In this option, the node is collapsed before the
 								// new one is expanded
 	 							this._initiateExpandCollapse(groupNode);
 	 							window.setTimeout(
 	 								function(){
 	 									_this._initiateExpandCollapse(elementData);
 	 								}
 	 								,this.transitionDuration
 	 							);
 	 							return;
 							} else {
 								// Mark as collapsed
 	 							delete this.expandedNodesById[groupNode.id];
 							};
 						};
 					};
 				};
 			};

 	 		this.fixOriginOnNode = {
 	 			id: elementData.id
 	 			,position: Degrees(elementData.orig_x - this.originAngle)
 	 		};

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
 	
 	_showElements: function(elements){
 		var _this = this;
 		
 		var redrawRequired = false;
 		
 		for(var i=0,e=elements.length; i<e; ++i){
 			var element = elements[i];
 			if( element.isNode && !element.canvasVisible ){
 				Tree.visitParents(element, function(n){
 					// Skip root
 					if( n.parent ){
 						if( !n.expanded ){
 							// This node needs to be expanded
 							_this.expandedNodesById[n.id] = true;
 							redrawRequired = true;

 							// Animation should be fixed on the first visible
 							// parent that is expanded
 							if( n.canvasVisible ){
 	 							_this.fixOriginOnNode = {
 				 	 	 			id: n.id
 				 	 	 			,position: Degrees(n.orig_x - _this.originAngle)
 				 	 	 		};
 							};
 						};
 					};
 				});
 			};
 		};
 		
 		if( redrawRequired ){
 			this._createGraphicalElements();
 		};
 	},
 	
 	_selectionChanged: function(docIdMap){
 		var _this = this;

 		//this.selectedDocIdMap = docIdMap;
 		// Compute a map of all concerned elements
 		var atLeastOneElement = false;
 		var elementMap = {};
 		for(var docId in docIdMap){
 			var elements = undefined;
 			if( docId ){
 				elements = this.elementsByDocId[docId];
 			};
 			
 			if( elements ){
				for(var i=0,e=elements.length; i<e; ++i){
					var element = elements[i];
					elementMap[element.id] = element;
					atLeastOneElement = true;
				};
 			};
 		};
 		
 		// If at least one element selected, adjust the canvas
 		// accordingly
 		if( atLeastOneElement ){
			this.expandedNodesById = {};
	 		for(var elementId in elementMap){
	 			var element = elementMap[elementId];
	 			if( element.isNode ){
	 				Tree.visitParents(element, function(n){
	 					// Skip root
	 					if( !Tree.isRoot(n) ){
 							// This node needs to be expanded
 							_this.expandedNodesById[n.id] = true;

 							// Animation should be fixed on the first visible
 							// parent that is expanded
 							if( n.canvasVisible ){
 	 							_this.fixOriginOnNode = {
 				 	 	 			id: n.id
 				 	 	 			,position: Degrees(n.orig_x - _this.originAngle)
 				 	 	 		};
 							};
	 					};
	 				});
	 			};
	 		};
	 		
 			this._createGraphicalElements();
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
 			
 			if( this.elementsByDocId[docId] ){
 				m.isAvailable = true;
 			};
 		} else if( 'find' === m.type ) {
 			// If elements are associated with the found document
 			// expand nodes to make found document visible
 			var docId = m.docId;
 			
 			var elements = undefined;
 			if( docId ){
 				elements = this.elementsByDocId[docId];
 			};
 			
 			if( elements ){
				this._showElements(elements);
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
		// Required library: d3
		if( window && window.d3 ) {
			m.isAvailable = true;
		} else {
			$n2.log('Canvas collapsibleRadialTree requires d3 library');
		};
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
