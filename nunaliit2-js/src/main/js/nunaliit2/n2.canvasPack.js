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
 ,DH = 'n2.canvasPack'
 ;
 
// Required library: d3
var $d = window.d3;
if( !$d ) return;
 
// --------------------------------------------------------------------------
var PackCanvas = $n2.Class({

	canvasId: null,
 	
	interactionId: null,
 	
	svgId: null,
 	
	modelId: null,
 	
	dispatchService: null,

	sourceModelId: null,
 	
	moduleDisplay: null,
 	
	background: null,
	
	toggleSelection: null,
	
	pack: null,
 	
	styleRules: null,

	elementsById: null,
	
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
 		
		this.modelId = $n2.getUniqueId('canvasPack');
 		
		this.styleRules = $n2.styleRule.loadRulesFromObject(opts.styleRules);
 		
		var config = opts.config;
		if( config ){
			if( config.directory ){
				this.dispatchService = config.directory.dispatchService;
			};
		};

 		this.elementsById = {};
 		this.currentMouseOver = null;
 		this.lastElementIdSelected = null;
 		this.focusInfo = null;
 		this.selectInfo = null;

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
 		
 		this.createGraph();

 		var graphSize = this.getGraphSize();
 		this.pack = d3.layout.pack()
	 	    .size(graphSize)
	 	    .value(function(d) { return d.size; });
 		
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

 		$n2.log('PackCanvas',this);
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
 		
 		var $rootGroup = $svg.append('g')
			.attr('class','packRoot')
			;

		$rootGroup.append('g')
 			.attr('class','nodes');
 		
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
 		
 		var $rootGroup = $svg.select('g.packRoot')
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
		// Remove
		for(var i=0,e=removedElements.length; i<e; ++i){
			var removedElement = removedElements[i];
			if( this.elementsById[removedElement.id] ){
				delete this.elementsById[removedElement.id].parent;
				delete this.elementsById[removedElement.id].children;
				delete this.elementsById[removedElement.id];
			};
		};
		
		// Add
		for(var i=0,e=addedElements.length; i<e; ++i){
			var addedElement = addedElements[i];
			this.elementsById[addedElement.id] = addedElement;
		};
		
		var root = {
			name: ''
			,children: []
		};

		var nodes = [];
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			delete elem.parent;
			delete elem.children;
			delete elem.value;
			delete elem.depth;
			delete elem.x;
			delete elem.y;
			delete elem.r;
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
			};
				
			if( !elem.parent ) {
				elem.parent = root;
				root.children.push(elem);
			};
			
			nodes.push(elem);
		};
		
		var countInd = 0;
		var countOrg = 0;
		var countParentId = 0;
		var countNested = 0;
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			
			if( elem.parentId ){
				++countParentId;
				var parent = this.elementsById[elem.parentId];
				if( parent ){
					++countNested;
				};
			};
				
			if( elem.isIndividual ){
				++countInd;
			};
			if( elem.isOrganization ){
				++countOrg;
			};
		};
		$n2.log('ind: '+countInd + ' org: ' + countOrg + ' root children: ' + root.children.length + ' nested: ' + countNested + ' parent id: ' + countParentId);
		
		nodes = this.pack.nodes(root);

		var g_root = {
				 "name": "flare",
				 "children": [
				  {
				   "name": "analytics",
				   "children": [
				    {
				     "name": "cluster",
				     "children": [
				      {"name": "AgglomerativeCluster", "size": 3938},
				      {"name": "CommunityStructure", "size": 3812},
				      {"name": "HierarchicalCluster", "size": 6714},
				      {"name": "MergeEdge", "size": 743}
				     ]
				    },
				    {
				     "name": "graph",
				     "children": [
				      {"name": "BetweennessCentrality", "size": 3534},
				      {"name": "LinkDistance", "size": 5731},
				      {"name": "MaxFlowMinCut", "size": 7840},
				      {"name": "ShortestPaths", "size": 5914},
				      {"name": "SpanningTree", "size": 3416}
				     ]
				    },
				    {
				     "name": "optimization",
				     "children": [
				      {"name": "AspectRatioBanker", "size": 7074}
				     ]
				    }
				   ]
				  },
				  {
				   "name": "animate",
				   "children": [
				    {"name": "Easing", "size": 17010},
				    {"name": "FunctionSequence", "size": 5842},
				    {
				     "name": "interpolate",
				     "children": [
				      {"name": "ArrayInterpolator", "size": 1983},
				      {"name": "ColorInterpolator", "size": 2047},
				      {"name": "DateInterpolator", "size": 1375},
				      {"name": "Interpolator", "size": 8746},
				      {"name": "MatrixInterpolator", "size": 2202},
				      {"name": "NumberInterpolator", "size": 1382},
				      {"name": "ObjectInterpolator", "size": 1629},
				      {"name": "PointInterpolator", "size": 1675},
				      {"name": "RectangleInterpolator", "size": 2042}
				     ]
				    },
				    {"name": "ISchedulable", "size": 1041},
				    {"name": "Parallel", "size": 5176},
				    {"name": "Pause", "size": 449},
				    {"name": "Scheduler", "size": 5593},
				    {"name": "Sequence", "size": 5534},
				    {"name": "Transition", "size": 9201},
				    {"name": "Transitioner", "size": 19975},
				    {"name": "TransitionEvent", "size": 1116},
				    {"name": "Tween", "size": 6006}
				   ]
				  },
				  {
				   "name": "data",
				   "children": [
				    {
				     "name": "converters",
				     "children": [
				      {"name": "Converters", "size": 721},
				      {"name": "DelimitedTextConverter", "size": 4294},
				      {"name": "GraphMLConverter", "size": 9800},
				      {"name": "IDataConverter", "size": 1314},
				      {"name": "JSONConverter", "size": 2220}
				     ]
				    },
				    {"name": "DataField", "size": 1759},
				    {"name": "DataSchema", "size": 2165},
				    {"name": "DataSet", "size": 586},
				    {"name": "DataSource", "size": 3331},
				    {"name": "DataTable", "size": 772},
				    {"name": "DataUtil", "size": 3322}
				   ]
				  },
				  {
				   "name": "display",
				   "children": [
				    {"name": "DirtySprite", "size": 8833},
				    {"name": "LineSprite", "size": 1732},
				    {"name": "RectSprite", "size": 3623},
				    {"name": "TextSprite", "size": 10066}
				   ]
				  },
				  {
				   "name": "flex",
				   "children": [
				    {"name": "FlareVis", "size": 4116}
				   ]
				  },
				  {
				   "name": "physics",
				   "children": [
				    {"name": "DragForce", "size": 1082},
				    {"name": "GravityForce", "size": 1336},
				    {"name": "IForce", "size": 319},
				    {"name": "NBodyForce", "size": 10498},
				    {"name": "Particle", "size": 2822},
				    {"name": "Simulation", "size": 9983},
				    {"name": "Spring", "size": 2213},
				    {"name": "SpringForce", "size": 1681}
				   ]
				  },
				  {
				   "name": "query",
				   "children": [
				    {"name": "AggregateExpression", "size": 1616},
				    {"name": "And", "size": 1027},
				    {"name": "Arithmetic", "size": 3891},
				    {"name": "Average", "size": 891},
				    {"name": "BinaryExpression", "size": 2893},
				    {"name": "Comparison", "size": 5103},
				    {"name": "CompositeExpression", "size": 3677},
				    {"name": "Count", "size": 781},
				    {"name": "DateUtil", "size": 4141},
				    {"name": "Distinct", "size": 933},
				    {"name": "Expression", "size": 5130},
				    {"name": "ExpressionIterator", "size": 3617},
				    {"name": "Fn", "size": 3240},
				    {"name": "If", "size": 2732},
				    {"name": "IsA", "size": 2039},
				    {"name": "Literal", "size": 1214},
				    {"name": "Match", "size": 3748},
				    {"name": "Maximum", "size": 843},
				    {
				     "name": "methods",
				     "children": [
				      {"name": "add", "size": 593},
				      {"name": "and", "size": 330},
				      {"name": "average", "size": 287},
				      {"name": "count", "size": 277},
				      {"name": "distinct", "size": 292},
				      {"name": "div", "size": 595},
				      {"name": "eq", "size": 594},
				      {"name": "fn", "size": 460},
				      {"name": "gt", "size": 603},
				      {"name": "gte", "size": 625},
				      {"name": "iff", "size": 748},
				      {"name": "isa", "size": 461},
				      {"name": "lt", "size": 597},
				      {"name": "lte", "size": 619},
				      {"name": "max", "size": 283},
				      {"name": "min", "size": 283},
				      {"name": "mod", "size": 591},
				      {"name": "mul", "size": 603},
				      {"name": "neq", "size": 599},
				      {"name": "not", "size": 386},
				      {"name": "or", "size": 323},
				      {"name": "orderby", "size": 307},
				      {"name": "range", "size": 772},
				      {"name": "select", "size": 296},
				      {"name": "stddev", "size": 363},
				      {"name": "sub", "size": 600},
				      {"name": "sum", "size": 280},
				      {"name": "update", "size": 307},
				      {"name": "variance", "size": 335},
				      {"name": "where", "size": 299},
				      {"name": "xor", "size": 354},
				      {"name": "_", "size": 264}
				     ]
				    },
				    {"name": "Minimum", "size": 843},
				    {"name": "Not", "size": 1554},
				    {"name": "Or", "size": 970},
				    {"name": "Query", "size": 13896},
				    {"name": "Range", "size": 1594},
				    {"name": "StringUtil", "size": 4130},
				    {"name": "Sum", "size": 791},
				    {"name": "Variable", "size": 1124},
				    {"name": "Variance", "size": 1876},
				    {"name": "Xor", "size": 1101}
				   ]
				  },
				  {
				   "name": "scale",
				   "children": [
				    {"name": "IScaleMap", "size": 2105},
				    {"name": "LinearScale", "size": 1316},
				    {"name": "LogScale", "size": 3151},
				    {"name": "OrdinalScale", "size": 3770},
				    {"name": "QuantileScale", "size": 2435},
				    {"name": "QuantitativeScale", "size": 4839},
				    {"name": "RootScale", "size": 1756},
				    {"name": "Scale", "size": 4268},
				    {"name": "ScaleType", "size": 1821},
				    {"name": "TimeScale", "size": 5833}
				   ]
				  },
				  {
				   "name": "util",
				   "children": [
				    {"name": "Arrays", "size": 8258},
				    {"name": "Colors", "size": 10001},
				    {"name": "Dates", "size": 8217},
				    {"name": "Displays", "size": 12555},
				    {"name": "Filter", "size": 2324},
				    {"name": "Geometry", "size": 10993},
				    {
				     "name": "heap",
				     "children": [
				      {"name": "FibonacciHeap", "size": 9354},
				      {"name": "HeapNode", "size": 1233}
				     ]
				    },
				    {"name": "IEvaluable", "size": 335},
				    {"name": "IPredicate", "size": 383},
				    {"name": "IValueProxy", "size": 874},
				    {
				     "name": "math",
				     "children": [
				      {"name": "DenseMatrix", "size": 3165},
				      {"name": "IMatrix", "size": 2815},
				      {"name": "SparseMatrix", "size": 3366}
				     ]
				    },
				    {"name": "Maths", "size": 17705},
				    {"name": "Orientation", "size": 1486},
				    {
				     "name": "palette",
				     "children": [
				      {"name": "ColorPalette", "size": 6367},
				      {"name": "Palette", "size": 1229},
				      {"name": "ShapePalette", "size": 2059},
				      {"name": "SizePalette", "size": 2291}
				     ]
				    },
				    {"name": "Property", "size": 5559},
				    {"name": "Shapes", "size": 19118},
				    {"name": "Sort", "size": 6887},
				    {"name": "Stats", "size": 6557},
				    {"name": "Strings", "size": 22026}
				   ]
				  },
				  {
				   "name": "vis",
				   "children": [
				    {
				     "name": "axis",
				     "children": [
				      {"name": "Axes", "size": 1302},
				      {"name": "Axis", "size": 24593},
				      {"name": "AxisGridLine", "size": 652},
				      {"name": "AxisLabel", "size": 636},
				      {"name": "CartesianAxes", "size": 6703}
				     ]
				    },
				    {
				     "name": "controls",
				     "children": [
				      {"name": "AnchorControl", "size": 2138},
				      {"name": "ClickControl", "size": 3824},
				      {"name": "Control", "size": 1353},
				      {"name": "ControlList", "size": 4665},
				      {"name": "DragControl", "size": 2649},
				      {"name": "ExpandControl", "size": 2832},
				      {"name": "HoverControl", "size": 4896},
				      {"name": "IControl", "size": 763},
				      {"name": "PanZoomControl", "size": 5222},
				      {"name": "SelectionControl", "size": 7862},
				      {"name": "TooltipControl", "size": 8435}
				     ]
				    },
				    {
				     "name": "data",
				     "children": [
				      {"name": "Data", "size": 20544},
				      {"name": "DataList", "size": 19788},
				      {"name": "DataSprite", "size": 10349},
				      {"name": "EdgeSprite", "size": 3301},
				      {"name": "NodeSprite", "size": 19382},
				      {
				       "name": "render",
				       "children": [
				        {"name": "ArrowType", "size": 698},
				        {"name": "EdgeRenderer", "size": 5569},
				        {"name": "IRenderer", "size": 353},
				        {"name": "ShapeRenderer", "size": 2247}
				       ]
				      },
				      {"name": "ScaleBinding", "size": 11275},
				      {"name": "Tree", "size": 7147},
				      {"name": "TreeBuilder", "size": 9930}
				     ]
				    },
				    {
				     "name": "events",
				     "children": [
				      {"name": "DataEvent", "size": 2313},
				      {"name": "SelectionEvent", "size": 1880},
				      {"name": "TooltipEvent", "size": 1701},
				      {"name": "VisualizationEvent", "size": 1117}
				     ]
				    },
				    {
				     "name": "legend",
				     "children": [
				      {"name": "Legend", "size": 20859},
				      {"name": "LegendItem", "size": 4614},
				      {"name": "LegendRange", "size": 10530}
				     ]
				    },
				    {
				     "name": "operator",
				     "children": [
				      {
				       "name": "distortion",
				       "children": [
				        {"name": "BifocalDistortion", "size": 4461},
				        {"name": "Distortion", "size": 6314},
				        {"name": "FisheyeDistortion", "size": 3444}
				       ]
				      },
				      {
				       "name": "encoder",
				       "children": [
				        {"name": "ColorEncoder", "size": 3179},
				        {"name": "Encoder", "size": 4060},
				        {"name": "PropertyEncoder", "size": 4138},
				        {"name": "ShapeEncoder", "size": 1690},
				        {"name": "SizeEncoder", "size": 1830}
				       ]
				      },
				      {
				       "name": "filter",
				       "children": [
				        {"name": "FisheyeTreeFilter", "size": 5219},
				        {"name": "GraphDistanceFilter", "size": 3165},
				        {"name": "VisibilityFilter", "size": 3509}
				       ]
				      },
				      {"name": "IOperator", "size": 1286},
				      {
				       "name": "label",
				       "children": [
				        {"name": "Labeler", "size": 9956},
				        {"name": "RadialLabeler", "size": 3899},
				        {"name": "StackedAreaLabeler", "size": 3202}
				       ]
				      },
				      {
				       "name": "layout",
				       "children": [
				        {"name": "AxisLayout", "size": 6725},
				        {"name": "BundledEdgeRouter", "size": 3727},
				        {"name": "CircleLayout", "size": 9317},
				        {"name": "CirclePackingLayout", "size": 12003},
				        {"name": "DendrogramLayout", "size": 4853},
				        {"name": "ForceDirectedLayout", "size": 8411},
				        {"name": "IcicleTreeLayout", "size": 4864},
				        {"name": "IndentedTreeLayout", "size": 3174},
				        {"name": "Layout", "size": 7881},
				        {"name": "NodeLinkTreeLayout", "size": 12870},
				        {"name": "PieLayout", "size": 2728},
				        {"name": "RadialTreeLayout", "size": 12348},
				        {"name": "RandomLayout", "size": 870},
				        {"name": "StackedAreaLayout", "size": 9121},
				        {"name": "TreeMapLayout", "size": 9191}
				       ]
				      },
				      {"name": "Operator", "size": 2490},
				      {"name": "OperatorList", "size": 5248},
				      {"name": "OperatorSequence", "size": 4190},
				      {"name": "OperatorSwitch", "size": 2581},
				      {"name": "SortOperator", "size": 2023}
				     ]
				    },
				    {"name": "Visualization", "size": 16540}
				   ]
				  }
				 ]
				};
