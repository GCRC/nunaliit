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
 ,DH = 'n2.widgetTime'
 ;
 
//--------------------------------------------------------------------------
var TimelineWidget = $n2.Class({
	
	dispatchService: null,
	
	sourceModelId: null,
	
	elemId: null,

	rangeChangeEventName: null,

	rangeGetEventName: null,

	rangeSetEventName: null,

	intervalChangeEventName: null,

	intervalGetEventName: null,

	intervalSetEventName: null,
	
	rangeMin: null,
	
	rangeMax: null,
	
	intervalMin: null,
	
	intervalMax: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			contentId: null
			,containerId: null
			,dispatchService: null
			,sourceModelId: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.sourceModelId = opts.sourceModelId;
		
		this.rangeMin = 0;
		this.rangeMax = 100;
		this.intervalMin = 0;
		this.intervalMax = 100;
		
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
			 && sourceModelInfo.parameters.range ){
				var paramInfo = sourceModelInfo.parameters.range;
				this.rangeChangeEventName = paramInfo.changeEvent;
				this.rangeGetEventName = paramInfo.getEvent;
				this.rangeSetEventName = paramInfo.setEvent;
				this.rangeMin = paramInfo.value.min;
				this.rangeMax = paramInfo.value.max;
			};
			
			if( sourceModelInfo 
			 && sourceModelInfo.parameters 
			 && sourceModelInfo.parameters.interval ){
				var paramInfo = sourceModelInfo.parameters.interval;
				this.intervalChangeEventName = paramInfo.changeEvent;
				this.intervalGetEventName = paramInfo.getEvent;
				this.intervalSetEventName = paramInfo.setEvent;
				this.intervalMin = paramInfo.value.min;
				this.intervalMax = paramInfo.value.max;
			};
			
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			if( this.rangeSetEventName ){
				this.dispatchService.register(DH, this.rangeSetEventName, fn);
			};
			
			if( this.intervalSetEventName ){
				this.dispatchService.register(DH, this.intervalSetEventName, fn);
			};
		};

		// Get container
		var containerId = opts.containerId;
		if( !containerId ){
			containerId = opts.contentId;
		};
		var $container = $('#'+containerId);
		
		this.elemId = $n2.getUniqueId();
		
		$('<div>')
			.attr('id',this.elemId)
			.addClass('n2timeline')
			.appendTo($container);
		
		this._display();
		
		$n2.log('TimelineWidget', this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_getSlider: function(){
		return $('#'+this.elemId).find('.n2timeline_slider');
	},
	
	_display: function(){
		var _this = this;
		
		var $elem = this._getElem()
			.empty();
		
		var $sliderWrapper = $('<div>')
			.addClass('n2timeline_slider_wrapper')
			.appendTo($elem);

		var $slider = $('<div>')
			.addClass('n2timeline_slider')
			.appendTo($sliderWrapper);
		
		$slider.slider({
			range: true
			,min: this.rangeMin
			,max: this.rangeMax
			,values: [this.intervalMin, this.intervalMax]
			,slide: function(event, ui){
				_this._barUpdated(ui);
			}
		});
	},
	
	_barUpdated: function(ui){
		var min = ui.values[0];
		var max = ui.values[1];
		
		//$n2.log('timeline min:'+min+' max:'+max);
		
		if( this.dispatchService ){
			var value = new $n2.date.DateInterval({
				min: min
				,max: max
				,ongoing: false
			});
			
			this.dispatchService.send(DH,{
				type: this.intervalChangeEventName
				,value: value
			});
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( this.rangeSetEventName === m.type ){
			if( m.value ){
				var $slider = this._getSlider();
				$slider.slider({
					min:m.value.min
					,max:m.value.max
				});
			};
			
		} else if( this.intervalSetEventName === m.type ){
			if( m.value ){
				var $slider = this._getSlider();
				$slider.slider({
					values: [m.value.min,m.value.max]
				});
			};
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'timeline' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'timeline' ){
		var widgetOptions = m.widgetOptions;
		var contentId = m.contentId;
		var containerId = m.containerId;
		var config = m.config;
		
		var options = {
			contentId: contentId
			,containerId: containerId
		};
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
		};
		
		if( widgetOptions ){
			if( widgetOptions.sourceModelId ) options.sourceModelId = widgetOptions.sourceModelId;
		};
		
		new TimelineWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetTime = {
	TimelineWidget: TimelineWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
