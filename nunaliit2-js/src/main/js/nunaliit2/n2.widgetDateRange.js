/*
 * Name: n2.widgetDateRange.js
 * ----------------------------------------------------------------------------
 * Description:
 * ----------------------------------------------------------------------------
 */

;(function($,$n2) {
	"use strict";

	// Localization
	var _loc = function(str,args) {
		return $n2.loc(str,'nunaliit2-couch',args);
	};

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

		initialize: function(opts_){
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
			var $container, $startDate, $endDate, $btn;
			var $widgetWindow, $widgetWindowStart, $widgetWindowEnd;
			var _this = this;
			var containerId = this.containerId;

			this.elemId = $n2.getUniqueId();

			$container = $('<div>')
				.attr('id', this.elemId)
				.addClass('n2widget_date_range')
				.appendTo($('#' + containerId));

			$btn = $('<div>')
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

			$startDate = $('<input>')
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

			$endDate = $('<input>')
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
		if (m.widgetType === 'dateRangeWidget') {
			var widgetOptions = m.widgetOptions;
			var containerId = m.containerId;
			var config = m.config;

			var options = {};

			if (widgetOptions) {
				for (var key in widgetOptions) {
					var value = widgetOptions[key];
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
