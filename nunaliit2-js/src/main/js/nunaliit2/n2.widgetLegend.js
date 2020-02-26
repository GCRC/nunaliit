/*
Copyright (c) 2020, Geomatics and Cartographic Research Centre, Carleton 
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
	,DH = 'n2.widgetLegend'
		;

//	--------------------------------------------------------------------------
	var LegendWidget = $n2.Class('LegendWidget',{

		dispatchService: null,

		sourceCanvasName: null,

		labels: null,

		elemId: null,

		stylesInUse: null,

		cachedSymbols: null,

		/*
		 * These are versions of functions that are throttled. These functions touch
		 * the DOM structure and should not be called too often as they affect
		 * performance.
		 */
		_throttledRefresh: null,

		initialize: function(opts_){
			var opts = $n2.extend({
				containerId: null
				,dispatchService: null
				,sourceCanvasName: null
				,labels: null
			},opts_);

			var _this = this;

			this.dispatchService = opts.dispatchService;
			this.sourceCanvasName = opts.sourceCanvasName;
			this.labels = opts.labels;

			this.stylesInUse = null;
			this.cachedSymbols = {};
			this._throttledRefresh = $n2.utils.throttle(this._refresh, 2000);

			if( typeof this.sourceCanvasName !== 'string' ){
				throw new Error('sourceCanvasName must be specified');
			};

			if( this.labels && !$n2.isArray(this.labels) ){
				throw new Error('labels must be an array');
			};

			// Set up model listener
			if( this.dispatchService ){
				var f = function(m, addr, dispatcher){
					_this._handle(m, addr, dispatcher);
				};

				this.dispatchService.register(DH,'canvasReportStylesInUse',f);

				// Obtain current styles in use
				var msg = {
						type: 'canvasGetStylesInUse'
							,canvasName: this.sourceCanvasName
				};
				this.dispatchService.synchronousCall(DH,msg);
				this.stylesInUse = msg.stylesInUse;
			};

			// Get container
			var containerId = opts.containerId;
			if( !containerId ){
				throw new Error('containerId must be specified');
			};
			var $container = $('#'+containerId);

			this.elemId = $n2.getUniqueId();

			$('<div>')
			.attr('id',this.elemId)
			.addClass('n2widgetLegend')
			.appendTo($container);

			$n2.log(this._classname, this);

			this._throttledRefresh();
		},

		_getElem: function(){
			return $('#'+this.elemId);
		},

		_handle: function(m, addr, dispatcher){
			var _this = this;

			if( 'canvasReportStylesInUse' === m.type ){
				if( m.canvasName === this.sourceCanvasName ){
					this.stylesInUse = m.stylesInUse;
					this._throttledRefresh();
				};
			};
		},

		_refresh: function(){
			var _this = this;

			var $elem = this._getElem();
			$elem.empty();
			this.refreshCount = this.refreshCount ? this.refreshCount + 1 : 1;

			// Make a map of styles by label
			var stylesByLabel = {};
			var atLeastOne = false;
			for(var styleId in this.stylesInUse){
				var styleInfo = _this.stylesInUse[styleId];
				var style = styleInfo.style;
				if( style.label ){
					var effectiveLabel = _loc( style.label );
					var labelInfo = stylesByLabel[effectiveLabel];
					if( !labelInfo ){
						labelInfo = {};
						stylesByLabel[effectiveLabel] = labelInfo;
					};
					labelInfo[styleId] = styleInfo;
					atLeastOne = true;
				};
			};

			// If at least one style with label, then must display
			if( atLeastOne ){
				var $outer = $('<div>')
				.addClass('n2widgetLegend_outer')
				.appendTo($elem);

				var labelNames = [];

				if( this.labels ){
					this.labels.forEach(function(label){
						var effectiveLabel = _loc(label);
						if( stylesByLabel[effectiveLabel] ){
							labelNames.push(effectiveLabel);
						};
					});

				} else {
					for (var labelName in stylesByLabel){
						labelNames.push(labelName);
					};

					labelNames.sort();
				};

				labelNames.forEach(function(labelName){
					var labelInfo = stylesByLabel[labelName];

					var $div = $('<div>')
					.addClass('n2widgetLegend_legendEntry')
					.appendTo($outer);

					var $symbolColumn = $('<div>')
					.addClass('n2widgetLegend_symbolColumn')
					.appendTo($div);

					var $symbolColumnPoint = $('<div>')
					.addClass('n2widgetLegend_symbolColumn_point')
					.appendTo($symbolColumn);				

					var $symbolColumnLine = $('<div>')
					.addClass('n2widgetLegend_symbolColumn_line')
					.appendTo($symbolColumn);				

					var $symbolColumnPolygon = $('<div>')
					.addClass('n2widgetLegend_symbolColumn_polygon')
					.appendTo($symbolColumn);

					var $symbolColumnCluster = $('<div>')
					.addClass('n2widgetLegend_symbolColumn_cluster')
					.appendTo($symbolColumn);

					var $labelColumn = $('<div>')
					.addClass('n2widgetLegend_labelColumn')
					.appendTo($div);

					$('<div>')
					.addClass('n2widgetLegend_labelEntry')
					.text(labelName)
					.appendTo($labelColumn);

					var styleIds = [];
					for(var styleId in labelInfo){
						styleIds.push(styleId);
					};
					styleIds.sort();

					styleIds.forEach(function(styleId){
						var styleInfo = labelInfo[styleId];
						var style = styleInfo.style;

						// Check if point is a cluster and create either a point or
						// cluster symbol
						if( styleInfo.point && styleInfo.point.cluster && styleInfo.point.cluster.length > 1 ){
							var $preview = $('<div>')
							.addClass('n2widgetLegend_preview n2widgetLegend_previewCluster')
							.attr('n2-style-id',style.id)
							.appendTo($symbolColumnCluster);
							_this._insertSvgPreviewPoint($preview, style, styleInfo.point);
						} else if( styleInfo.point ){
							var $preview = $('<div>')
							.addClass('n2widgetLegend_preview n2widgetLegend_previewPoint')
							.attr('n2-style-id',style.id)
							.appendTo($symbolColumnPoint);
							_this._insertSvgPreviewPoint($preview, style, styleInfo.point);
						};

						if( styleInfo.line ){
							var $preview = $('<div>')
							.addClass('n2widgetLegend_preview n2widgetLegend_previewLine')
							.attr('n2-style-id',style.id)
							.appendTo($symbolColumnLine);
							_this._insertSvgPreviewLine($preview, style, styleInfo.line);
						};

						if( styleInfo.polygon ){
							var $preview = $('<div>')
							.addClass('n2widgetLegend_preview n2widgetLegend_previewPolygon')
							.attr('n2-style-id',style.id)
							.appendTo($symbolColumnPolygon);
							_this._insertSvgPreviewPolygon($preview, style, styleInfo.polygon);
						};
					});
				});
			};
		},

		_insertSvgPreviewPoint: function($parent, style, context_){
			var _this = this;

			var context = {};
			for(var key in context_){
				var value = context_[key];

				if( 'n2_hovered' === key ){
					context[key] = false;
				} else if( 'n2_selected' === key ){
					context[key] = false;
				} else if( 'n2_found' === key ){
					context[key] = false;
				} else {
					context[key] = value;
				};
			};

			var symbolizer = style.getSymbolizer(context);

			// SVG
			var svg = this._createSVGNode('svg');
			if( svg ) {
				this._setAttr(svg, 'version', '1.1');
				this._setAttr(svg, 'viewBox', '-7 -7 14 14');
				this._addClass(svg, 'n2widgetLegend_svg');
				var $svg = $(svg);

				// Geometry
				var graphicName = symbolizer.getSymbolValue('graphicName',context);
				var geom = null;
				if( graphicName 
						&& this.cachedSymbols[graphicName] ){
					geom = this._createSVGNode('path');
					this._setAttr(geom, 'd', this.cachedSymbols[graphicName]);

				} else if( graphicName 
						&& OpenLayers.Renderer.symbol[graphicName] ) {
					var path = this._computePathFromSymbol(OpenLayers.Renderer.symbol[graphicName]);
					this.cachedSymbols[graphicName] = path;
					geom = this._createSVGNode('path');
					this._setAttr(geom, 'd', this.cachedSymbols[graphicName]);

				} else {
					geom = this._createSVGNode('circle');
					this._setAttr(geom, 'r', 5);
				};
				if( geom ) {
					symbolizer.forEachSymbol(function(name,value){
						if( 'r' === name ){
							// Do not adjust radius
						} else if( 'fill-opacity' === name ) {
							// Make opacity more pronounced
							var effectiveValue = (value * 0.5) + 0.5;
							_this._setAttr(geom, name, effectiveValue);
						} else {
							_this._setAttr(geom, name, value);
						};
					},context);

					svg.appendChild(geom);
				};

				$parent.append($svg);
			};
		},

		_insertSvgPreviewLine: function($parent, style, context_){
			var _this = this;

			var context = {};
			for(var key in context_){
				var value = context_[key];

				if( 'n2_hovered' === key ){
					context[key] = false;
				} else if( 'n2_selected' === key ){
					context[key] = false;
				} else if( 'n2_found' === key ){
					context[key] = false;
				} else {
					context[key] = value;
				};
			};

			var symbolizer = style.getSymbolizer(context);

			// SVG
			var svg = this._createSVGNode('svg');
			if( svg ) {
				this._setAttr(svg, 'version', '1.1');
				this._setAttr(svg, 'viewBox', '-7 -7 14 14');
				this._addClass(svg, 'n2widgetLegend_svg');
				var $svg = $(svg);

				// Geometry
				var geom = this._createSVGNode('line');
				this._setAttr(geom, 'x1', -5);
				this._setAttr(geom, 'y1', 0);
				this._setAttr(geom, 'x2', 5);
				this._setAttr(geom, 'y2', 0);
				if( geom ) {
					symbolizer.forEachSymbol(function(name,value){
						_this._setAttr(geom, name, value);
					},context);

					svg.appendChild(geom);
				};

				$parent.append($svg);
			};
		},

		_insertSvgPreviewPolygon: function($parent, style, context_){
			var _this = this;

			var context = {};
			for(var key in context_){
				var value = context_[key];

				if( 'n2_hovered' === key ){
					context[key] = false;
				} else if( 'n2_selected' === key ){
					context[key] = false;
				} else if( 'n2_found' === key ){
					context[key] = false;
				} else {
					context[key] = value;
				};
			};

			var symbolizer = style.getSymbolizer(context);

			// SVG
			var svg = this._createSVGNode('svg');
			if( svg ) {
				this._setAttr(svg, 'version', '1.1');
				this._setAttr(svg, 'viewBox', '-7 -7 14 14');
				this._addClass(svg, 'n2widgetLegend_svg');
				var $svg = $(svg);

				// Geometry
				var geom = this._createSVGNode('path');
				this._setAttr(geom, 'd', 'M -5 -5 L -2.5 5 L 5 5 L 2.5 -5 Z');
				if( geom ) {
					symbolizer.forEachSymbol(function(name,value){
						if( 'fill-opacity' === name ) {
							// Make opacity more pronounced
							var effectiveValue = (value * 0.5) + 0.5;
							_this._setAttr(geom, name, effectiveValue);
						} else {
							_this._setAttr(geom, name, value);
						};
					},context);

					svg.appendChild(geom);
				};

				$parent.append($svg);
			};
		},

		_createSVGNode: function(type, id) {
			var node = null;
			if( document.createElementNS ) {
				node = document.createElementNS('http://www.w3.org/2000/svg', type);
				if (id) {
					node.setAttributeNS(null, 'id', id);
				};
			};
			return node;    
		},

		_setAttr: function(node, name, value) {
			node.setAttributeNS(null, name, value);
		},

		_addClass: function(elem, className) {
			var classNames = [];

			var currentClasses = elem.getAttribute('class') || '';
			if( currentClasses ) {
				classNames = currentClasses.split(' ');
			};

			if( classNames.indexOf(className) < 0 ){
				classNames.push(className);
			};

			elem.setAttribute('class',classNames.join(' '));
		},

		/**
		 * Method: _computePathFromSymbol Given an OpenLayers symbol (array of
		 * points, which are tuples of x,y coordinates), create a SVG path with an
		 * approximate area of 30 (area of a circle with a radius of 5) Example for
		 * symbol: [0,0, 1,0, 1,1, 0,1, 0,0] Examplke fo SVG Path: 'M -4.4 -4.4 L
		 * -4.4 4.4 L 4.4 4.4 L 4.4 -4.4 Z'
		 */
		_computePathFromSymbol: function(symbol){
			var area = 0,
			minx = undefined,
			maxx = undefined,
			miny = undefined,
			maxy = undefined;

			// Figure out bounding box
			for(var i=0,e=symbol.length; i<e; i=i+2){
				var x = symbol[i];
				var y = symbol[i+1];

				if( typeof minx === 'undefined' ){
					minx = x;
				} else if( minx > x ){
					minx = x;
				};

				if( typeof maxx === 'undefined' ){
					maxx = x;
				} else if( maxx < x ){
					maxx = x;
				};

				if( typeof miny === 'undefined' ){
					miny = y;
				} else if( miny > y ){
					miny = y;
				};

				if( typeof maxy === 'undefined' ){
					maxy = y;
				} else if( maxy < y ){
					maxy = y;
				};
			};

			// Compute path, recentering the symbol and adjusting the area so
			// it fits a bounding box of 10x10
			var path = [],
			transx = (minx+maxx)/2,
			transy = (miny+maxy)/2,
			width = maxx-minx,
			height = maxy-miny,
			factor = (width > height) ? width / 10 : height / 10;
			if( factor <= 0 ){
				factor = 1;
			};
			for(var i=0,e=symbol.length; i<e; i=i+2){
				var x = symbol[i];
				var y = symbol[i+1];

				var effX = (x-transx)/factor;
				var effY = (y-transy)/factor;

				// Round to .01
				effX = Math.floor(effX * 100) / 100;
				effY = Math.floor(effY * 100) / 100;

				if( 0 === i ){
					path.push('M ');
				} else {
					path.push('L ');
				};

				path.push(''+effX);
				path.push(' '+effY+' ');
			};
			path.push('Z');

			return path.join('');
		}
	});


	var LegendWidget2 = $n2.Class('LegendWidget2', {

			dispatchService: null,
			
			showService: null,
			
			sourceModelId: null,
			
			elemId: null,

			selectedChoicesChangeEventName: null,

			selectedChoicesSetEventName: null,

			allSelectedChangeEventName: null,

			allSelectedSetEventName: null,

			availableChoicesChangeEventName: null,

			availableChoices: null,
			
			selectedChoices: null,
			
			selectedChoiceIdMap: null,
			
			allSelected: null,
			
			allChoicesLabel: null,

			tooltip: null,

			/* 
			 * These are versions of functions that are throttled. These
			 * functions touch the DOM structure and should not be called too.
			 * often as they affect performance.
			 */
			_throttledAvailableChoicesUpdated: null,
			
			initialize: function(opts_){
				var opts = $n2.extend({
					containerId: null
					,dispatchService: null
					,showService: null
					,sourceModelId: null
					,allChoicesLabel: null
					,tooltip: null
					,moduleDisplay: null
					,styleRules: null
				},opts_);
				
				var _this = this;
				
				this.dispatchService = opts.dispatchService;
				this.showService = opts.showService;
				this.sourceModelId = opts.sourceModelId;
				this.allChoicesLabel = opts.allChoicesLabel;

				if (opts.tooltip
					&& typeof opts.tooltip === 'string'
					&& opts.tooltip.length) {
					this.tooltip = opts.tooltip;
				}
				
				
				this.styleRules = opts.styleRules;
				this.completeChoices = [];
				this.availableChoices = [];
				this.selectedChoices = [];
				this.selectedChoiceIdMap = {};
				this.allSelected = false;
				//this.availableChoicesChangeEventName = 'canvasReportStylesInUse';
				this._throttledAvailableChoicesUpdated = $n2.utils.throttle(this._availableChoicesUpdated, 1500);

				
				// Set up model listener
				if( this.dispatchService ){

					var modelInfoRequest = {
							type: 'modelGetInfo'
							,modelId: this.sourceModelId
							,modelInfo: null
					};
					this.dispatchService.synchronousCall(DH, modelInfoRequest);
					var sourceModelInfo = modelInfoRequest.modelInfo;
					//
					if( sourceModelInfo 
					 && sourceModelInfo.parameters 
					 && sourceModelInfo.parameters.completeChoices ){
						var paramInfo = sourceModelInfo.parameters.completeChoices;
						this.completeChoicesChangeEventName = paramInfo.changeEvent;

						//The value of this parameter is an array of string
						if( paramInfo.value ){
							this.completeChoices = (paramInfo.value);
						};
					};
						
					this.selectedChoices = paramInfo.value;

					this.selectedChoiceIdMap = {};
					this.selectedChoices.forEach(function(choiceId){
						_this.selectedChoiceIdMap[choiceId] = true;
					});

					var paramInfo = sourceModelInfo.parameters.allSelected;
					this.allSelectedChangeEventName = paramInfo.changeEvent;
					this.allSelectedSetEventName = paramInfo.setEvent;

				
					this.allSelected = paramInfo.value;

						
					
					var fn = function(m, addr, dispatcher){
						_this._handle(m, addr, dispatcher);
					};

//					if( this.availableChoicesChangeEventName ){
//						this.dispatchService.register(DH, this.availableChoicesChangeEventName, fn);
//					};
//
//					if( this.selectedChoicesChangeEventName ){
//						this.dispatchService.register(DH, this.selectedChoicesChangeEventName, fn);
//					};
//
//					if( this.allSelectedChangeEventName ){
//						this.dispatchService.register(DH, this.allSelectedChangeEventName, fn);
//					};
				};

				// Get container
				var containerId = opts.containerId;
				if( !containerId ){
					throw new Error('containerId must be specified');
				};
				var $container = $('#'+containerId);
				
				this.elemId = $n2.getUniqueId();
				
				var $selector = $('<div>')
					.attr('id',this.elemId)
					.addClass('n2widget_multiFilterSelection')
					.appendTo($container);
				

				if (this.tooltip) {
					$selector.attr('title', this.tooltip);
				}

				//this._throttledAvailableChoicesUpdated();
				this.refresh();
				$n2.log(this._classname, this);
				
			},
			
			refresh: function(){
				var _this = this;

				var $elem = this._getElem();
				$elem.empty();
				this.refreshCount = this.refreshCount ? this.refreshCount + 1 : 1;

				// Make a map of styles by label
				var stylesByLabel = {};
				var atLeastOne = false;
				for(var styleId in this.stylesDefined){
					var styleInfo = _this.stylesDefined[styleId];
					var style = styleInfo.style;
					if( style.label ){
						var effectiveLabel = _loc( style.label );
						var labelInfo = stylesByLabel[effectiveLabel];
						if( !labelInfo ){
							labelInfo = {};
							stylesByLabel[effectiveLabel] = labelInfo;
						};
						labelInfo[styleId] = styleInfo;
						atLeastOne = true;
					};
				};

				// If at least one style with label, then must display
				if( atLeastOne ){
					var $outer = $('<div>')
					.addClass('n2widgetLegend_outer')
					.appendTo($elem);

					var labelNames = [];

					if( this.labels ){
						this.labels.forEach(function(label){
							var effectiveLabel = _loc(label);
							if( stylesByLabel[effectiveLabel] ){
								labelNames.push(effectiveLabel);
							};
						});

					} else {
						for (var labelName in stylesByLabel){
							labelNames.push(labelName);
						};

						labelNames.sort();
					};

					labelNames.forEach(function(labelName){
						var labelInfo = stylesByLabel[labelName];

						var $div = $('<div>')
						.addClass('n2widgetLegend_legendEntry')
						.appendTo($outer);

						var $symbolColumn = $('<div>')
						.addClass('n2widgetLegend_symbolColumn')
						.appendTo($div);

						var $symbolColumnPoint = $('<div>')
						.addClass('n2widgetLegend_symbolColumn_point')
						.appendTo($symbolColumn);				

						var $symbolColumnLine = $('<div>')
						.addClass('n2widgetLegend_symbolColumn_line')
						.appendTo($symbolColumn);				

						var $symbolColumnPolygon = $('<div>')
						.addClass('n2widgetLegend_symbolColumn_polygon')
						.appendTo($symbolColumn);

						var $symbolColumnCluster = $('<div>')
						.addClass('n2widgetLegend_symbolColumn_cluster')
						.appendTo($symbolColumn);

						var $labelColumn = $('<div>')
						.addClass('n2widgetLegend_labelColumn')
						.appendTo($div);

						$('<div>')
						.addClass('n2widgetLegend_labelEntry')
						.text(labelName)
						.appendTo($labelColumn);

					});
				};
			},
			
			_getElem: function(){
				return $('#'+this.elemId);
			},

			_availableChoicesUpdated: function(){
				var _this = this;

				var $elem = this._getElem();
				$elem.empty();

				// All Choices
				var allChoicesLabel = _loc('All');
				if( this.allChoicesLabel ){
					allChoicesLabel = _loc(this.allChoicesLabel);
				};
				var $a = $('<a>')
					.addClass('n2widget_legend2_optionAllChoices n2widget_legend2_option')
					.attr('href','#')
					.attr('n2-choice-id',ALL_CHOICES)
					.appendTo($elem)
					.click(function(){
						var $a = $(this);
						var choiceId = $a.attr('n2-choice-id');
						_this._selectionClicked(choiceId, $a);
						return false;
					});
				$('<span>')
					.text(allChoicesLabel)
					.appendTo($a);
				
				for(var i=0,e=this.availableChoices.length; i<e; ++i){
					var choice = this.availableChoices[i];
					
					var label = choice.label;
					if( !label ){
						label = choice.id;
					};
					
					var $a = $('<a>')
						.addClass('n2widget_legend2_option')
						.attr('href',choice.id)
						.attr('n2-choice-id',choice.id)
						.appendTo($elem)
						.click(function(){
							var $a = $(this);
							var choiceId = $a.attr('n2-choice-id');
							_this._selectionClicked(choiceId, $a);
							return false;
						});
					$('<span>')
						.text(label)
						.appendTo($a);
				};
				
				this._adjustSelectedItem();
			},
			
			_adjustSelectedItem: function(){
				var _this = this;
				
				var $elem = this._getElem();
				$elem.find('.n2widget_legend2_option').each(function(){
					var $option = $(this);
					var choiceId = $option.attr('n2-choice-id');
					
					var selected = false;
					if( ALL_CHOICES === choiceId ){
						if( _this.allSelected ){
							selected = true;
						};
					} else {
						if( _this.selectedChoiceIdMap[choiceId] ){
							selected = true;
						};
					};
					
					if( selected ){
						$option.removeClass('n2widget_legend2_notSelected');
						$option.addClass('n2widget_legend2_selected');
					} else {
						$option.removeClass('n2widget_legend2_selected');
						$option.addClass('n2widget_legend2_notSelected');
					};
				});
			},
			
			// This is called when one of the selection is clicked
			_selectionClicked: function(choiceId, $a){
				var _this = this;

				if( ALL_CHOICES === choiceId ){
					if( this.allSelected ){
						// If already all selected, select none
						this.dispatchService.send(DH,{
							type: this.selectedChoicesSetEventName
							,value: []
						});

					} else {
						// Select all
						this.dispatchService.send(DH,{
							type: this.allSelectedSetEventName
							,value: true
						});
					};

				} else {
					var selectedChoiceIds = [];

					var removed = false;
					this.selectedChoices.forEach(function(selectedChoiceId){
						if( selectedChoiceId === choiceId ){
							removed = true;
						} else {
							selectedChoiceIds.push(selectedChoiceId);
						};
					});
					
					if( !removed ){
						selectedChoiceIds.push(choiceId);
					};
					
					this.dispatchService.send(DH,{
						type: this.selectedChoicesSetEventName
						,value: selectedChoiceIds
					});
				};
			},
			
			_handle: function(m, addr, dispatcher){
				var _this = this;

				if( this.availableChoicesChangeEventName === m.type ){
					if( m.value ){
						this.availableChoices = m.value;
						
						//this._availableChoicesUpdated();
						this._throttledAvailableChoicesUpdated();
					};
					
				} else if( this.selectedChoicesChangeEventName === m.type ){
					if( m.value ){
						this.selectedChoices = m.value;
						
						this.selectedChoiceIdMap = {};
						this.selectedChoices.forEach(function(choiceId){
							_this.selectedChoiceIdMap[choiceId] = true;
						});
						
						this._adjustSelectedItem();
					};

				} else if( this.allSelectedChangeEventName === m.type ){
					if( typeof m.value === 'boolean' ){
						this.allSelected = m.value;
						
						this._adjustSelectedItem();
					};
				};
			}
	})
