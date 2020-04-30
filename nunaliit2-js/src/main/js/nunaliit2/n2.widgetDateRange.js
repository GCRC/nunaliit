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

	var $l;

	// Localization
	var _loc = function(str,args) {
		return $n2.loc(str,'nunaliit2-couch',args);
	};

	// Define Dispatcher Handle
	var DH = 'n2.widgetDateRange';

	// Required library: luxon
	if (window.luxon) {
		$l = window.luxon;
	} else {
		return;
	}

	// -------------------------------------------------------------------------
	/**
	 * @class
	 * The date range widget provides an interface for selecting a start and
	 * end date, which is reported to the dispatcher.
	 *
	 * @param {object} dispatchService - Dispatch service reference.
	 * @param {string} containerId - Unique identifier for the container id
	 * @param {string} [startDate=null] - Initial start date for the widget
	 * using the date format 'yyyy-mm-dd'
	 * @param {string} [endDate=null] - Initial end date for the widget using
	 * the date format 'yyyy-mm-dd'
	*/
	var DateRangeWidget = $n2.Class({

		dispatchService: null,

		containerId: null,

		startDate: null,

		startDatePicker: null,

		endDate: null,

		endDatePicker: null,

		initialize: function(opts_) {
			var opts = $n2.extend({
				containerId: null
				,dispatchService: null
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
			var btn = $('.n2widget_date_range')
				.find('.n2widget_date_range_button');
			var startDate = this.startDate ? this.startDate : '--';
			var endDate = this.endDate ? this.endDate : '--';

			btn.text(startDate + ' / ' + endDate);
		},

		_getWidgetOffset: function() {
			var $widgetBtn = $('.n2widget_date_range')
				.find('.n2widget_date_range_button');
			var offset = $widgetBtn.offset();

			if (offset) {
				return offset;
			}
		},

		_setWidgetWindowPosition: function() {
			var topPadding = 28;
			var leftPadding = 465;
			var $browserHeight = $(window).height();
			var $browserWidth = $(window).width();
			var widgetOffset = this._getWidgetOffset();
			var $widgetWindow = $('.n2widget_date_range_window');
			var windowTop = widgetOffset.top + topPadding;
			var windowLeft = widgetOffset.left;

			if ($browserHeight / 2 < widgetOffset.top) {
				topPadding = -228;
				windowTop = widgetOffset.top + topPadding;
			}

			if ($browserWidth / 2 < widgetOffset.left) {
				windowLeft = widgetOffset.left - leftPadding;
			}

			$widgetWindow.css('top', windowTop);
			$widgetWindow.css('left', windowLeft);
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
				.attr('placeholder', _loc('Start Date') + ' yy-mm-dd')
				.change(function() {
					_this._startDateRangeUpdated();
				})
				.appendTo($widgetWindowStart);

			this.startDatePicker = $('<div>').datepicker({
				dateFormat: 'yy-mm-dd'
				,gotoCurrent: true
				,changeYear: true
				,constrainInput: false
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
				.attr('placeholder', _loc('End Date') + ' yy-mm-dd')
				.change(function() {
					_this._endDateRangeUpdated();
				})
				.appendTo($widgetWindowEnd);

			this.endDatePicker = $('<div>').datepicker({
				dateFormat: 'yy-mm-dd'
				,gotoCurrent: true
				,changeYear: true
				,constrainInput: false
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

			// Update date range if start or end date values are initialize
			if (this.startDate) {
				this._startDateRangeUpdated();
			}

			if (this.endDate) {
				this._endDateRangeUpdated();
			}
		},

		_startDateRangeUpdated: function() {
			var d;
			var $startInputDate = $('.n2widget_date_range_window .start_date');
			var $endInputDate = $('.n2widget_date_range_window .end_date');

			if ($startInputDate.val()) {
				if (this.startDate !== $startInputDate.val()) {
					d = $l.DateTime.fromString($startInputDate.val(), 'yyyy-MM-dd');
					if (d.isValid) {
						// if the date input is valid, update the startDate.
						this.startDate = $startInputDate.val();
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

			// Set the end date to null if end date is less than the start date
			if ($startInputDate.val()
				&& $endInputDate.val()
				&& $startInputDate.val() >= $endInputDate.val()) {
				$endInputDate.text('');
				$endInputDate.val(null);
				this.endDate = null;
			}

			this.startDatePicker.datepicker('setDate', this.startDate);

			// Update date range button text
			this._updateDateRangeButtonText();

			// Update widget window position
			this._setWidgetWindowPosition();

			this.dispatchService.synchronousCall(DH, {
				type: 'dateRangeWidgetUpdate'
				,startDate: this.startDate
				,endDate: this.endDate
			});
		},

		_endDateRangeUpdated: function() {
			var d;
			var $startInputDate = $('.n2widget_date_range_window .start_date');
			var $endInputDate = $('.n2widget_date_range_window .end_date');

			if ($endInputDate.val()) {
				if (this.endDate !== $endInputDate.val()) {
					d = $l.DateTime.fromString($endInputDate.val(), 'yyyy-MM-dd');
					if (d.isValid) {
						// if the date input is valid, update the endDate.
						this.endDate = $endInputDate.val();
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

			// Set the end date to null if end date is less than the start date
			if ($startInputDate.val()
				&& $endInputDate.val()
				&& $startInputDate.val() >= $endInputDate.val()) {
				$endInputDate.text('');
				$endInputDate.val(null);
				this.endDate = null;
			}

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
		var optionKeys;

		if (m.widgetType === 'dateRangeWidget') {
			widgetOptions = m.widgetOptions;
			containerId = m.containerId;
			config = m.config;
			options = {};

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
		}
	}

	$n2.widgetDateRange = {
		DateRangeWidget: DateRangeWidget,
		HandleWidgetAvailableRequests: HandleWidgetAvailableRequests,
		HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
	};

})(jQuery,nunaliit2);