//		nodes = this.pack.nodes(g_root);
//		for(var i=0,e=nodes.length; i<e; ++i){
//			var node = nodes[i];
//			node.id = node.name;
//		};
		

		
		// Keep only nodes that have a value
		var effectiveNodes = [];
		for(var i=0,e=nodes.length; i<e; ++i){
			var node = nodes[i];
			if( node.value ){
				effectiveNodes.push(node);
			};
		};
		
		$n2.log('effectiveNodes: '+effectiveNodes.length);
		
		effectiveNodes.sort(function(a,b){
			if( a.value > b.value ){ return -1; };
			if( a.value < b.value ){ return 1; };
			return 0;
		});
		
		this._documentsUpdated(effectiveNodes, null);
	},
	
	_intentChanged: function(changedElements){
 		// Segregate nodes and active links
 		var nodes = [];
 		for(var i=0,e=changedElements.length; i<e; ++i){
 			var changedNode = changedElements[i];
 			
 			// $n2.log(changedNode.n2_id+' sel:'+changedNode.n2_selected+' foc:'+changedNode.n2_hovered+' find:'+changedNode.n2_found);
 			
			nodes.push(changedNode);
			
			if( changedNode.n2_found 
			 && !changedNode.forceFound ){
				changedNode.forceFound = true;

			} else if( !changedNode.n2_found 
			 && changedNode.forceFound ){
				changedNode.forceFound = false;
			};
 		};

 		// Update style on nodes
 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(nodes, function(node){ return node.id; })
 			//.selectAll('circle')
 			;
 		this._adjustElementStyles(selectedNodes);
 		
	},
 	
 	_documentsUpdated: function(nodes, updatedLinkData){
 		var _this = this;
 		
 		var svgNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
			.data(nodes, function(node){ return node.id; })
			.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
			;
 		
 		svgNodes.select('circle')
 	      .attr('r', function(d) { return d.r; })
 	      ;

 		svgNodes.exit()
 			.remove();

 		var addedGroups = svgNodes.enter()
			.append('g')
			.attr('class','node')
			.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
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

 		addedGroups.append('circle')
 	      .attr('r', function(d) { return d.r; })
 	      ;
 		
 		

 		this._adjustElementStyles(addedGroups);
 	},
 	
 	_adjustElementStyles: function(selectedElements){
 		var _this = this;
 		selectedElements.each(function(n,i){
 			var symbolizer = _this.styleRules.getSymbolizer(n);
 			symbolizer.adjustSvgElement(this,n);
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
 		};
 	},
 	
 	_getModelInfo: function(){
 		var info = {
 			modelId: this.modelId
 			,modelType: 'packCanvas'
 			,parameters: []
 		};
 		
 		return info;
 	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'pack' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'pack' ){
		
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
		
		new PackCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasPack = {
	PackCanvas: PackCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
