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

var $luxon;
var _loc = function(str,args) {
	return $n2.loc(str,'nunaliit2',args);
};
var DH = 'n2.widgetTime';

// --------------------------------------------------------------------------
function numberToPaddedString(d){
	if (d < 10) {
        return '0' + d;
      }
      return '' + d;
};

// --------------------------------------------------------------------------
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

// Required library: luxon
if (window.luxon) {
	$luxon = window.luxon;
} else {
	return;
}

// -------------------------------------------------------------------------
/**
 * @class
 * The date range widget provides an interface for selecting a start and
 * end date, which is reported to the dispatcher.
 *
 * The widget can either be used with a source model in the same manner the
 * time line widget can be implemented. If no source model is provided, the 
 * widget can still be used and provide the dispatcher details with the updated
 * date range when changed.
 *
 * @param {object} dispatchService - Dispatch service reference.
 * @param {string} containerId - Unique identifier for the container id
 * @param {string} [sourceModelId] - Unique identifier for the source model id
 * @param {string} [startDate=null] - Initial start date for the widget
 * using the date format 'yyyy-mm-dd'
 * @param {string} [endDate=null] - Initial end date for the widget using
 * the date format 'yyyy-mm-dd'
*/
var DateRangeWidget = $n2.Class({

	dispatchService: null,

	containerId: null,

	sourceModelId: null,

	rangeChangeEventName: null,

	rangeMin: null,

	rangeMax: null,

	intervalChangeEventName: null,

	intervalSetEventName: null,

	intervalMin: null,

	intervalMax: null,

	startDate: null,

	startDatePicker: null,

	endDate: null,

	endDatePicker: null,

	initialize: function(opts_) {
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,sourceModelId: null
			,startDate: null
			,endDate: null
		},opts_);

		var modelInfoRequest, sourceModelInfo, paramInfo, dispatchFn;
		var _this = this;

		this.containerId = opts.containerId;
		this.dispatchService = opts.dispatchService;
		this.sourceModelId = opts.sourceModelId;
		this.startDate = opts.startDate;
		this.endDate = opts.endDate;

		// Set up model listener
		if (this.dispatchService) {
			// Get model info
			modelInfoRequest = {
				type: 'modelGetInfo'
				,modelId: this.sourceModelId
				,modelInfo: null
			};
			this.dispatchService.synchronousCall(DH, modelInfoRequest);
			sourceModelInfo = modelInfoRequest.modelInfo;

			if (sourceModelInfo
				&& sourceModelInfo.parameters
				&& sourceModelInfo.parameters.range) {
				paramInfo = sourceModelInfo.parameters.range;
				this.rangeChangeEventName = paramInfo.changeEvent;

				if (paramInfo.value) {
					this.rangeMin = paramInfo.value.min;
					this.rangeMax = paramInfo.value.max;
				}
			}

			if (sourceModelInfo
				&& sourceModelInfo.parameters
				&& sourceModelInfo.parameters.interval) {
				paramInfo = sourceModelInfo.parameters.interval;
				this.intervalChangeEventName = paramInfo.changeEvent;
				this.intervalSetEventName = paramInfo.setEvent;

				if (paramInfo.value) {
					this.intervalMin = paramInfo.value.min;
					this.intervalMax = paramInfo.value.max;
				}
			}

			dispatchFn = function(m, addr, dispatcher) {
				_this._handle(m, addr, dispatcher);
			};

			if (this.rangeChangeEventName) {
				this.dispatchService.register(DH, this.rangeChangeEventName, dispatchFn);
			}

			if (this.intervalChangeEventName) {
				this.dispatchService.register(DH, this.intervalChangeEventName, dispatchFn);
			}
		}

		if (!this.containerId) {
			throw new Error('containerId must be specified');
		}

		this._display();
	},

	_getWidgetOffset: function() {
		var defaultOffset = {top: 0, left: 0};
		var $widgetBtn = $('.n2widget_date_range')
			.find('.n2widget_date_range_button');
		var offset = $widgetBtn.offset() || defaultOffset;

		// Calculate offset width
		offset.width = $widgetBtn.width();

		return offset;
	},

	_setWidgetWindowPosition: function() {
		var topPadding = 28;
		var rightPadding = 36;
		var $browserHeight = $(window).height();
		var $browserWidth = $(window).width();
		var widgetOffset = this._getWidgetOffset();
		var $widgetWindow = $('.n2widget_date_range_window');
		var windowTop = widgetOffset.top + topPadding;

		if ($browserHeight / 2 < widgetOffset.top) {
			topPadding = -228;
			windowTop = widgetOffset.top + topPadding;
		}

		$widgetWindow.css('top', windowTop);

		if ($browserWidth / 2 < widgetOffset.left) {
			$widgetWindow.css('left', '');
			$widgetWindow.css('right', $browserWidth - widgetOffset.left - widgetOffset.width - rightPadding);

		} else {
			$widgetWindow.css('left', widgetOffset.left);
			$widgetWindow.css('right', '');
		}
	},

	_display: function() {
		var $container, $widgetWindow, $widgetWindowStart, $widgetWindowEnd;
		var $startDateInput, $endDateInput;
		var _this = this;
		var elemId = $n2.getUniqueId();

		$container = $('<div>')
			.attr('id', elemId)
			.addClass('n2widget_date_range')
			.appendTo($('#' + this.containerId));

		$('<div>')
			.addClass('n2widget_date_range_button')
			.attr('title', _loc('Date Range Widget'))
			.text("-- / --")
			.appendTo($container)
			.click(function() {
				_this._setWidgetWindowPosition();
				$('.n2widget_date_range_window')
					.toggleClass('active');
				$('.n2widget_date_range_window_backdrop')
					.toggleClass('active');
			});

		$('<div>')
			.addClass('n2widget_date_range_window_backdrop')
			.appendTo($('body'))
			.click(function() {
				$('.n2widget_date_range_window')
					.toggleClass('active');
				$('.n2widget_date_range_window_backdrop')
					.toggleClass('active');
			});

		$widgetWindow = $('<div>')
			.addClass('n2widget_date_range_window')
			.appendTo($('body'));

		$widgetWindowStart = $('<div>')
			.addClass('n2widget_date_range_start')
			.appendTo($widgetWindow);

		$widgetWindowEnd = $('<div>')
			.addClass('n2widget_date_range_end')
			.appendTo($widgetWindow);

		$('<span>').text(_loc('From') + ': ')
			.appendTo($widgetWindowStart);

		$startDateInput = $('<input>')
			.addClass('start_date')
			.attr('name', 'start_date')
			.attr('type', 'text')
			.attr('autocomplete', 'off')
			.attr('placeholder', _loc('Start Date') + ' yyyy-mm-dd')
			.change(function() {
				_this._startDateRangeUpdated();
			})
			.appendTo($widgetWindowStart);

		this.startDatePicker = $('<div>').datepicker({
			dateFormat: 'yy-mm-dd'
			,gotoCurrent: true
			,changeYear: true
			,constrainInput: false
			,showButtonPanel: true
			,closeText: _loc('Close')
			,onSelect: function() {
				var $startDate = $('.n2widget_date_range_window')
					.find('.start_date');
				_this.startDate = this.value;
				$startDate.val(_this.startDate);
				$startDate.text(_this.startDate);
				_this._startDateRangeUpdated();
			}
		}).appendTo($widgetWindowStart);

		// Update start date input and picker if initially set
		if (this.startDate) {
			$startDateInput.val(this.startDate);
			this.startDatePicker.datepicker('setDate', this.startDate);
		}

		$('<span>').text(_loc('To') + ': ')
			.appendTo($widgetWindowEnd);

		$endDateInput = $('<input>')
			.addClass('end_date')
			.attr('name', 'end_date')
			.attr('type', 'text')
			.attr('autocomplete', 'off')
			.attr('placeholder', _loc('End Date') + ' yyyy-mm-dd')
			.change(function() {
				_this._endDateRangeUpdated();
			})
			.appendTo($widgetWindowEnd);

		this.endDatePicker = $('<div>').datepicker({
			dateFormat: 'yy-mm-dd'
			,gotoCurrent: true
			,changeYear: true
			,constrainInput: false
			,showButtonPanel: true
			,closeText: _loc('Close')
			,onSelect: function() {
				var $endDate = $('.n2widget_date_range_window')
					.find('.end_date');
				_this.endDate = this.value;
				$endDate.val(_this.endDate);
				$endDate.text(_this.endDate);
				_this._endDateRangeUpdated();
			}
		}).appendTo($widgetWindowEnd);

		// Update end date input and picker if initially set
		if (this.endDate) {
			$endDateInput.val(this.endDate);
			this.endDatePicker.datepicker('setDate', this.endDate);
		}

		// Update date range if start and/or end date values are initialize
		if (this.startDate) {
			this._startDateRangeUpdated();
		}
		if (this.endDate) {
			this._endDateRangeUpdated();
		}
	},

	// Handle when start date is updated
	_startDateRangeUpdated: function() {
		var d, value;
		var $startInputDate = $('.n2widget_date_range_window .start_date');
		if ($startInputDate.val()) {
			if (this.startDate !== $startInputDate.val()) {
				d = $luxon.DateTime.fromISO($startInputDate.val());
				if (d.isValid) {
					// if the date input is valid, update the startDate.
					$startInputDate.val(d.toFormat("yyyy-MM-dd"));
					this.startDate = d.toFormat("yyyy-MM-dd");
				} else {
					// if the input is an invalid date string use the
					// previous valid start date.
					if (this.startDate && $startInputDate.val()) {
						$startInputDate.val(this.startDate);
					}
				}
			}
		} else {
			// if the input is an empty string, set startDate value to null.
			this.startDate = null;
		}

		this._checkDateIsInRange();

		this.startDatePicker.datepicker('setDate', this.startDate);

		// Update date range button text
		this._updateDateRangeButtonText();

		// Update widget window position
		this._setWidgetWindowPosition();

		// Update date interval if source model used
		if (this.dispatchService
			&& this.intervalSetEventName) {
			value = new $n2.date.DateInterval({
				startDate: this.startDate
				,endDate: this.endDate
				,min: $luxon.DateTime.fromISO(this.startDate).toMillis()
				,max: $luxon.DateTime.fromISO(this.endDate).toMillis()
				,ongoing: false
			});

			this.dispatchService.send(DH,{
				type: this.intervalSetEventName
				,value: value
			});
		}

		this.dispatchService.synchronousCall(DH, {
			type: 'dateRangeWidgetUpdate'
			,startDate: this.startDate
			,endDate: this.endDate
		});
	},

	// Handle when end date is updated
	_endDateRangeUpdated: function() {
		var d, value;
		var $endInputDate = $('.n2widget_date_range_window .end_date');

		if ($endInputDate.val()) {
			if (this.endDate !== $endInputDate.val()) {
				d = $luxon.DateTime.fromISO($endInputDate.val());
				if (d.isValid) {
					// if the date input is valid, update the endDate.
					$endInputDate.val(d.toFormat("yyyy-MM-dd"));
					this.endDate = d.toFormat("yyyy-MM-dd");
				} else {
					// if the input is an invalid date string use the
					// previous valid end date.
					if (this.endDate) {
						$endInputDate.val(this.endDate);
					}
				}
			}
		} else {
			// if the input is an empty string, set endDate value to null.
			this.endDate = null;
		}

		this._checkDateIsInRange();

		this.endDatePicker.datepicker('setDate', this.endDate);

		// Update date range button text
		this._updateDateRangeButtonText();

		// Update widget window position
		this._setWidgetWindowPosition();

		// Update date interval if source model used
		if (this.dispatchService
			&& this.intervalSetEventName) {
			value = new $n2.date.DateInterval({
				startDate: this.startDate
				,endDate: this.endDate
				,min: $luxon.DateTime.fromISO(this.startDate).toMillis()
				,max: $luxon.DateTime.fromISO(this.endDate).toMillis()
				,ongoing: false
			});

			this.dispatchService.send(DH,{
				type: this.intervalSetEventName
				,value: value
			});
		}

		this.dispatchService.synchronousCall(DH, {
			type: 'dateRangeWidgetUpdate'
			,startDate: this.startDate
			,endDate: this.endDate
		});
	},

	_updateDateRangeButtonText: function() {
		var btn = $('.n2widget_date_range')
			.find('.n2widget_date_range_button');
		var startDate = this.startDate ? this.startDate : '--';
		var endDate = this.endDate ? this.endDate : '--';

		btn.text(startDate + ' / ' + endDate);
	},

	_checkDateIsInRange: function() {
		var startOfDateRange, endOfDateRange;
		var $startInputDate = $('.n2widget_date_range_window .start_date');
		var $endInputDate = $('.n2widget_date_range_window .end_date');
		var startDateMS = $luxon.DateTime.fromISO($startInputDate.val()).toMillis();
		var endDateMS = $luxon.DateTime.fromISO($endInputDate.val()).toMillis();

		// Set start date to range min if input is less than range min.
		if (this.rangeMin
			&& this.rangeMin > startDateMS) {
			startOfDateRange = $luxon.DateTime.fromMillis(this.rangeMin).toFormat("yyyy-MM-dd");
			this.startDate = startOfDateRange;
			$startInputDate.val(startOfDateRange);
		}

		// Set end date to range max if input is more than range max.
		if (this.rangeMax
			&& this.rangeMax < endDateMS) {
			endOfDateRange = $luxon.DateTime.fromMillis(this.rangeMax).toFormat("yyyy-MM-dd");
			this.endDate = endOfDateRange;
			$endInputDate.val(endOfDateRange);
		}

		// Set the end date to null if end date is less than the start date
		if ($startInputDate.val()
			&& $endInputDate.val()
			&& $startInputDate.val() >= $endInputDate.val()) {
			$endInputDate.text('');
			$endInputDate.val(null);
			this.endDate = null;
		}
	},

	_handle: function(msg, addr, dispatcher) {
		var $startInputDate, $endInputDate;
		if (this.rangeChangeEventName === msg.type) {
			if (msg.value) {
				this.rangeMin = msg.value.min;
				this.rangeMax = msg.value.max;
			} else {
				this.rangeMin = null;
				this.rangeMax = null;
			}

		} else if (this.intervalChangeEventName === msg.type) {
			if (msg.value) {
				this.intervalMin = msg.value.min;
				this.startDate = $luxon.DateTime.fromMillis(this.intervalMin).toFormat("yyyy-MM-dd");

				$startInputDate = $('.n2widget_date_range_window .start_date');
				$startInputDate.val(this.startDate);

				this.startDatePicker.datepicker('setDate', this.startDate);

				this.intervalMax = msg.value.max;
				this.endDate = $luxon.DateTime.fromMillis(this.intervalMax).toFormat("yyyy-MM-dd");

				$endInputDate = $('.n2widget_date_range_window .end_date');
				$endInputDate.val(this.endDate);

				this.endDatePicker.datepicker('setDate', this.endDate);

				// Update date range button text
				this._updateDateRangeButtonText();

				// Update widget window position
				this._setWidgetWindowPosition();

				this.dispatchService.synchronousCall(DH, {
					type: 'dateRangeWidgetUpdate'
					,startDate: this.startDate
					,endDate: this.endDate
				});
			}
		}
	}
});

