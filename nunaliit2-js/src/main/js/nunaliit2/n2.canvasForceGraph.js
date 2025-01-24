/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.forceGraph'
 ;
 
// Required library: d3
var $d = window.d3;
if( !$d ) return;
 
//--------------------------------------------------------------------------
 var Popup = $n2.Class({
 	
 	showService: null,
 	
 	delay: null,
 	
 	initialize: function(opts_){
 		var opts = $n2.extend({
 			showService: null
 			,delay: null
 		},opts_);
 		
 		this.showService = opts.showService;
 		this.delay = opts.delay;
 		
 		if( $.fn.qtip ){
 			// OK
 		} else {
 			throw 'qTip2 library is not available';
 		};
 	},
 	
 	installPopup: function(domElem, doc){
 		var _this = this;
 		
 		var $elem = $(domElem);
 		
 		var qtipOptions = {
 			content:{
 				text: function(event, api){
 					var html = null;
 					
 					_this._generateHtml(doc,function(h){
 						if( html ){
 							// already returned
 							api.set('content.text',h);
 						};
 						html = h;
 					});
 					
 					if( !html ){
 						html = '<div class="olkit_wait"></div>';
 					};
 					
 					return html;
 				}
 			}
 		};
 		
 		if( this.delay ){
 			qtipOptions.content.delay = this.delay;
 		};
 		
 		$elem.qtip(qtipOptions);
 	},
 	
 	_generateHtml: function(doc, cb){
 		var $outer = $('<div>');
 		var $elem = $('<span class="n2_popup">')
 			.appendTo($outer);
 		this.showService.displayBriefDescription($elem, {}, doc);
 		var html = $outer.html();
 		cb(html);
 	}
 });
 
 //--------------------------------------------------------------------------
 var SettingsWidget = $n2.Class({
 	
 	elemId: null,
 	
 	modelId: null,
 	
 	dispatchService: null,
 	
 	parameters: null,
 	
 	parametersByEventId: null,
 	
 	addresses: null,
 	
 	initialize: function(opts_){
 		var opts = $n2.extend({
 			modelId: null
 			,dispatchService: null
 			,elemId: null
 			,style: null
 		},opts_);
 		
 		var _this = this;
 		
 		this.modelId = opts.modelId;
 		this.dispatchService = opts.dispatchService;
 		this.parameters = [];
 		this.parametersByEventId = {};
 		this.addresses = [];
 		
 		var modelInfo = null;
 		if( this.dispatchService ){
 			var m = {
 				type: 'modelGetInfo'
 				,modelId: this.modelId
 				,modelInfo: null
 			};
 			this.dispatchService.synchronousCall(DH, m);
 			modelInfo = m.modelInfo;
 		};
 		
 		var handleFn = function(m, addr, dispatcher){
 			_this._handle(m, addr, dispatcher);
 		};
 		
 		if( modelInfo && modelInfo.parameters ){
 			for(var paramKey in modelInfo.parameters){
 				var paramInfo = modelInfo.parameters[paramKey];
 				this.parameters.push(paramInfo);
 				if( paramInfo.setEvent ){
 					this.parametersByEventId[paramInfo.setEvent] = paramInfo;
 				};
 				if( paramInfo.changeEvent ){
 					this.parametersByEventId[paramInfo.changeEvent] = paramInfo;
 					var addr = this.dispatchService.register(DH, paramInfo.changeEvent, handleFn);
 					this.addresses.push(addr);
 				};
 				if( paramInfo.getEvent ){
 					this.parametersByEventId[paramInfo.getEvent] = paramInfo;
 				};
 			};
 		};
 		
 		if( this.parameters.length > 0 ){
 			this.elemId = $n2.getUniqueId();
 			var $outer = $('<div>')
 				.attr('id',this.elemId)
 				.addClass('n2ForceGraph_settings')
 				.appendTo( $('#'+opts.elemId) );
 			
 			if( opts.style ){
 				for(var name in opts.style){
 					var value = opts.style[name];
 					if( value ){
 						$outer.css(name,value);
 					};
 				};
 			};
 			
 			$('<button>')
 				.addClass('n2ForceGraph_settings_button')
 				.appendTo($outer).
 				click(function(){
 					_this._togglePanel();
 				});
 			
 			$('<div>')
 				.addClass('n2ForceGraph_settings_panel')
 				.appendTo($outer);
 			
 			this._hidePanel();
 			
 			this._refresh();
 		};
 	},
 	
 	_refresh: function(){
 		var $elem = this._getElem();
 		var $panel = $elem.find('.n2ForceGraph_settings_panel');
 		$panel.empty();
 		
 		for(var i=0,e=this.parameters.length; i<e; ++i){
 			var parameterInfo = this.parameters[i];
 			this._addParameter($panel, parameterInfo);
 		};
 	},
 	
 	_addParameter: function($elem, parameterInfo){
 		var _this = this;
 		var inputId = $n2.getUniqueId();
 		var $div = $('<div>')
 			.addClass('n2ForceGraph_settings_line')
 			.appendTo($elem);
 		
 		// Obtain current value
 		var m = {
 			type: parameterInfo.getEvent
 			,parameterId: parameterInfo.id
 		};
 		this.dispatchService.synchronousCall(DH, m);
 		var value = m.value;
 		
 		if( parameterInfo.type === 'boolean' ){
 			// Checkbox
 			var $inputDiv = $('<div>')
 				.addClass('n2ForceGraph_settings_line_input')
 				.appendTo($div);
 			var $input = $('<input>')
 				.attr('type','checkbox')
 				.attr('id',inputId)
 				.appendTo($inputDiv)
 				.change(function(){
 					var selected = $('#'+inputId).is(':checked');
 					var m = {
 						type: parameterInfo.setEvent
 						,parameterId: parameterInfo.id
 						,value: selected
 					};
 					_this.dispatchService.send(DH, m);
 				});
 			if( value ){
 				$input.attr('checked','checked');
 			};
 		};
 		
 		// Label
 		var label = _loc(parameterInfo.label);
 		var $labelDiv = $('<div>')
 			.addClass('n2ForceGraph_settings_line_label')
 			.appendTo($div);
 		$('<label>')
 			.attr('for',inputId)
 			.text(label)
 			.appendTo($labelDiv);
 	},
 	
 	_togglePanel: function(){
 		var $elem = this._getElem();
 		var $panel = $elem.find('.n2ForceGraph_settings_panel');
 		
 		if( $panel.hasClass('n2ForceGraph_settings_panel_on') ){
 			this._hidePanel();
 		} else {
 			this._showPanel();
 		};
 	},
 	
 	_showPanel: function(){
 		var $elem = this._getElem();
 		var $panel = $elem.find('.n2ForceGraph_settings_panel');
 		$panel.removeClass('n2ForceGraph_settings_panel_off');
 		$panel.addClass('n2ForceGraph_settings_panel_on');
 	},
 	
 	_hidePanel: function(){
 		var $elem = this._getElem();
 		var $panel = $elem.find('.n2ForceGraph_settings_panel');
 		$panel.removeClass('n2ForceGraph_settings_panel_on');
 		$panel.addClass('n2ForceGraph_settings_panel_off');
 	},
 	
 	_getElem: function(){
 		return $('#'+this.elemId);
 	},
 	
 	_handle: function(m, addr, dispatcher){
 		// Check if widget was removed
 		var $elem = this._getElem();
 		if( $elem.length < 1 ){
 			// De-register events
 			for(var i=0,e=this.addresses.length; i<e; ++i){
 				var address = this.addresses[i];
 				dispatcher.deregister(address);
 			};
 			this.addresses = [];
 			return;
 		};
 		
 		this._refresh();
 	}
 });

 //--------------------------------------------------------------------------
 var ModelParameter = $n2.Class({

 	model: null,

 	modelId: null,

 	parameterId: null,
 	
 	name: null,
 	
 	label: null,
 	
 	updateFn: null,
 	
 	dispatchService: null,
 	
 	eventNameSet: null,
 	
 	eventNameGet: null,
 	
 	eventNameChange: null,
 	
 	initialize: function(opts_){
 		var opts = $n2.extend({
 			model: null
 			,modelId: null // optional
 			,name: null
 			,label: null
 			,updateFn: null
 			,dispatchService: null
 		},opts_);
 		
 		var _this = this;
 		
 		this.model = opts.model;
 		this.modelId = opts.modelId;
 		this.name = opts.name;
 		this.label = opts.label;
 		this.updateFn = opts.updateFn;
 		this.dispatchService = opts.dispatchService;
 		
 		if( !this.modelId ){
 			this.modelId = $n2.getUniqueId('parameter_');
 		};
 		
 		if( !this.label ){
 			this.label = this.name;
 		};
 		
 		this.parameterId = this.modelId + '_' + this.name;
 		this.eventNameSet = this.parameterId + '_set';
 		this.eventNameGet = this.parameterId + '_get';
 		this.eventNameChange = this.parameterId + '_change';
 		
 		if( this.dispatchService ){
 			var fn = function(m, addr, dispatcher){
 				_this._handle(m, addr, dispatcher);
 			};
 			this.dispatchService.register(DH, this.eventNameSet, fn);
 			this.dispatchService.register(DH, this.eventNameGet, fn);
 		};
 	},
 	
 	getInfo: function(){
 		var info = {
 			parameterId: this.parameterId
 			,type: 'boolean'
 			,name: this.name
 			,label: this.label
 			,setEvent: this.eventNameSet
 			,getEvent: this.eventNameGet
 			,changeEvent: this.eventNameChange
 		};
 		
 		var effectiveValue = this.model[this.name];
 		info.value = effectiveValue;
 		
 		return info;
 	},
 	
 	_handle: function(m, addr, dispatcher){
 		if( m.type === this.eventNameSet ){
 			var value = m.value;
 			
 			this.model[this.name] = value;
 			if( this.updateFn ){
 				this.updateFn.call(this.model, this.name, value);
 			};
 			
 			var effectiveValue = this.model[this.name];
 			var reply = {
 				type: this.eventNameChange
 				,parameterId: this.parameterId
 				,value: effectiveValue
 			};
 			this.dispatchService.send(DH, reply);
 			
 		} else if( m.type === this.eventNameGet ){
 			var effectiveValue = this.model[this.name];
 			m.value = effectiveValue;
 		};
 	}
 });
 
