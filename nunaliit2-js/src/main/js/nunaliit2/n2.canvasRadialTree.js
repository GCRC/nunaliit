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
 
// Required library: d3
var $d = window.d3;
if( !$d ) return;
 
// --------------------------------------------------------------------------
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

	linksById: null,
	
	elementGenerator: null,
	
	elementsById: null,
	
	layout: null,
	
	line: null,
	
	bundle: null,
 	
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
 		this.linksById = {};
 		this.currentMouseOver = null;
 		this.elementsById = {};
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
 		graphSize[0] = graphSize[0] - (2 * this.margin);
 		graphSize[1] = graphSize[1] - (2 * this.margin);

 		this.layout = d3.layout.cluster()
 			.size([360, this.radius])
	 	    .sort(null)
	 	    .value(function(d) { return d.size; })
 			;

 		this.line = d3.svg.line.radial()
	 	    //.interpolate("bundle")
 			.interpolate("basis")
	 	    .tension(.85)
	 	    .radius(function(d) { return d.y; })
	 	    .angle(function(d) { return d.x / 180 * Math.PI; });
 		
 		this.bundle = d3.layout.bundle();
 		
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
 		
 		var $rootGroup = $svg.append('g')
			.attr('class','radialRoot')
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

		// Reset attributes that are computed by layout
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			delete elem.parent;
			delete elem.children;
			delete elem.depth;
			delete elem.x;
			delete elem.y;
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

		// Compute tree
		var root = {
			id: '__root__'
			,name: ''
			,children: []
		};
		var nodes = [];
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
			
			if( elem.isNode ){
				nodes.push(elem);
			};
		};

//		// Report statistics on tree
//		var countParentId = 0;
//		var countNested = 0;
//		for(var i=0,e=nodes.length; i<e; ++i){
//			var node = nodes[i];
//			
//			if( node.parentId ){
//				++countParentId;
//
//				if( node.parent ){
//					++countNested;
//				};
//			};
//		};
//		$n2.log('nodes: '+nodes.length 
//				+ ' root children: ' + root.children.length 
//				+ ' nested: ' + countNested 
//				+ ' parent id: ' + countParentId);

		// Validate tree