//	--------------------------------------------------------------------------
	function HandleWidgetAvailableRequests(m){
		if( m.widgetType === 'legendWidget' ){
			if( $.fn.slider ) {
				m.isAvailable = true;
			};
		} else if ( m.widgetType === 'legendWidget2' ){
				m.isAvailable = true;
		}
	};

//	--------------------------------------------------------------------------
	function HandleWidgetDisplayRequests(m){
		if( m.widgetType === 'legendWidget' ){
			var widgetOptions = m.widgetOptions;
			var containerId = m.containerId;
			var config = m.config;

			var options = {};

			if( widgetOptions ){
				for(var key in widgetOptions){
					var value = widgetOptions[key];
					options[key] = value;
				};
			};

			options.containerId = containerId;

			if( config && config.directory ){
				options.dispatchService = config.directory.dispatchService;
			};

			new LegendWidget(options);
		} else if (m.widgetType === 'legendWidget2'){
			var widgetOptions = m.widgetOptions;
			var containerId = m.containerId;
			var config = m.config;
			var styleRules = m.styleRules;
			
			var options = {};
			
			if( widgetOptions ){
				var sourceModelIds = undefined;
				
				for(var key in widgetOptions){
					var value = widgetOptions[key];

					if( 'sourceModelId' === key ){
						if( typeof value === 'string' ){
							if( !sourceModelIds ){
								sourceModelIds = [];
							};
							sourceModelIds.push(value);
						} else {
							throw new Error('In LegendWidget2 configuration, sourceModelId must be a string');
						};
						
					} else if( 'sourceModelIds' === key ){
						if( $n2.isArray(value) ){
							value.forEach(function(sourceModelId){
								if( typeof sourceModelId === 'string' ){
									if( !sourceModelIds ){
										sourceModelIds = [];
									};
									sourceModelIds.push(sourceModelId);
								} else {
									throw new Error('In LegendWidget2 configuration, sourceModelIds must be an array of strings');
								};
							});
						} else {
							throw new Error('In modelBrowserWidget configuration, sourceModelIds must be an array of strings');
						};
						
					} else {
						options[key] = value;
					};
				};
				
				options.sourceModelIds = sourceModelIds;
			};

			options.containerId = containerId;
			
			if( config && config.directory ){
				options.dispatchService = config.directory.dispatchService;
				options.showService = config.directory.showService;
			};
			
			new LegendWidget2(options);
		};
	};

//	--------------------------------------------------------------------------
	$n2.widgetLegend = {
			LegendWidget: LegendWidget
			,LegendWidget2: LegendWidget2
			,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
			,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
	};

})(jQuery,nunaliit2);
