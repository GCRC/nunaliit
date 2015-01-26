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
var Node = $n2.Class({
	isNode: null,
	
	n2_id: null,

	n2_doc: null,
	
	n2_geometry: null,
	
	initialize: function(doc){
		this.isNode = true;
		this.n2_doc = doc;
		this.n2_id = doc._id;
		this.n2_geometry = 'point';
	},

	getDocId: function(){
		return this.n2_doc._id;
	},
	
	setDoc: function(doc){
		if( doc._id === this.n2_doc._id ){
			this.n2_doc = doc;
		};
	}
});

//--------------------------------------------------------------------------
var Link = $n2.Class({
	isLink: null,

	n2_doc: null,

	sourceDocId: null,

	targetDocId: null,

	source: null,
	
	target: null,
	
	n2_id: null,
	
	n2_geometry: null,
	
	
	linkId: null,
	
	initialize: function(doc, sourceDocId, targetDocId){
		this.n2_doc = doc;
		this.n2_id = doc._id;
		this.isLink = true;
		this.n2_geometry = 'line';
		
		if( sourceDocId < targetDocId ){
			this.sourceDocId = sourceDocId;
			this.targetDocId = targetDocId;
		} else {
			this.sourceDocId = targetDocId;
			this.targetDocId = sourceDocId;
		};
		
		this.linkId = this.sourceDocId + '|' + this.targetDocId;
	},
	
	setDoc: function(doc){
		if( doc._id === this.n2_doc._id ){
			this.n2_doc = doc;
		};
	},

	getDocId: function(){
		return this.n2_doc._id;
	},

	getSourceDocId: function(){
		return this.sourceDocId;
	},

	getTargetDocId: function(){
		return this.targetDocId;
	},

	getSource: function(){
		return this.source;
	},

	setSource: function(source){
		if( source.n2_id === this.sourceDocId ){
			this.source = source;
		};
	},
	
	getTarget: function(){
		return this.target;
	},

	setTarget: function(target){
		if( target.n2_id === this.targetDocId ){
			this.target = target;
		};
	}
});