// --------------------------------------------------------------------------
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
			containerId: null
			,dispatchService: null
			,sourceModelId: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.sourceModelId = opts.sourceModelId;
		
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

				$slider.slider({
					range: true
					,min: this.rangeMin
					,max: this.rangeMax
					,values: [this.intervalMin, this.intervalMax]
					,slide: function(event, ui){
						_this._barUpdated(ui);
					}
				});
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

// --------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'dateRange' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		}
    } else if( m.widgetType === 'timeline' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		}
    }
};

// --------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	var widgetOptions, config, optionKeys, containerId, i, key, value;
	var options = {};

	if (m.widgetOptions) {
		widgetOptions = m.widgetOptions;
	}

	if (m.containerId) {
		containerId = m.containerId;
	}

	if (m.config) {
		config = m.config;
	}

	if (m.widgetType === 'dateRange') {
		if (widgetOptions) {
			optionKeys = Object.keys(widgetOptions);

			for (i = 0; i < optionKeys.length; i += 1) {
				key = optionKeys[i];
				value = widgetOptions[key];
				options[key] = value;
			}
		}

		options.containerId = containerId;

		if (config && config.directory) {
			options.dispatchService = config.directory.dispatchService;
			options.showService = config.directory.showService;
		}

		new DateRangeWidget(options);

	} else if (m.widgetType === 'timeline') {
		if (widgetOptions) {
			for (key in widgetOptions) {
				value = widgetOptions[key];
				options[key] = value;
			}
		}

		options.containerId = containerId;
		
		if (config && config.directory) {
			options.dispatchService = config.directory.dispatchService;
		}
		
		new TimelineWidget(options);
    }
}

// --------------------------------------------------------------------------
$n2.widgetTime = {
	DateRangeWidget: DateRangeWidget
	,TimelineWidget: TimelineWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
