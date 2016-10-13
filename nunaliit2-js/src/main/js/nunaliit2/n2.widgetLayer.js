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
 ,DH = 'n2.widgetLayer'
 ,ALL_LAYERS = '__ALL_LAYERS__'
 ;

//--------------------------------------------------------------------------
var LayerSelectionWidget = $n2.Class({
	
	dispatchService: null,
	
	showService: null,
	
	sourceModelId: null,
	
	elemId: null,

	selectedLayersChangeEventName: null,

	selectedLayersSetEventName: null,

	availableLayersChangeEventName: null,

	availableLayers: null,
	
	lastSelectedLayerId: null,
	
	allLayersLabel: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,showService: null
			,sourceModelId: null
			,allLayersLabel: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.sourceModelId = opts.sourceModelId;
		this.allLayersLabel = opts.allLayersLabel;
		
		this.availableLayers = [];
		this.lastSelectedLayerId = ALL_LAYERS;
		
		// Set up model listener
		if( this.dispatchService ){
			// Get model info
			var modelInfoRequest = {
				type: 'modelGetInfo'
				,modelId: this.sourceModelId
				,modelInfo: null
			};
			this.dispatchService.synchronousCall(DH, modelInfoRequest);
			var sourceModelInfo = modelInfoRequest.modelInfo;
			
			if( sourceModelInfo 
			 && sourceModelInfo.parameters 
			 && sourceModelInfo.parameters.availableLayers ){
				var paramInfo = sourceModelInfo.parameters.availableLayers;
				this.availableLayersChangeEventName = paramInfo.changeEvent;

				if( paramInfo.value ){
					this.availableLayers = paramInfo.value;
				};
			};
			
			if( sourceModelInfo 
			 && sourceModelInfo.parameters 
			 && sourceModelInfo.parameters.selectedLayers ){
				var paramInfo = sourceModelInfo.parameters.selectedLayers;
				this.selectedLayersChangeEventName = paramInfo.changeEvent;
				this.selectedLayersSetEventName = paramInfo.setEvent;

				if( paramInfo.value ){
					this.selectedLayers = paramInfo.value;
				};
			};
			
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			if( this.availableLayersChangeEventName ){
				this.dispatchService.register(DH, this.availableLayersChangeEventName, fn);
			};
			
			if( this.selectedLayersChangeEventName ){
				this.dispatchService.register(DH, this.selectedLayersChangeEventName, fn);
			};
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
			.addClass('n2layerSelectionWidget')
			.appendTo($container);
		
		this._availableLayersUpdated();
		
		$n2.log('LayerSelectionWidget', this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},

	_availableLayersUpdated: function(){
		var _this = this;

		var $elem = this._getElem();
		$elem.empty();
		
		var $selector = $('<select>')
			.appendTo($elem)
			.change(function(){
				_this._selectionChanged();
			});

		var allLayersLabel = _loc('All Layers');
		if( this.allLayersLabel ){
			allLayersLabel = _loc(this.allLayersLabel);
		};
		$('<option>')
			.text( allLayersLabel )
			.val(ALL_LAYERS)
			.appendTo($selector);
		
		var currentFound = null;
		for(var i=0,e=this.availableLayers.length; i<e; ++i){
			var layerId = this.availableLayers[i];
			
			var $option = $('<option>')
				.text(layerId)
				.val(layerId)
				.appendTo($selector);
			
			if( layerId === this.lastSelectedLayerId ){
				currentFound = layerId;
			};
			
			if( this.showService ){
				this.showService.printLayerName($option, layerId);
			};
		};
		
		if( currentFound ){
			$selector.val(currentFound);
			//$n2.log('selector => '+currentFound);
		} else {
			$selector.val(ALL_LAYERS);
			//$n2.log('selector => empty');
		};
		
		// Select current
		this._selectionChanged();
	},
	
	// This is called when the selected option within <select> is changed
	_selectionChanged: function(){
		var $elem = this._getElem();
		var $selector = $elem.find('select');
		var val = $selector.val();
		if( ALL_LAYERS === val ){
			var selectedLayerIds = [];
			this.availableLayers.forEach(function(layerId){
				selectedLayerIds.push(layerId);
			});
			
			this.dispatchService.send(DH,{
				type: this.selectedLayersSetEventName
				,value: selectedLayerIds
			});
			
		} else {
			var selectedLayerIds = [];
			selectedLayerIds.push(val);
			
			this.dispatchService.send(DH,{
				type: this.selectedLayersSetEventName
				,value: selectedLayerIds
			});
		};
	},
	
	_selectedLayersUpdated: function(){
		var $elem = this._getElem();
		var $selector = $elem.find('select');
		$selector.val( this.lastSelectedLayerId );
	},

	_handle: function(m, addr, dispatcher){
		var _this = this;

		if( this.availableLayersChangeEventName === m.type ){
			if( m.value ){
				this.availableLayers = m.value;
				
				this._availableLayersUpdated();
			};
			
		} else if( this.selectedLayersChangeEventName === m.type ){
			if( m.value ){
				var selectedMap = {};
				var selectedLayerId = undefined;
				m.value.forEach(function(layerId){
					selectedMap[layerId] = true;
					selectedLayerId = layerId;
				});
				
				// Detect all layers
				var allLayers = true;
				this.availableLayers.forEach(function(layerId){
					if( !selectedMap[layerId] ){
						allLayers = false;
					};
				});
				
				if( allLayers ){
					this.lastSelectedLayerId = ALL_LAYERS;
				} else {
					this.lastSelectedLayerId = selectedLayerId;
				};
				
				this._selectedLayersUpdated();
			};
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'layerSelectionWidget' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'layerSelectionWidget' ){
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
			options.showService = config.directory.showService;
		};
		
		new LayerSelectionWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetLayer = {
	LayerSelectionWidget: LayerSelectionWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
