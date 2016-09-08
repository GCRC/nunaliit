/*
Copyright (c) 2010,2011 Geomatics and Cartographic Research Centre, Carleton 
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

/*
 * Classes to build sliders with callouts.  Developed from the older
 * olkit_sliderWithCallout implementation.
 * Changes from that earlier work:
 *   - no image callouts (simply text divs for callouts - more flexible and
 *     less fussy concerning the size of the callout text)
 *   - support both single-valued slider and range slider as separate classes.
 *   - labelling the slider is not handled to simplify the classes and generated
 *     HTML - deal with that externally
 *   - dropped explicit option for a callout that does not fade in/out as that
 *     would complicate the range slider.  If you want a fixed div displaying
 *     a slider value ... this is probably overkill.
 */

;(function($,$n2){
"use strict";
	
	$n2.SLIDER_CONSTANTS = {};
	/*
	 * value types supported
	 */
	$n2.SLIDER_CONSTANTS.NUMERIC = 'numeric';
	$n2.SLIDER_CONSTANTS.DATE = 'date';
	
	/*
	 * date step constants
	 */
	$n2.SLIDER_CONSTANTS.DURATION_DAY = 1000 * 60 * 60 * 24;
	$n2.SLIDER_CONSTANTS.DURATION_WEEK = $n2.SLIDER_CONSTANTS.DURATION_DAY * 7;
	$n2.SLIDER_CONSTANTS.DURATION_YEAR = $n2.SLIDER_CONSTANTS.DURATION_DAY * 365;
	
	/*
	 * slider definition constants
	 */
	var SLIDER_MIN = 0;
	var SLIDER_STEP = 1;

	var defaultOptions = {
		containerId: '' // string: id of containing DOM element
		,idBase: '' // string: base for ID strings used in HTML for the slider.
		
		/*
		 * the type of values used by the control domain the slider is associated
		 * with.  See private valueHandler classes.
		 */
		,valueType: $n2.SLIDER_CONSTANTS.NUMERIC
		
		/*
		 * Control domain value specification: these are translated to the integer slider
		 * range needed by jQuery sliders.
		 */
		,min: null /* lowest value returned from slider - scalar */
		,max: null /* highest value returned from slider - scalar */
		,step: null /* slider increments */
		,initial: null /* default/initial value for slider control value - scalar or array - see range */
		
		/*
		 * single-handled or range slider?  See jQuery documentation and note changes
		 * required in the definitions of initial values and update values handled by 
		 * the specified changeFn (range means two-element arrays are used rather than
		 * scalar values).
		 */
		,range: false // string/boolean - see jquery slider documentation
		
		/*
		 * Display options for values.
		 */
		,format: '%d' // default integer formatting
	};

	var numericValueHandler = $n2.Class({
		/*
		 * Expected options:
		 * min: numeric
		 * max: numeric
		 * step: numeric
		 * format: string
		 */
		options: null // defaults handled by container class.
		
		,initialize: function(opt) { /* all parms numeric, real, NOT necessarily integer */
			this.options = $.extend({}, opt);
		}
	
		,convertSliderValueToDomain: function(v) { //@param v integer slider value
			return(this.options.min + ((v - SLIDER_MIN) * this.options.step));
		}
		
		,convertDomainValueToSlider: function(v) { // @param v numeric domain value - not necessarily integer
			return(Math.floor((v - this.options.min) / this.options.step));
		}
		
		,toString: function(value) {
			var target = this.options.format.slice(0);
			return($.format(target, [ value ])); // pass array so 0 is not rejected - slightly stunned code in plugin
		}
		
		,domainMaxToSliderMax: function(v) { // @param v numeric domain max - not necessarily int
			return(this.convertDomainValueToSlider(v));
		}

		,equals: function(v1, v2) {
			return(v1 == v2);
		}
		
	});
	
	var dateValueHandler = $n2.Class({
		/*
		 * Expected options:
		 * min: date object
		 * max: date object
		 * step: milliseconds increments
		 * format: string
		 * 
		 * Note: uses jquery datepicker to format the date for output to callout.
		 */
		options: null // defaults handled by container class.
	
		,initialize: function(opt) { /* all parms numeric, real, NOT necessarily integer */
			this.options = $.extend({}, opt);
		}

		,convertSliderValueToDomain: function(v) { //@param v integer slider value
			var newDate = new Date(this.options.min);
			var diff = (v - SLIDER_MIN) * this.options.step;
			newDate.setMilliseconds(newDate.getMilliseconds() + diff);
			return newDate;
		}
	
		,convertDomainValueToSlider: function(v) { // @param v numeric domain value - not necessarily integer
			return(Math.floor((v - this.options.min) / this.options.step));
		}
	
		,toString: function(value) {
			var target = this.options.format.slice(0);
			return($.datepicker.formatDate(target, value));
		}
	
		,domainMaxToSliderMax: function(v) { // @param v numeric domain max - not necessarily int
			return(this.convertDomainValueToSlider(v));
		}
		
		,equals: function(v1, v2) {
			return(v1.valueOf() == v2.valueOf());
		}
		
	});
	
	var sliderBase = $n2.Class({
		/*
		 * sliderBase - responsibilities:
		 * - construct the HTML
		 * - create slider object
		 * - deal with callout positioning computations and callout text updating.
		 * 
		 * Note that a single callout is managed for both the single-handle and range slider cases
		 * because only one handle is moved at any given time anyway.  
		 */
		options: null

		,configuredValue: null
		
		,valueHandler: null
		
		,computedSliderProperties: null
	
		,initialize: function(/* ... variable argument list ... */) { // duplicates? - rightmost take precedence
			this.options = $.extend({}, defaultOptions);
			for (var i=0; i < arguments.length; i++) { // update o with properties from objects in variable arg list.
				var o = arguments[i];
				if ($n2.isDefined(o)) {
					this.options = $.extend(true, this.options, o);
				};
			};
			
			if ($n2.SLIDER_CONSTANTS.DATE == this.options.valueType) {
				this.valueHandler = new dateValueHandler({
					min: this.options.min
					,max: this.options.max
					,step: this.options.step
					,format: this.options.format
				});
			} else { // make numeric the default
				this.valueHandler = new numericValueHandler({
					min: this.options.min
					,max: this.options.max
					,step: this.options.step
					,format: this.options.format
				});
			};
			
			var prop = {}; /* jQuery slider parameters */
			prop.min = SLIDER_MIN; /* always use zero-based */
			prop.step = SLIDER_STEP; /* always step size one - translate in/out */
			prop.max = this.valueHandler.domainMaxToSliderMax(this.options.max);
			this.computedSliderProperties = prop;
		}
	
		,changeFn: function() {} // function to notify app of changed control value - changeFn(newValue)

		,latestValue: function() {
			return($n2.isDefined(this.configuredValue) ? this.configuredValue : this.options.initial);
		}
		
		/*
		 * callout management: positioning, fading/hiding, text updating and centering
		 */
		,_computeCallOutLeftValue: function(newVal) { // based on slider values - not domain values - then independent of domains data type
			var percentage =
				(newVal - this.computedSliderProperties.min) / 
				(this.computedSliderProperties.max - this.computedSliderProperties.min) * 100;
//			$n2.log('computeCallOutLeftValue - returning: '+percentage);
			return(percentage);
		}
		
		,_setText: function(t1, t2, value) {
			var t = this.valueHandler.toString(value);
			var l = Math.floor(t.length / 2);
			var a = new Array();
			var tt;
			if (l > 0) {
				tt = t.slice(0,l);
				
				// handle string segment terminated by space ... replace with &nbsp; so not ignored
				var lastCharIndex = tt.length-1;
				if (tt[lastCharIndex] == ' ') {
					tt = tt.slice(0, -1) + '&nbsp;';
				};
				
				a.push(tt);
			} else {
				a.push('');
			};

			if ((t.length - l) > 0) {
				tt = t.slice(l);
				
				// handle string segment beginning with space ... replace with &nbsp; so not ignored
				if (tt[0] == ' ') {
					tt = '&nbsp;' + tt.slice(1);
				}
				
				a.push(tt);
			} else {
				a.push('');
			};

			$(t1).text(a[0]);
			$(t2).text(a[1]);
		}

		,_callout_hideImmed: function(t1, t2) {
			$(t1).hide();
			$(t2).hide();
		}

		,_callout_fadeIn: function(t1, t2) {
			$(t1).fadeIn('fast', function(){});
			$(t2).fadeIn('fast', function(){});
		}

		,_callout_fadeOut: function(t1, t2, fn) {
			$(t1).fadeOut('slow', function() {});
			$(t2).fadeOut('slow', fn);
		}

		/**
		 * slider building routines
		 * @return slider jquery DOM object
		 * 
		 * Notes:
		 * - slider is a styled DIV - manage that with CSS
		 * - id + '_callout" is the call-out DIV used to position the value text during updates
		 * - the call-out DIV contains two text DIVs that contain the value text split into two
		 *   as a rough means of centering.
		 */
		,_createHtml: function() {
			var container = $('#' + this.options.containerId).empty();
			var slider = $('<div>')
				.addClass('slider_wrapper slider_wrapper_callout')
				.appendTo(container);
			var sliderCallout = $('<div>')
				.attr('id',this.options.idBase + '_callout')
				.addClass('slider_callout')
				.attr('style','width:0px;height:0px;padding:0px;margin:0px;border:none')
				.appendTo(slider);
			$('<div>')
				.attr('id',this.options.idBase)
				.addClass('slider_bar')
				.appendTo(slider);
			/*
			 * Some browsers (e.g., Safari) may break a text element at a dash/minus sign unless a large enough
			 * width is specified.  If needed, add a width element to the CSS tied to the slider IDs assigned below.
			 * The elements below properly left or right align things so specifying the width is hopefully all that
			 * is required.
			 */
			$('<div>')
				.attr('id',this.options.idBase + '_calloutTextLeft')
				.addClass('slider_callout_text_left')
				.attr('style','position:absolute;right:0px;bottom:0px;text-align:right;')
				.appendTo(sliderCallout);
			$('<div>')
				.attr('id',this.options.idBase + '_calloutTextRight')
				.addClass('slider_callout_text_right')
				.attr('style','position:absolute;left:0px;bottom:0px;text-align:left;')
				.appendTo(sliderCallout);
			return slider;
		}
		
		,create: function() {
			var _self = this;

			var slider = this._createHtml();
			var c = '#' + this.options.idBase + '_callout'; // callout ID
			var t1 = '#' + this.options.idBase + '_calloutTextLeft';
			var t2 = '#' + this.options.idBase + '_calloutTextRight';

			var calloutVisible = false;
			this._callout_hideImmed(t1, t2);

			var sliderOpts = {
					min: this.computedSliderProperties.min
					,max: this.computedSliderProperties.max
					,step: this.computedSliderProperties.step
					,start: function(e, ui) {
						var i = _self._positionCalloutForUpdate(c, ui);
						if (i >= 0) { /* one of handles changed */
							calloutVisible = true;
							_self._callout_fadeIn(t1, t2);
						};
					}
					,slide  : function(e, ui) {
						var i = _self._positionCalloutUpdateText(c, t1, t2, ui);
						if (false == calloutVisible && i >= 0) { /* callout not yet visibe and a handle changed */
							calloutVisible = true;
							_self._callout_fadeIn(t1, t2);							
						}
						_self._storeUpdateAndNotify(ui);
					}
					,change : function (e, ui) { // fired at end of slide or when changed programmatically
						var i = _self._positionCalloutUpdateText(c, t1, t2, ui);
						if (false == calloutVisible && i >= 0) { // if programmed change
							calloutVisible = true;
							_self._callout_fadeIn(t1, t2);
						};
						if (true == calloutVisible) {
							_self._callout_fadeOut(t1, t2, function() { calloutVisible = false; });							
						}
						_self._storeUpdateAndNotify(ui);	
					}
			};
			
			if (false == this.options.range) {
				/* note use of value - ensure appropriate derived class handling this....  single-handled ... */
				sliderOpts.value = this.valueHandler.convertDomainValueToSlider(this.latestValue());
			} else if ('min' == this.options.range || 'max' == this.options.range) {
				/* note use of value - ensure appropriate derived class handling this....  single-handled ... */
				sliderOpts.range = this.options.range;
				sliderOpts.value = this.valueHandler.convertDomainValueToSlider(this.latestValue());
			} else if (true == this.options.range) {
				/* note use of values (PLURAL) - ensure appropriate derived class handling this....  DOUBLE-HANDLED ... */
				sliderOpts.range = true;
				var l = this.latestValue();
				sliderOpts.values = [
					this.valueHandler.convertDomainValueToSlider(l[0]),
					this.valueHandler.convertDomainValueToSlider(l[1])
				];
			};
			
			$('#' + this.options.idBase).slider(sliderOpts);
		}

	});

	$n2.SingleHandleSliderWithCallout = $n2.Class(sliderBase, {

		setConfiguredValue: function(newValue) { // @param: domain value - not necessarily integer
			this.configuredValue = newValue; // stored as is - same range of values as this.options.initialValue
		}

		,getCurrentValue: function() {
			return(this.latestValue());
		}
		
		,programmedUpdate: function(newValue) {
			this.setConfiguredValue(newValue);
			$('#' + this.options.idBase).slider('value', this.valueHandler.convertDomainValueToSlider(this.latestValue()));
		}
		
		,_positionCalloutForUpdate: function(c, ui) {
			$(c).css('left', this._computeCallOutLeftValue(ui.value) + '%');	
			return 0; /* always index 0 with one handle */
		}
		
		,_positionCalloutUpdateText: function(c, t1, t2, ui) { // for range slider this needs to be smarter - which handle? - which value?
			this._positionCalloutForUpdate(c, ui);
			this._setText(t1, t2, this.valueHandler.convertSliderValueToDomain(ui.value));
			return 0; /* always index 0 with one handle */
		}
		
		,_storeUpdateAndNotify: function(ui) {
			var newValue = this.valueHandler.convertSliderValueToDomain(ui.value);
			if (newValue != this.configuredValue) {
				this.configuredValue = newValue;
				this.options.changeFn(newValue); // notify application in domain values
			};
			
		}
		
	});

	$n2.RangeSliderWithCallout = $n2.Class(sliderBase, {

		setConfiguredValue: function(newValues) { // @param: aray contain lower, upper domain values - not necessarily integer
			this.configuredValue = newValues; // stored as is - same range of values as this.options.initialValue
		}

		,getCurrentValue: function() {
			return(this.latestValue());
		}
		
		,programmedUpdate: function(newValues) {
			this.setConfiguredValue(newValues);
			var lower = this.valueHandler.convertDomainValueToSlider(newValues[0]);
			var upper = this.valueHandler.convertDomainValueToSlider(newValues[1]);
			$('#' + this.options.idBase).slider('values', [ lower, upper ]);
		}
		
		,_whichIsChanging: function(ui) {
			/*
			 * check if lower handle value has changed - if not, must be upper handle changing.
			 */
			var old = this.latestValue();
			var convertedUi = [
				this.valueHandler.convertSliderValueToDomain(ui.values[0]),
				this.valueHandler.convertSliderValueToDomain(ui.values[1])
			];
			if (this.valueHandler.equals(old[0], convertedUi[0]) && 
				this.valueHandler.equals(old[1], convertedUi[1])) { // no change..
				return -1;
			};
			return(this.valueHandler.equals(old[0], convertedUi[0]) ? 1 : 0);
		}
		
		,_positionCalloutForUpdate: function(c, ui) {
			var index = this._whichIsChanging(ui);
			if (index >= 0) { /* only update position if one handle has moved. */
				$(c).css('left', this._computeCallOutLeftValue(ui.values[index]) + '%');				
			};
			return index;
		}
		
		,_positionCalloutUpdateText: function(c, t1, t2, ui) {
			var index = this._positionCalloutForUpdate(c, ui);
			if (index >= 0) { /* only update text if one handle has moved. */
				this._setText(t1, t2, this.valueHandler.convertSliderValueToDomain(ui.values[index]));				
			};
			return index;
		}
		
		,_storeUpdateAndNotify: function(ui) {
			var newValues = [
				this.valueHandler.convertSliderValueToDomain(ui.values[0]),
				this.valueHandler.convertSliderValueToDomain(ui.values[1])
			];
			if (! isDefined(this.configuredValue) ||
				! this.valueHandler.equals(newValues[0], this.configuredValue[0]) ||
				! this.valueHandler.equals(newValues[1], this.configuredValue[1])) {
				this.configuredValue = newValues;
				this.options.changeFn(newValues); // notify application in domain values
			};	
		}
		
	});

})(jQuery,nunaliit2);