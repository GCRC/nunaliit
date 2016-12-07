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
 ,DH = 'n2.widgetMapLegend'
 ;

//--------------------------------------------------------------------------
var MapLegendWidget = $n2.Class('MapLegendWidget',{
	
	dispatchService: null,
	
	sourceCanvasName: null,
	
	elemId: null,
	
	stylesInUse: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,sourceCanvasName: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.sourceCanvasName = opts.sourceCanvasName;

		this.stylesInUse = null;

		if( typeof this.sourceCanvasName !== 'string' ){
			throw new Error('sourceCanvasName must be specified');
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
			.addClass('n2widgetMapLegend')
			.appendTo($container);
		
		$n2.log(this._classname, this);

		this._refresh();
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},

	_handle: function(m, addr, dispatcher){
		var _this = this;

		if( 'canvasReportStylesInUse' === m.type ){
			if( m.canvasName === this.sourceCanvasName ){
				this.stylesInUse = m.stylesInUse;
				this._refresh();
			};
		};
	},
	
	_refresh: function(){
		var _this = this;

		var $elem = this._getElem();
		
		$elem.empty();
		
		// Make a map of styles by label
		var stylesByLabel = {};
		var atLeastOne = false;
		for(var styleId in this.stylesInUse){
			var styleInfo = _this.stylesInUse[styleId];
			var style = styleInfo.style;
			if( style.label ){
				var labelInfo = stylesByLabel[style.label];
				if( !labelInfo ){
					labelInfo = {};
					stylesByLabel[style.label] = labelInfo;
				};
				labelInfo[styleId] = styleInfo;
				atLeastOne = true;
			};
		};
		
		// If at least one style with label, then must display
		if( atLeastOne ){
			var labelNames = [];
			for(var labelName in stylesByLabel){
				labelNames.push(labelName);
			};
			labelNames.sort();
			
			labelNames.forEach(function(labelName){
				var labelInfo = stylesByLabel[labelName];

				var $div = $('<div>')
					.addClass('n2widgetMapLegend_labelEntry')
					.appendTo($elem);
			
				$('<div>')
					.addClass('n2widgetMapLegend_labelName')
					.text(labelName)
					.appendTo($div);
				
				var styleIds = [];
				for(var styleId in labelInfo){
					styleIds.push(styleId);
				};
				styleIds.sort();
				
				styleIds.forEach(function(styleId){
					var styleInfo = labelInfo[styleId];
					var style = styleInfo.style;

					$('<div>')
						.addClass('n2widgetMapLegend_style')
						.attr('n2-style-id',style.id)
						.appendTo($div);
				});
			});
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'mapLegendWidget' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'mapLegendWidget' ){
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
		
		new MapLegendWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetMapLegend = {
	MapLegendWidget: MapLegendWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
