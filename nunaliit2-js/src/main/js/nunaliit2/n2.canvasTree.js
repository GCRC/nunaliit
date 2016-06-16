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
 ,DH = 'n2.canvasTree'
 ;
 
var $d = undefined;
 
// --------------------------------------------------------------------------
var TreeCanvas = $n2.Class({

	canvasId: null,
 	
	interactionId: null,
 	
	svgId: null,
 	
	modelId: null,
 	
	dispatchService: null,

	sourceModelId: null,
 	
	moduleDisplay: null,
 	
	background: null,
	
	toggleSelection: null,
	
	margin: null,
	
	layoutStyle: null,
	
	treeLayout: null,
	
	diagonalLine: null,
 	
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
			,layoutStyle: 'tree'
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
		this.layoutStyle = opts.layoutStyle;
		this.toggleSelection = opts.toggleSelection;
		this.elementGenerator = opts.elementGenerator;
 		
		this.modelId = $n2.getUniqueId('canvasTree');
 		
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
 		this.margin = 10;

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
 		graphSize[0] = graphSize[0] - (2 * this.margin);
 		graphSize[1] = graphSize[1] - (2 * this.margin);

 		if( 'cluster' === this.layoutStyle ){
 	 		this.treeLayout = d3.layout.cluster()
 	 			.sort(function(a,b){
 		 	    	return d3.ascending(a.sortValue, b.sortValue);
 		 	    })
 	 			.size(graphSize);
 		} else {
 	 		this.treeLayout = d3.layout.tree()
 	 			.sort(function(a,b){
 		 	    	return d3.ascending(a.sortValue, b.sortValue);
 		 	    })
 	 			.size(graphSize);
 		};
		
 		this.diagonalLine = d3.svg.diagonal();
 		
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

 		$n2.log('TreeCanvas',this);
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
 			.attr('class','links');

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
		var _this = this;
		
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

		// Reset attributes that are computed by layout
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			delete elem.parent;
			delete elem.children;
			delete elem.depth;
			delete elem.x;
			delete elem.y;
		};

		// Compute tree
		var root = {
			id: '__root__'
			,name: ''
			,children: []
		};
		var nodes = [];
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			
			if( elem.isNode ){
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
				
				elem.n2_geometry = 'point';
				
				nodes.push(elem);
			};
		};

		// Report statistics on tree
		var countParentId = 0;
		var countNested = 0;
		for(var i=0,e=nodes.length; i<e; ++i){
			var node = nodes[i];
			
			if( node.parentId ){
				++countParentId;

				if( node.parent ){
					++countNested;
				};
			};
		};
		$n2.log('nodes: '+nodes.length + ' root children: ' + root.children.length + ' nested: ' + countNested + ' parent id: ' + countParentId);
		
		nodes = this.treeLayout.nodes(root);
		
		nodes.forEach(function(n){
			n.x = n.x + _this.margin;
			n.y = n.y + _this.margin;
		});
		
		var links = [];
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			
			if( elem.isLink ){
				elem.n2_geometry = 'line';

				links.push(elem);
			};
		};
		
		this._documentsUpdated(nodes, links);
	},
	
	_intentChanged: function(changedElements){
 		// Segregate nodes and active links
 		var nodes = [];
 		var links = [];
 		for(var i=0,e=changedElements.length; i<e; ++i){
 			var changedNode = changedElements[i];

 			if( changedNode.isNode ){
 				nodes.push(changedNode);
 			} else if( changedNode.isLink ){
 				links.push(changedNode);
 			};
 		};

 		// Update style on nodes
 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(nodes, function(d){ return d.id; })
 			;
 		this._adjustElementStyles(selectedNodes);

 		// Update style on links
 		var selectedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(links, function(d){ return d.id; })
 			;
 		this._adjustElementStyles(selectedLinks);
	},
 	
 	_documentsUpdated: function(nodes, links){
 		var _this = this;
 		
 		var updatedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
			.data(nodes, function(d){ return d.id; })
			;
 		
 		updatedNodes
			.transition()
			.attr('cx', function(d){ return d.x; })
			.attr('cy', function(d){ return d.y; })
			;
 		
 		updatedNodes.exit()
 			.remove();

 		updatedNodes.enter()
			.append('circle')
			.attr('class','node')
			.attr('r', 5)
			.attr('cx', function(d){ return d.x; })
			.attr('cy', function(d){ return d.y; })
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

 		var allNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(nodes, function(d){ return d.id; })
 			;
 		this._adjustElementStyles(allNodes);
 		
 		var updatedLinks = this._getSvgElem().select('g.links').selectAll('.link')
			.data(links, function(d){ return d.id; })
			;
 		
 		updatedLinks
 			.transition()
			.attr('d', this.diagonalLine)
			;

 		updatedLinks.exit()
 			.remove();
 		
 		updatedLinks.enter()
 			.append('path')
 			.attr('class','link')
 			.attr('d', this.diagonalLine)
 			.attr('fill','none')
 			.attr('stroke','#000000')
 			.attr('stroke-width',1)
 			.attr('stroke-opacity',1)
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

 		var allLinks = this._getSvgElem().select('g.links').selectAll('.link')
			.data(links, function(d){ return d.id; })
			;
		this._adjustElementStyles(allLinks);
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
 			,modelType: 'treeCanvas'
 			,parameters: []
 		};
 		
 		return info;
 	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	// Required library: d3
	if( !$d && window ) $d = window.d3;

	if( m.canvasType === 'tree' ){
		if( $d ) {
			m.isAvailable = true;
		} else {
			$n2.log('Canvas tree requires d3 library');
		};
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'tree' ){
		
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
		
		new TreeCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasTree = {
	TreeCanvas: TreeCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
