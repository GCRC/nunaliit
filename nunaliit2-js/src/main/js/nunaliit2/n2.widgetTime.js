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
function numberToPaddedString(d){
	if (d < 10) {
        return '0' + d;
      }
      return '' + d;
};

//--------------------------------------------------------------------------
function formatDate(date, format){
	var acc = [];

	// Is year requested?
	if( format.indexOf('Y') >= 0 ){
		acc.push( date.getUTCFullYear() );
	};
	
	// Is month requested?
	if( format.indexOf('M') >= 0 ){
		if( acc.length > 0 ){
			acc.push( '-' );
		};
		acc.push( numberToPaddedString(date.getUTCMonth() + 1) );
	};
	
	// Is day of month requested?
	if( format.indexOf('D') >= 0 ){
		if( acc.length > 0 ){
			acc.push( '-' );
		};
		acc.push( numberToPaddedString(date.getUTCDate()) );
	};
	
	// Is time requested?
	if( format.indexOf('T') >= 0 ){
		if( acc.length > 0 ){
			acc.push( ' ' );
		};
		acc.push( numberToPaddedString(date.getUTCHours()) );
		acc.push( ':' );
		acc.push( numberToPaddedString(date.getUTCMinutes()) );
	};
	
	return acc.join('');
};
 
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
	
	showRangeSlider: null,
	
	rangeMin: null,
	
	rangeMax: null,
	
	intervalMin: null,
	
	intervalMax: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,sourceModelId: null
			,showRangeSlider: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.sourceModelId = opts.sourceModelId;

		if( typeof opts.showRangeSlider === 'boolean' ){
			this.showRangeSlider = opts.showRangeSlider;
		} else {
			this.showRangeSlider = true;
		};
		
		this.rangeMin = null;
		this.rangeMax = null;
		this.intervalMin = null;
		this.intervalMax = null;
		
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

				if( paramInfo.value ){
					this.rangeMin = paramInfo.value.min;
					this.rangeMax = paramInfo.value.max;
				};
			};
			
			if( sourceModelInfo 
			 && sourceModelInfo.parameters 
			 && sourceModelInfo.parameters.interval ){
				var paramInfo = sourceModelInfo.parameters.interval;
				this.intervalChangeEventName = paramInfo.changeEvent;
				this.intervalGetEventName = paramInfo.getEvent;
				this.intervalSetEventName = paramInfo.setEvent;

				if( paramInfo.value ){
					this.intervalMin = paramInfo.value.min;
					this.intervalMax = paramInfo.value.max;
				};
			};
			
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			if( this.rangeChangeEventName ){
				this.dispatchService.register(DH, this.rangeChangeEventName, fn);
			};
			
			if( this.intervalChangeEventName ){
				this.dispatchService.register(DH, this.intervalChangeEventName, fn);
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
			.addClass('n2timeline')
			.appendTo($container);
		
		this._display();
		
		$n2.log('TimelineWidget', this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_getSlider: function(){
		var _this = this;
		
		var $slider = $('#'+this.elemId).find('.n2timeline_slider');
		if( $slider.length < 1 ){
			// Must recreate
			if( typeof this.rangeMin === 'number' 
			 && typeof this.rangeMax === 'number' 
			 && typeof this.intervalMin === 'number' 
			 && typeof this.intervalMax === 'number' ){
				var $sliderWrapper = $('#'+this.elemId).find('.n2timeline_slider_wrapper');

				$slider = $('<div>')
					.addClass('n2timeline_slider')
					.appendTo($sliderWrapper);

				if( this.showRangeSlider ){
					$slider.slider({
						range: true
						,min: this.rangeMin
						,max: this.rangeMax
						,values: [this.intervalMin, this.intervalMax]
						,slide: function(event, ui){
							_this._barUpdated(ui);
						}
					});
				} else {
					$slider.slider({
						min: this.rangeMin
						,max: this.rangeMax
						,slide: function(event, ui){
							_this._barUpdated(ui);
						}
					});
				};
			};
		};
		return $slider;
	},
	
	_removeSlider: function(){
		$('#'+this.elemId).find('.n2timeline_slider_wrapper').empty();
	},
	
	_display: function(){
		var $elem = this._getElem()
			.empty();
		
		var $container = $('<div>')
			.addClass('n2timeline_container')
			.appendTo($elem);

		$('<div>')
			.addClass('n2timeline_range')
			.appendTo($container);
		
		var $sliderWrapper = $('<div>')
			.addClass('n2timeline_slider_wrapper')
			.appendTo($container);

		$('<div>')
			.addClass('n2timeline_interval')
			.appendTo($container);

		// Create slider
		this._getSlider();

        	this._displayRange();
		this._displayInterval();
	},

	_displayRange: function(){
		var $elem = this._getElem();

		var $topLine = $elem.find('.n2timeline_range')
			.empty();

		if( typeof this.rangeMin === 'number' 
		 && typeof this.rangeMax === 'number' ){
			// Compute range
			var minDate = new Date(this.rangeMin);
			var maxDate = new Date(this.rangeMax);
			
			var minDateStr = formatDate(minDate, 'YMD');
			var maxDateStr = formatDate(maxDate, 'YMD');
	
			// Display
			var textRange = '' + minDateStr + ' / ' + maxDateStr;
			$topLine.text(textRange);
		};
	},

	_displayInterval: function(){
		var $elem = this._getElem();

		var $intervalLine = $elem.find('.n2timeline_interval')
			.empty();

		if( typeof this.intervalMin === 'number' 
		 && typeof this.intervalMax === 'number' ){
			// Compute range
			var minDate = new Date(this.intervalMin);
			var maxDate = new Date(this.intervalMax);
			
			var minDateStr = formatDate(minDate, 'YMD');
			var maxDateStr = formatDate(maxDate, 'YMD');
	
			// Display
			var textRange = '' + minDateStr + ' / ' + maxDateStr;
			$intervalLine.text(textRange);
		};
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
				type: this.intervalSetEventName
				,value: value
			});
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( this.rangeChangeEventName === m.type ){
			if( m.value ){
				this.rangeMin = m.value.min;
				this.rangeMax = m.value.max;
				
				var $slider = this._getSlider();
				$slider.slider({
					min:this.rangeMin
					,max:this.rangeMax
				});

				if( typeof this.intervalMin === 'number' 
				 && typeof this.intervalMax === 'number' ){
					$slider.slider({
						values: [this.intervalMin,this.intervalMax]
					});
				};
				
			} else {
				this.rangeMin = null;
				this.rangeMax = null;
				this._removeSlider();
			};
			
			this._displayRange();
			
		} else if( this.intervalChangeEventName === m.type ){
			if( m.value ){
				this.intervalMin = m.value.min;
				this.intervalMax = m.value.max;

				var $slider = this._getSlider();
				$slider.slider({
					values: [this.intervalMin,this.intervalMax]
				});
				
			} else {
				this.intervalMin = null;
				this.intervalMax = null;
				this._removeSlider();
			};
			
			this._displayInterval();
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
