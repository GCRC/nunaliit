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

	// Define Dispatcher Handle
	var DH = 'n2.widgetDateRange';

	// -------------------------------------------------------------------------
	var DateRangeWidget = $n2.Class({

		dispatchService: null,

		authService: null,

		showAsLink: null,

		containerId: null,

		elemId: null,

		startDate: null,

		endDate: null,

		initialize: function(opts_) {
			var opts = $n2.extend({
				containerId: null
				,dispatchService: null
				,authService: null
				,showAsLink: false
				,startDate: null
				,endDate: null
			},opts_);

			this.containerId = opts.containerId;
			this.dispatchService = opts.dispatchService;
			this.startDate = opts.startDate;
			this.endDate = opts.endDate;

			if (!this.containerId) {
				throw new Error('containerId must be specified');
			}

			this._display();
		},

		_updateDateRangeButtonText: function() {
			var btn = $('.n2widget_date_range .n2widget_date_range_button');
			var startDate = this.startDate ? this.startDate : '--';
			var endDate = this.endDate ? this.endDate : '--';

			btn.text(startDate + ' / ' + endDate);
		},

		_display: function() {
			var $container, $widgetWindow, $widgetWindowStart, $widgetWindowEnd;
			var _this = this;
			var containerId = this.containerId;

			this.elemId = $n2.getUniqueId();

			$container = $('<div>')
				.attr('id', this.elemId)
				.addClass('n2widget_date_range')
				.appendTo($('#' + containerId));

			$('<div>')
				.addClass('n2widget_date_range_button')
				.text("-- / --")
				.appendTo($container)
				.click(function() {
					$('.n2widget_date_range_window')
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

			$('<input>')
				.attr('id', 'start_date')
				.attr('name', 'start_date')
				.attr('type', 'text')
				.attr('autocomplete', 'off')
				.attr('placeholder', 'Start Date yy-mm-dd')
				.appendTo($widgetWindowStart);

			$('<div>').datepicker({
				dateFormat: 'yy-mm-dd'
				,gotoCurrent: true
				,changeYear: true
				,constrainInput: false
				,onSelect: function() {
					var $startDate = $('#start_date');
					_this.startDate = this.value;
					$startDate.val(_this.startDate);
					$startDate.text(_this.startDate);
					_this._dateRangeUpdated();
				}
			}).appendTo($widgetWindowStart);

			$('<input>')
				.attr('id', 'end_date')
				.attr('name', 'end_date')
				.attr('type', 'text')
				.attr('autocomplete', 'off')
				.attr('placeholder', 'End Date yy-mm-dd')
				.appendTo($widgetWindowEnd);

			$('<div>').datepicker({
				dateFormat: 'yy-mm-dd'
				,gotoCurrent: true
				,changeYear: true
				,constrainInput: false
				,onSelect: function() {
					var $endDate = $('#end_date');
					_this.endDate = this.value;
					$endDate.val(_this.endDate);
					$endDate.text(_this.endDate);
					_this._dateRangeUpdated();
				}
			}).appendTo($widgetWindowEnd);
		},

		_dateRangeUpdated: function() {
			var _this = this;
			var $startDate = $('#start_date');
			var $endDate = $('#end_date');
			var startDateVal = $startDate.val();
			var endDateVal = $endDate.val();

			// Set the end date to null if end date is less than the start date
			if (startDateVal
				&& endDateVal
				&& startDateVal >= endDateVal) {
				$endDate.text('');
				$endDate.val(null);
				_this.endDate = null;
			}

			this._updateDateRangeButtonText();

			this.dispatchService.send(DH, {
				type: 'yearWidgetUpdate'
				,startDate: _this.startDate
				,endDate: _this.endDate
			});
		}
	});

	// -------------------------------------------------------------------------
	function HandleWidgetAvailableRequests(m) {
		if (m.widgetType === 'dateRangeWidget') {
			if ($.fn.slider) {
				m.isAvailable = true;
			}
		}
	}

	// -------------------------------------------------------------------------
	function HandleWidgetDisplayRequests(m) {
		var widgetOptions, containerId, config, options, key, value, i;
		var optionKeys = Object.keys(widgetOptions);

		if (m.widgetType === 'dateRangeWidget') {
			widgetOptions = m.widgetOptions;
			containerId = m.containerId;
			config = m.config;
			options = {};

			for (i = 0; i < optionKeys.length; i += 1) {
				key = optionKeys[i];
				value = widgetOptions[key];
				options[key] = value;
			}

			options.containerId = containerId;

			if (config && config.directory) {
				options.dispatchService = config.directory.dispatchService;
				options.showService = config.directory.showService;
			}

			new DateRangeWidget(options);
		}
	}

	$n2.widgetDateRange = {
		DateRangeWidget: DateRangeWidget,
		HandleWidgetAvailableRequests: HandleWidgetAvailableRequests,
		HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
	};

})(jQuery,nunaliit2);