// --------------------------------------------------------------------------
var RadialCanvas = $n2.Class({

	canvasId: null,
 	
	interactionId: null,
 	
	svgId: null,
 	
	modelId: null,
 	
	dispatchService: null,

	showService: null,
 	
	sourceModelId: null,
 	
	moduleDisplay: null,
 	
	background: null,
	
	toggleSelection: null,
 	
	intentView: null,
 	
	styleRules: null,
 	
	nodesById: null,
 	
	activeLinkArrayById: null,
 	
	inactiveLinkArrayById: null,
 	
	currentMouseOver: null,

	lastDocIdSelected: null,
 	
	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,interactionId: null
			,config: null
			,moduleDisplay: null
			,sourceModelId: null
			,background: null
			,force: {}
			,styleRules: null
			,toggleSelection: true
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
 		
		this.modelId = $n2.getUniqueId('radialCanvas');
 		
		this.styleRules = $n2.styleRule.loadRulesFromObject(opts.styleRules);
 		
		var config = opts.config;
		if( config ){
			if( config.directory ){
				this.dispatchService = config.directory.dispatchService;
				this.showService = config.directory.showService;
			};
		};

 		this.nodesById = {};
 		this.activeLinkArrayById = {};
 		this.inactiveLinkArrayById = {};
 		this.currentMouseOver = null;
 		this.lastDocIdSelected = null;
 		this.focusInfo = null;
 		this.selectInfo = null;
 		
 		// Register to events
 		if( this.dispatchService ){
 			var f = function(m){
 				_this._handleDispatch(m);
 			};
 			
 			this.dispatchService.register(DH,'selected',f);
 			this.dispatchService.register(DH,'unselected',f);
 			this.dispatchService.register(DH,'modelGetInfo',f);
 			this.dispatchService.register(DH,'modelStateUpdated',f);
// 			this.dispatchService.register(DH,'focusOn',f);
// 			this.dispatchService.register(DH,'focusOff',f);
 		};
 		
 		
 		this.createGraph();
 		
 		// Create user intent view
 		this.intentView = new $n2.userIntentView.IntentView({
 			dispatchService: this.dispatchService
 		});
 		this.intentView.addListener(function(changedNodes){
 			_this._intentViewUpdated(changedNodes);
 		});
 		
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
 	
 	_documentsUpdated: function(updatedNodeData, updatedLinkData){
 		var _this = this;
 		
 		var nodes = [];
 		for(var docId in this.nodesById){
 			var node = this.nodesById[docId];
 			nodes.push(node);
 		};
 		
 		// Sort the nodes
 		nodes.sort(function(a,b){
 			if( a.n2_id < b.n2_id ){
 				return -1;
 			};
 			if( a.n2_id > b.n2_id ){
 				return 1;
 			};
 			return 0;
 		});
 		
 		// Assign x and y
 		if( nodes.length > 0 ){
 	 		var xDelta = 360 / nodes.length;
 	 		var x = 0;
 	 		for(var i=0,e=nodes.length; i<e; ++i){
 	 			nodes[i].x = x;
 	 			nodes[i].y = this.radius;
 	 			
 	 			x += xDelta;
 	 		};
 		};

 		var links = [];
 		for(var docId in this.activeLinkArrayById){
 			var activeLinkArray = this.activeLinkArrayById[docId];
 			links.push.apply(links,activeLinkArray);
 		};

 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(nodes, function(node){ return node.n2_id; });

//	  node = node
// 	      .data(nodes.filter(function(n) { return !n.children; }))
// 	    .enter().append("text")
// 	      .attr("class", "node")
// 	      .attr("dy", ".31em")
// 	      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
// 	      .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
// 	      .text(function(d) { return d.key; })
// 	      .on("mouseover", mouseovered)
// 	      .on("mouseout", mouseouted);
 		
 		var createdNodes = selectedNodes.enter()
 			.append(function(){
 				var args = arguments;
 				return this.ownerDocument.createElementNS(this.namespaceURI, "text");
 			})
 			.attr('class','node')
 			.attr("dy", ".31em")
 			.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
 			.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
 			.text(function(d) { 
 				//return d.key; 
 				return "Test";
 			})
 			.on('click', function(n,i){
 				var doc = n.n2_doc;
 				_this._initiateMouseClick(doc);
 			})
 			.on('mouseover', function(n,i){
 				var doc = n.n2_doc;
 				_this._initiateMouseOver(doc);
 			})
 			.on('mouseout', function(n,i){
 				var doc = n.n2_doc;
 				_this._initiateMouseOut(doc);
 			})
 			;
 		this._adjustElementStyles(createdNodes);
 		
 		selectedNodes.exit()
 			.remove();
 		
 		var updatedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(updatedNodeData, function(node){ return node.n2_id; });
 		this._adjustElementStyles(updatedNodes);

 		var selectedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(links, function(link){ return link.linkId; });

 		var createdLinks = selectedLinks.enter()
 			.append('line')
 			.attr('class','link')
 			.on('click', function(n,i){
 				var doc = n.n2_doc;
 				_this._initiateMouseClick(doc);
 			})
 			.on('mouseover', function(n,i){
 				var doc = n.n2_doc;
 				_this._initiateMouseOver(doc);
 			})
 			.on('mouseout', function(n,i){
 				var doc = n.n2_doc;
 				_this._initiateMouseOut(doc);
 			})
 			;
 		this._adjustElementStyles(createdLinks);
 		
 		selectedLinks.exit()
 			.remove();
 		
 		var updatedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(updatedLinkData, function(link){ return link.linkId; });
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
 		var opts = $n2.extend({
 			added: null
 			,updated: null
 			,removed: null
 		},opts_);
 		
 		var elementsAdded = [];
 		var elementsRemoved = [];
 		var nodesUpdated = [];
 		var linksUpdated = [];
 		var updatedRequired = false;

 		if( opts.added ){
 			for(var i=0,e=opts.added.length; i<e; ++i){
 				var doc = opts.added[i];

 				var node = this._createNodeFromDocument(doc);
 				if( node ){
 					this.nodesById[doc._id] = node;
 					elementsAdded.push(node);
 					updatedRequired = true;
 				};

 				var links = this._createLinksFromDocument(doc);
 				if( links && links.length > 0 ){
 					this._addLinksToInactiveList(links);
 					elementsAdded.push.apply(elementsAdded, links);
 					updatedRequired = true;
 				};
 			};
 		};

 		if( opts.updated ){
 			for(var i=0,e=opts.updated.length; i<e; ++i){
 				var doc = opts.updated[i];

 				// Nodes
 				var updatedNode = this._createNodeFromDocument(doc);
 				var currentNode = this.nodesById[doc._id];
 				if( currentNode && !updatedNode ){
 					// Removed due to update
 					delete this.nodesById[doc._id];
 					elementsRemoved.push(currentNode);
 					updatedRequired = true;

 				} else if( !currentNode && updatedNode ){
 					// Added due to update
 					this.nodesById[doc._id] = updatedNode;
 					elementsAdded.push(currentNode);
 					updatedRequired = true;
 				
 				} else if( currentNode && updatedNode ){
 					currentNode.setDoc(doc);
 					nodesUpdated.push(currentNode);
 					updatedRequired = true;
 				};
 				
 				// Compute updated links
 				var updatedLinksById = {};
 				var links = this._createLinksFromDocument(doc);
 				if( links ){
 					for(var j=0,k=links.length; j<k; ++j){
 						var link = links[j];
 						updatedLinksById[link.linkId] = link;
 					};
 				};
 				
 				// Check links
 				var links = this._getLinksFromDocId(doc._id);
 				for(var j=0,k=links.length; j<k; ++j){
 					var link = links[j];
 					if( updatedLinksById[link.linkId] ){
 						// Updated
 						link.setDoc(doc);
 						linksUpdated.push(link);
 						delete updatedLinksById[link.linkId];
 						updatedRequired = true;
 					} else {
 						// Removed
 						this._removeLink(link);
 						elementsRemoved.push(link);
 						updatedRequired = true;
 					};
 				};
 				
 				// What is left in updatedLinksById are new links
 				var addedLinks = [];
 				for(var linkId in updatedLinksById){
 					var link = updatedLinksById[linkId];
 					addedLinks.push(link);
 				};
 				if( addedLinks.length > 0 ){
 					this._addLinksToInactiveList(addedLinks);
 					elementsAdded.push.apply(elementsAdded, addedLinks);
 					updatedRequired = true;
 				};
 			};
 		};

 		if( opts.removed ){
 			for(var i=0,e=opts.removed.length; i<e; ++i){
 				var doc = opts.removed[i];

 				var node = this.nodesById[doc._id];
 				if( node ){
 					elementsRemoved.push(node);
 					delete this.nodesById[doc._id];
 					updatedRequired = true;
 				};

 				var linkArray = this.activeLinkArrayById[doc._id];
 				if( linkArray ){
 					elementsRemoved.push.apply(elementsRemoved, linkArray);
 					delete this.activeLinkArrayById[doc._id];
 					updatedRequired = true;
 				};

 				linkArray = this.inactiveLinkArrayById[doc._id];
 				if( linkArray ){
 					elementsRemoved.push.apply(elementsRemoved, linkArray);
 					delete this.inactiveLinkArrayById[doc._id];
 				};
 			};
 		};

 		// Find links going inactive
 		var linksGoingInactive = [];
 		for(var docId in this.activeLinkArrayById){
 			var activeLinkArray = this.activeLinkArrayById[docId];
 			for(var i=0,e=activeLinkArray.length; i<e; ++i){
 				var activeLink = activeLinkArray[i];

 				var sourceDocId = activeLink.getSourceDocId();
 				var targetDocId = activeLink.getTargetDocId();

 				var inactive = false;
 				if( !this.nodesById[sourceDocId] ){
 					inactive = true;
 				} else if( !this.nodesById[targetDocId] ){
 					inactive = true;
 				};
 				
 				if( inactive ){
 					linksGoingInactive.push(activeLink);
 				};
 			};
 		};

 		// Find links going active
 		var linksGoingActive = [];
 		for(var docId in this.inactiveLinkArrayById){
 			var inactiveLinkArray = this.inactiveLinkArrayById[docId];
 			for(var i=0,e=inactiveLinkArray.length; i<e; ++i){
 				var inactiveLink = inactiveLinkArray[i];

 				var sourceDocId = inactiveLink.getSourceDocId();
 				var targetDocId = inactiveLink.getTargetDocId();

 				var source = this.nodesById[sourceDocId];
 				var target = this.nodesById[targetDocId];

 				var active = true;
 				if( !source ){
 					active = false;
 				} else if( !target ){
 					active = false;
 				};
 				
 				if( active ){
 					inactiveLink.source = source;
 					inactiveLink.target = target;
 					linksGoingActive.push(inactiveLink);
 				};
 			};
 		};
 		
 		// Move links
 		if( linksGoingInactive.length > 0 ){
 			this._removeLinksFromActiveList(linksGoingInactive);
 			this._addLinksToInactiveList(linksGoingInactive);
 			updatedRequired = true;
 		};
 		if( linksGoingActive.length > 0 ){
 			this._removeLinksFromInactiveList(linksGoingActive);
 			this._addLinksToActiveList(linksGoingActive);
 			updatedRequired = true;
 		};
 		
 		// Update nodes monitored by intent view
 		this.intentView.removeNodes(elementsRemoved);
 		this.intentView.addNodes(elementsAdded);
 		
 		if( updatedRequired ){
 			this._documentsUpdated(nodesUpdated, linksUpdated);
 		};
 	},
 	
 	_intentViewUpdated: function(changedNodes){
 		// Segregate nodes and active links
 		var nodes = [];
 		var activeLinks = [];
 		var restart = false;
 		for(var i=0,e=changedNodes.length; i<e; ++i){
 			var changedNode = changedNodes[i];
 			
 			// $n2.log(changedNode.n2_id+' sel:'+changedNode.n2_selected+' foc:'+changedNode.n2_hovered+' find:'+changedNode.n2_found);
 			
 			if( changedNode.isNode ){
 				nodes.push(changedNode);
 				
 				if( changedNode.n2_found 
 				 && !changedNode.forceFound ){
 					restart = true;
 					changedNode.forceFound = true;

 				} else if( !changedNode.n2_found 
 				 && changedNode.forceFound ){
 					changedNode.forceFound = false;
 				};
 				
 			} else if( changedNode.isLink 
 			 && this.activeLinkArrayById[changedNode.n2_id] ){
 				activeLinks.push(changedNode);
 			};
 		};

 		// Update style on nodes
 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(nodes, function(node){ return node.n2_id; });
 		this._adjustElementStyles(selectedNodes);

 		// Update style on links
 		var selectedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(activeLinks, function(link){ return link.linkId; });
 		this._adjustElementStyles(selectedLinks);
 	},
 	
 	_createNodeFromDocument: function(doc){
		return new Node(doc);
 	},
 	
 	_createLinksFromDocument: function(doc){
 		var links = [];
 		
 		// Create links for references
 		var refDocIds = {};
 		var references = [];
 		$n2.couchUtils.extractLinks(doc, references);
 		for(var i=0,e=references.length; i<e; ++i){
 			var ref = references[i];
 			if( ref.doc ){
 				refDocIds[ref.doc] = true;
 			};
 		};
 		for(var refDocId in refDocIds){
 			var link = new Link(doc, doc._id, refDocId);
 			links.push(link);
 		};
 		
 		return links;
 	},
 	
 	_getLinksFromDocId: function(docId){
 		var result = [];
 		
 		var activeLinkArray = this.activeLinkArrayById[docId];
 		if( activeLinkArray ){
 			result.push.apply(result, activeLinkArray);
 		};

 		var inactiveLinkArray = this.inactiveLinkArrayById[docId];
 		if( inactiveLinkArray ){
 			result.push.apply(result, inactiveLinkArray);
 		};
 		
 		return result;
 	},
 	
 	_removeLink: function(link){
 		var docId = link.n2_id;
 		
 		var activeLinkArray = this.activeLinkArrayById[docId];
 		if( activeLinkArray ){
 			var index = activeLinkArray.indexOf(link);
 			if( index >= 0 ){
 				if( activeLinkArray.length < 2 ){
 					delete this.activeLinkArrayById[docId];
 				} else {
 					activeLinkArray.splice(index,1);
 				};
 			};
 		};

 		var inactiveLinkArray = this.inactiveLinkArrayById[docId];
 		if( inactiveLinkArray ){
 			var index = inactiveLinkArray.indexOf(link);
 			if( index >= 0 ){
 				if( inactiveLinkArray.length < 2 ){
 					delete this.inactiveLinkArrayById[docId];
 				} else {
 					inactiveLinkArray.splice(index,1);
 				};
 			};
 		};
 	},
 	
 	_addLinksToActiveList: function(links){
 		for(var i=0,e=links.length; i<e; ++i){
 			var link = links[i];
 			var docId = link.n2_id;
 			var activeLinkArray = this.activeLinkArrayById[docId];
 			if( !activeLinkArray ){
 				activeLinkArray = [];
 				this.activeLinkArrayById[docId] = activeLinkArray;
 			};
 			var index = activeLinkArray.indexOf(link);
 			if( index < 0 ){
 				activeLinkArray.push(link);
 			};
 		};
 	},
 	
 	_removeLinksFromActiveList: function(links){
 		for(var i=0,e=links.length; i<e; ++i){
 			var link = links[i];
 			var docId = link.n2_id;
 			var activeLinkArray = this.activeLinkArrayById[docId];
 			var index = activeLinkArray.indexOf(link);
 			if( index >= 0 ){
 				if( activeLinkArray.length < 2 ){
 					delete this.activeLinkArrayById[docId];
 				} else {
 					activeLinkArray.splice(index,1);
 				};
 			};
 		};
 	},
 	
 	_addLinksToInactiveList: function(links){
 		for(var i=0,e=links.length; i<e; ++i){
 			var link = links[i];
 			var docId = link.n2_id;
 			var inactiveLinkArray = this.inactiveLinkArrayById[docId];
 			if( !inactiveLinkArray ){
 				inactiveLinkArray = [];
 				this.inactiveLinkArrayById[docId] = inactiveLinkArray;
 			};
 			var index = inactiveLinkArray.indexOf(link);
 			if( index < 0 ){
 				inactiveLinkArray.push(link);
 			};
 		};
 	},
 	
 	_removeLinksFromInactiveList: function(links){
 		for(var i=0,e=links.length; i<e; ++i){
 			var link = links[i];
 			var docId = link.n2_id;
 			var inactiveLinkArray = this.inactiveLinkArrayById[docId];
 			var index = inactiveLinkArray.indexOf(link);
 			if( index >= 0 ){
 				if( inactiveLinkArray.length < 2 ){
 					delete this.inactiveLinkArrayById[docId];
 				} else {
 					inactiveLinkArray.splice(index,1);
 				};
 			};
 		};
 	},
 	
 	_initiateMouseClick: function(doc){
 		var docId = doc._id;
 		if( this.toggleSelection 
 		 && this.lastDocIdSelected === docId ){
 			this._dispatch({
 				type: 'userUnselect'
 			});
 		} else {
 			this._dispatch({
 				type: 'userSelect'
 				,docId: doc._id
 				,doc: doc
 			});
 		};
 	},
 	
 	_initiateMouseOver: function(doc){
 		var docId = doc._id;
 		if( docId !== this.currentMouseOver ){
 			// Focus Off before Focus On
 			if( this.currentMouseOver ){
 				this._dispatch({
 					type: 'userFocusOff'
 					,docId: this.currentMouseOver
 				});
 				
 				this.currentMouseOver = null;
 			};
 			
 			this._dispatch({
 				type: 'userFocusOn'
 				,docId: docId
 				,doc: doc
 			});
 			this.currentMouseOver = docId;
 		};
 	},
 	
 	_initiateMouseOut: function(doc){
 		var docId = doc._id;
 		if( docId === this.currentMouseOver ){
 			this._dispatch({
 				type: 'userFocusOff'
 				,docId: this.currentMouseOver
 				,doc: doc
 			});
 			
 			this.currentMouseOver = null;
 		};
 	},
 	
 	_handleDispatch: function(m){
 		if( 'selected' === m.type ){
 			if( m.docId ){
 	 			this.lastDocIdSelected = m.docId;
 			} else if( m.docIds && m.docIds.length === 1 ){
 	 			this.lastDocIdSelected = m.docIds[0];
 			} else {
 	 			this.lastDocIdSelected = null;
 			};
 			
 		} else if( 'unselected' === m.type ){
 			this.lastDocIdSelected = null;
 			
 		} else if( 'modelGetInfo' === m.type ){
 			if( m.modelId === this.modelId ){
 				m.modelInfo = this._getModelInfo();
 			};
 			
 		} else if( 'modelStateUpdated' === m.type ) {
 			if( this.sourceModelId === m.modelId ){
 				if( m.state ){
 					this._sourceModelUpdated(m.state)
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
$n2.radialCanvas = {
	RadialCanvas: RadialCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