// --------------------------------------------------------------------------
// This is a canvas that show nodes and links using a force graph layout. This canvas
// expects elements with the following format:
// {
//    id: <string> Required. Identifier that uniquely identifies the node or the link
//    isNode: <boolean> Set if this element is a node
//    isLink: <boolean> Set if this element is a link between two nodes
//    source: <object> Required for links. Node that is one end of the link
//    target: <object> Required for links. Node that is the other end of the link
// }
//
// The following attributes are added to the elements by the force graph canvas
// x: <number> X position. Added only to nodes.
// y: <number> Y position. Added only to nodes.
//
var ForceGraph = $n2.Class({

 	canvasId: null,
 	
 	interactionId: null,
 	
 	svgId: null,
 	
 	modelId: null,
 	
 	dispatchService: null,

 	showService: null,
 	
 	sourceModelId: null,
 	
 	svgRenderer: null,
 	
 	background: null,
 	
 	forceOptions: null,
 	
 	forceLayout: null,
 	
 	styleRules: null,
 	
 	popup: null,
 	
 	nodesById: null,
 	
 	linksById: null,
 	
 	elementsByDocId: null,
 	
 	elementGenerator: null,
 	
 	currentMouseOver: null,
 	
 	lastElementIdSelected: null,
 	
 	sticky: null,

	nodeLabelOffsetX: null,

	nodeLabelOffsetY: null,
 	
 	initialize: function(opts_){
 		var opts = $n2.extend({
 			canvasId: null
 			,interactionId: null
 			,config: null
 			,moduleDisplay: null
 			,sourceModelId: null
 			,background: null
 			,force: {}
 			,popup: null
 			,styleRules: null
 			,toggleSelection: true
			,elementGeneratorType: 'default'
			,elementGeneratorOptions: null
			,elementGenerator: null
			,nodeLabelOffsetX: 0
			,nodeLabelOffsetY: 0
 			,onSuccess: function(){}
 			,onError: function(err){}
 		},opts_);
 		
 		var _this = this;
 	
 		this.canvasId = opts.canvasId;
 		this.interactionId = opts.interactionId;
 		this.sourceModelId = opts.sourceModelId;
 		this.background = opts.background;
 		this.toggleSelection = opts.toggleSelection;
 		this.elementGenerator = opts.elementGenerator;
		if (isNaN(Number(opts.nodeLabelOffsetX))) {
			throw new Error("nodeLabelOffsetX must be a valid number")
		}
		if (isNaN(Number(opts.nodeLabelOffsetY))) {
			throw new Error("nodeLabelOffsetY must be a valid number")
		}
		this.nodeLabelOffsetX = Number(opts.nodeLabelOffsetX);
		this.nodeLabelOffsetY = Number(opts.nodeLabelOffsetY);
 		
 		this.modelId = $n2.getUniqueId('forceGraph');
 		
 		this.forceOptions = $n2.extend({
 			gravity: 0.1
 			,friction: 0.9
 			,theta: 0.8
 			,charge: -30
 			,chargeDistance: null
 			,linkDistance: 30
 			,linkStrength: 1
 		},opts.force);
 		
 		this.styleRules = $n2.styleRule.loadRulesFromObject(opts.styleRules);
 		
 		var config = opts.config;
 		if( config ){
 			if( config.directory ){
 				this.dispatchService = config.directory.dispatchService;
 				this.showService = config.directory.showService;
 			};
 		};
 		
 		try {
	 		if( opts.popup && this.showService ){
	 			var popupOptions = $n2.extend({
	 					delay: null
	 				}
	 				,opts.popup
	 				,{
	 					showService: this.showService
	 				}
	 			);
	 			this.popup = new Popup(popupOptions);
	 		};
 		} catch(err) {
 			$n2.log('ForceGraph can not install popup: '+err);
 		};

 		// Sticky parameter
 		this.sticky = false;
 		this.stickyParameter = new ModelParameter({
 			model: this
 			,modelId: this.modelId
 			,name: 'sticky'
 			,label: _loc('Sticky Nodes')
 			,updateFn: this._updateParameter
 			,dispatchService: this.dispatchService
 		});

 		this.nodesById = {};
 		this.linksById = {};
 		this.elementsByDocId = {};
 		this.currentMouseOver = null;
 		this.lastElementIdSelected = null;

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
 			this.dispatchService.register(DH,'findIsAvailable',f);
 		};
 		
 		this.forceLayout = $d.layout.force()
 			.gravity(this.forceOptions.gravity)
 			.friction(this.forceOptions.friction)
 			.theta(this.forceOptions.theta)
 			.charge(this.forceOptions.charge)
 			.linkDistance(this.forceOptions.linkDistance)
 			.linkStrength(this.forceOptions.linkStrength)
 			;
 		if( this.forceOptions.chargeDistance ){
 			this.forceLayout.chargeDistance(this.forceOptions.chargeDistance);
 		};
 		this.forceLayout.drag()
 			.on('dragstart',function(d){
 				if( _this.sticky ){
 					d.fixed = true;
 				};
 			});
 		
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
 					this._dbPerspectiveUpdated(msg.state);
 				};
 			};
 		};

 		// Setting widget
 		var settingWidget = new SettingsWidget({
 			modelId: this.modelId
 			,dispatchService: this.dispatchService
 			,elemId: this.canvasId
 			,style: null
 		});
 		
 		$n2.log('forceGraph',this);
 		$n2.log('settingWidget',settingWidget);
 	},
 	
 	createGraph: function() {
 		var _this = this; // for use in callbacks

 		this.svgId = $n2.getUniqueId();
 		var $svg = $d.select('#' + this.canvasId)
 			.append('svg')
 			.attr('id',this.svgId)
 			.classed({
 				'n2CanvasForceGraph': true
 			})
 			;
 		
 		var $background = $svg.append('rect')
 			.attr({
 				x: '0'
 				,y:'0'
 			})
 			.classed({
 				'n2CanvasForceGraph_background': true
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

 		$svg.append('g')
 			.attr('class','links');

 		$svg.append('g')
 			.attr('class','nodes');
 		
 		$svg.append('g')
			.attr('class','labels');
		
 		this.svgRenderer = new $n2.svg.Renderer({
 			svgElem: $svg[0][0]
 		});
 		//this.svgRenderer._importGraphic('star');
 		
 		this.resizeGraph();

 		// Report canvas
 		if( this.dispatchService ){
 			this.dispatchService.send(DH,{
 				type: 'canvasForceGraphReportCanvas'
 				,svg: $svg
 			});
 		};
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
 		
 		this.forceLayout.size([size[0], size[1]]).start();
 		
 		var $svg = this._getSvgElem()
 			.attr({
 				width: size[0]
				,height: size[1]
 			});
 		
 		var $background = $svg.select('.n2CanvasForceGraph_background')
 			.attr({
 				width: size[0]
				,height: size[1]
 			});
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
				this.nodesById[ added.id ] = added;
			} else if( added.isLink ){
				this.linksById[ added.id ] = added;
			};
		};

		// Updated nodes
		var updatedNodes = [];
		var updatedLinks = [];
		for(var i=0,e=updatedElements.length; i<e; ++i){
			var updated = updatedElements[i];
			
			if( updated.isNode ){
				updatedNodes.push(updated);
			} else if( updated.isLink ){
				updatedLinks.push(updated);
			};
		};
		
		// Update elements by doc id map
 		this.elementsByDocId = {};
 		for(var id in this.nodesById){
 			var element = this.nodesById[id];
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
 		for(var id in this.linksById){
 			var element = this.linksById[id];
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
		
		this._documentsUpdated(updatedNodes, updatedLinks);
		
		this.dispatchService.send(DH,{
			type: 'findAvailabilityChanged'
		});
 	},
 	
	_intentChanged: function(changedNodes){
 		// Segregate nodes and active links
 		var nodes = [];
 		var links = [];
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
 				
 			} else if( changedNode.isLink ){
 				links.push(changedNode);
 			};
 		};

 		// Update style on nodes
 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(nodes, function(node){ return node.id; });
 		this._adjustElementStyles(selectedNodes);

 		// Update style on links
 		var selectedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(links, function(link){ return link.id; });
 		this._adjustElementStyles(selectedLinks, true);

 		// Update style on labels
 		var selectedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
 			.data(nodes, function(node){ return node.id; });
 		this._adjustElementStyles(selectedLabels);
 		
 		if( restart ){
 			this.forceLayout.start();
 		};
	},
 	
 	_documentsUpdated: function(updatedNodeData, updatedLinkData){
 		var _this = this;
 		
 		var nodes = [];
 		for(var elementId in this.nodesById){
 			var node = this.nodesById[elementId];
 			nodes.push(node);
 		};

 		var links = [];
 		for(var elementId in this.linksById){
 			var link = this.linksById[elementId];
 			links.push(link);
 		};

 		this.forceLayout
 			.nodes(nodes)
 			.links(links)
 			.start();

 		// NODES
 		
 		var selectedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(nodes, function(node){ return node.id; });
 		
 		var createdNodes = selectedNodes.enter()
 			.append(function(){
 				var args = arguments;
 				return this.ownerDocument.createElementNS(this.namespaceURI, "circle");
 			})
 			.attr('class','node')
			.attr('tabindex', 0)
 			.on('click', function(n,i){
 				_this._initiateMouseClick(n);
 			})
			.on('keydown', function (n) {
				if (d3?.event?.key === 'Enter') {
					_this._initiateMouseClick(n)
				}
			})
 			.on('mouseover', function(n,i){
 				_this._initiateMouseOver(n);
 			})
 			.on('mouseout', function(n,i){
 				_this._initiateMouseOut(n);
 			})
 			.call(this.forceLayout.drag)
 			.each(function(datum,i){
 				if( _this.popup && datum.n2_doc ){
 					_this.popup.installPopup(this,datum.n2_doc);
 				};
 			})
 			;
 		this._adjustElementStyles(createdNodes);
 		
 		selectedNodes.exit()
 			.remove();
 		
 		var updatedNodes = this._getSvgElem().select('g.nodes').selectAll('.node')
 			.data(updatedNodeData, function(node){ return node.id; });
 		this._adjustElementStyles(updatedNodes);

 		var selectedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(links, function(link){ return link.id; });

 		// LINKS
 		
 		var createdLinks = selectedLinks.enter()
 			.append('path')
 			.attr('class','link')
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
 		
 		var updatedLinks = this._getSvgElem().select('g.links').selectAll('.link')
 			.data(updatedLinkData, function(link){ return link.id; });
 		this._adjustElementStyles(updatedLinks, true);

 		// LABELS
 		
 		var selectedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
			.data(nodes, function(node){ return node.id; });
		
		var createdLabels = selectedLabels.enter()
			.append(function(){
				var args = arguments;
				return this.ownerDocument.createElementNS(this.namespaceURI, "text");
			})
			.attr('class','label')
			.on('click', function(n,i){
				_this._initiateMouseClick(n);
			})
			.on('mouseover', function(n,i){
				_this._initiateMouseOver(n);
			})
			.on('mouseout', function(n,i){
				_this._initiateMouseOut(n);
			})
			.call(this.forceLayout.drag)
			.each(function(datum,i){
				if( _this.popup && datum.n2_doc ){
					_this.popup.installPopup(this,datum.n2_doc);
				};
			})
			;
		this._adjustElementStyles(createdLabels);
		
		selectedLabels.exit()
			.remove();
		
		var updatedLabels = this._getSvgElem().select('g.labels').selectAll('.label')
			.data(updatedNodeData, function(node){ return node.id; });
		this._adjustElementStyles(updatedLabels);

		// Animate force graph
		
 		this.forceLayout.on('tick', function(e) {

 			// Deal with find event
 			var width = $('#' + _this.canvasId).width();
 			var height = $('#' + _this.canvasId).height();
 			var midX = width / 2;
 			var midY = height / 2;
 			selectedNodes.each(function(n,i){
 				if( n.n2_found ){
 					if( n.x > midX ){
 						var k = (n.x - midX) / 2;
 						n.x -= k;
 					} else {
 						var k = (midX - n.x) / 2;
 						n.x += k;
 					};
 					if( n.y > midY ){
 						var k = (n.y - midY) / 2;
 						n.y -= k;
 					} else {
 						var k = (midY - n.y) / 2;
 						n.y += k;
 					};
 				};
 			});
 			
 			selectedNodes
 				.attr('cx', function(d) { return d.x; })
 				.attr('cy', function(d) { return d.y; });
 			
 			selectedLinks
 				.attr('d', function(d){
 					if( typeof d.pathFn === 'function' ){
 						return d.pathFn(d, d.source, d.target);
 					} else {
 	 					var path = [
		 					'M', d.source.x, ' ', d.source.y,
		 					' L ', d.target.x, ' ', d.target.y
	 					].join('');
	 					return path;
 					};
 				});		

 			selectedLabels
				.attr('x', function(d) { return d.x + _this.nodeLabelOffsetX ; })
				.attr('y', function(d) { return d.y + _this.nodeLabelOffsetY ; });
 		});
 	},
 	
 	_adjustElementStyles: function(selectedElements, isLine){
 		var _this = this;
 		selectedElements.each(function(n,i){
 			n.n2_elem = this;
 			var symbolizer = _this.styleRules.getSymbolizer(n);
 			symbolizer.adjustSvgElement(this,n);
 			delete n.n2_elem;
 		});
 		
 		if( isLine ){
 			selectedElements.attr('fill','none');
 		};
 	},
 	
 	_dispatch: function(m){
 		var d = this.dispatchService;
 		if( d ){
 			d.send(DH,m);
 		};
 	},
 	
 	_dbPerspectiveUpdated: function(opts_){
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
 					this._dbPerspectiveUpdated(m.state);
 				};
 			};

 		} else if( 'windowResized' === m.type ) {
 			this.resizeGraph();

 		} else if( 'findIsAvailable' === m.type ) {
 			var docId = m.docId;
 			if( docId 
 			 && this.elementsByDocId[docId] 
 			 && this.elementsByDocId[docId].length ){
 				m.isAvailable = true;
 			};
 		};
 	},
 	
 	_getModelInfo: function(){
 		var info = {
 			modelId: this.modelId
 			,modelType: 'obi_force_graph'
 			,parameters: []
 		};
 		
 		info.parameters.push( this.stickyParameter.getInfo() );
 		
 		return info;
 	},
 	
 	_updateParameter: function(paramName, paramValue){
 		if( 'sticky' === paramName ){
 			if( !paramValue ){
 				var restart = false;
 				for(var docId in this.nodesById){
 					var node = this.nodesById[docId];
 					if( node.fixed ){
 						node.fixed = false;
 						restart = true;
 					};
 				};

 				if( restart ){
 					this.forceLayout.start();
 				};
 			};
 		};
 	}
 });
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'forceGraph' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'forceGraph' ){
		
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
		
		new ForceGraph(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasForceGraph = {
	ForceGraph: ForceGraph
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