//		function validateTree(n){
//			if( n.children ){
//				for(var i=0,e=n.children.length; i<e; ++i){
//					var c = n.children[i];
//					if( c.parent !== n ){
//						return false;
//					};
//					
//					if( !validateTree(c) ){
//						return false;
//					};
//				};
//			};
//			return true;
//		};
//		var validTree = validateTree(root);
//		if( !validTree ){
//			$n2.log('tree is invalid',root);
//		};
		
		this.layout.nodes(root);

		var nodes = [];
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
			
			if( elem.isNode ){
				nodes.push(elem);
			};
		};
		
		this.sortedNodes = [];
		var links = [];
		for(var elemId in this.elementsById){
			var elem = this.elementsById[elemId];
			
			if( elem.isLink ){
				elem.n2_geometry = 'line';

				if( inTree(elem.source) 
				 && inTree(elem.target) ){
					links.push(elem);
				} else {
					$n2.log('link not in tree',elem);
				};
			};
			
			if( elem.isNode ){
				elem.n2_geometry = 'point';
				
				if( inTree(elem) ){
					this.sortedNodes.push(elem);
				} else {
					$n2.log('node not in tree.',elem);
				};
			};
		};
		this.sortedNodes.sort(function(a,b){
			if( a.x < b.x ) return -1;
			if( a.x > b.x ) return 1;
			return 0;
		});
		
		var paths = this.bundle(links);
		for(var i=0,e=links.length; i<e; ++i){
			links[i].path = paths[i];
		};
		
		this._documentsUpdated(this.sortedNodes, links);
		
		function inTree(n){
			if( !n ) return false;
			
			if( n === root ) return true;

			return inTree(n.parent);
		};
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

 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(updatedNodeData, function(node){ return node.id; })
 			;

 		var selectedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
 			.data(updatedNodeData, function(node){ return node.id; })
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
// 				_this._magnifyElement(n);
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
// 				_this._magnifyElement(n);
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
 			.data(updatedLinkData, function(link){ return link.id; })
			;
 		
 		selectedLinks.transition()
			.attr('d',function(link){ return _this.line(link.path); })
			;

 		var createdLinks = selectedLinks.enter()
 			.append('path')
 			.attr('class','link')
 			.attr('d',function(link){ return _this.line(link.path); })
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
 	
 	_magnifyElement: function(magnifiedNode){
 		var _this = this;
 		
 		var magnifiedIndex = undefined;
 		for(var i=0,e=this.sortedNodes.length; i<e; ++i){
 			var node = this.sortedNodes[i];
 			
 			node.deltaX = 0;
 			
 			if( node === magnifiedNode ){
 				node.magnified = true;
 				magnifiedIndex = i;
 			} else {
 				node.magnified = false;
 			};
 		};
 		
 		var magScope = 15;
 		var magFocus = 4;
 		
 		if( this.sortedNodes.length < 1 ){
 			return;
 		} else if( (360/this.sortedNodes.length) > magFocus ){
 			return;
 		};
 		
 		// Main
 		var angle = this.sortedNodes[magnifiedIndex].orig_x;

 		var done = false;
 		var indexDelta = 1;
 		var rate = 1-(magFocus/magScope);
 		var distanceToTarget = magScope * rate;
 		var kill = this.sortedNodes.length / 3;
 		while( !done ){
 			var delta = magScope - distanceToTarget;
 			
 			var index = getIndex(magnifiedIndex,indexDelta);
 			var node = this.sortedNodes[index];
 			var newX = getAngle(angle + delta);
 			node.deltaX = newX - node.orig_x;
 			
			if( getAngleDelta(node.deltaX) < 0.01 ){
				done = true;
			};
 			
 			index = getIndex(magnifiedIndex,0-indexDelta);
 			node = this.sortedNodes[index];
 			var newX = getAngle(angle - delta);
 			node.deltaX = newX - node.orig_x;
 			
 			distanceToTarget = distanceToTarget * rate;
 			
 			++indexDelta;
 			--kill;
 			
 			if( kill < 0 ){
 				done = true;
 			};
 		};

		// Animate the position of the nodes around the circle
 		this._getSvgElem().select('g.nodes').selectAll('.node')
			.data(this.sortedNodes, function(node){ return node.id; })
			.filter(function(d){
				var newX = d.orig_x + d.deltaX;
				var diffX = getAngle(newX - d.x);
				
				d.transitionNeeded = false;
				if( diffX > 0.01 ){
					d.transitionNeeded = true;
				} else if( diffX < 0.01 ) {
					d.transitionNeeded = true;
				};
				
				if( d.transitionNeeded ){
					d.x = newX;
				};
				
				return d.transitionNeeded;
			})
			.transition()
			.attr("transform", function(d) { 
				return "rotate(" + (d.x - 90) 
					+ ")translate(" + d.y + ",0)"; 
			})
			;

		// Animate the position of the labels around the circle
 		this._getSvgElem().select('g.labels').selectAll('.label')
			.data(this.sortedNodes, function(node){ return node.id; })
			.filter(function(d){
				var newX = d.orig_x + d.deltaX;
				var diffX = getAngle(newX - d.x);
				
				d.transitionNeeded = false;
				if( diffX > 0.01 ){
					d.transitionNeeded = true;
				} else if( diffX < 0.01 ) {
					d.transitionNeeded = true;
				};
				
				if( d.transitionNeeded ){
					d.x = newX;
				};
				
				return d.transitionNeeded;
			})
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
 		
 		function getIndex(i,d){
 			var r = i + d;
 			while( r < 0 ){
 				r += _this.sortedNodes.length;
 			};
 			while( r >= _this.sortedNodes.length ){
 				r -= _this.sortedNodes.length;
 			};
 			return r;
 		};

 		function getAngle(r){
 			if( r < 0 ){
 				r += 360;
 			};
 			if( r >= 360 ){
 				r -= 360;
 			};
 			return r;
 		};

 		function getAngleDelta(r){
 			if( r < -180 ){
 				r += 360;
 			};
 			if( r > 180 ){
 				r -= 360;
 			};
 			return r;
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
	if( m.canvasType === 'radialTree' ){
		m.isAvailable = true;
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
