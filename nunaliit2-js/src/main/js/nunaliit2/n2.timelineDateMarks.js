/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
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
 * Class to decorate a div background with date marks appropriate to 
 * a timeline.  Horizontal scaling is handled here by absolutely positioning
 * divs using "left:x%" CSS.
 * 
 * Could be used with a n2.sliderWithCallout because the horizontal scaling
 * is computed to be compatible but could also be used with other elements.
 * 
 */

;(function($,$n2){
"use strict";

	var DAY_MS = 1000 * 60 * 60 * 24; // in milliseconds
	$n2.TIMELINE_DATE_MARKS_Durations_DAY = DAY_MS;
	$n2.TIMELINE_DATE_MARKS_Durations_WEEK = DAY_MS * 7;
	$n2.TIMELINE_DATE_MARKS_Durations_YEAR = DAY_MS * 365;
	
	var defaultOptions = {
			containerId: '' // string: id of containing DOM element
			,idBase: '' // string: base for ID strings used in HTML for the slider.
			
			/*
			 * Date range specification.
			 */
			,min: null /* lowest date - scalar */
			,max: null /* highest  - scalar */
			
			/*
			 * incremental marks: multiples of base to get approximately 'steps' increments
			 */
			,base: $n2.TIMELINE_DATE_MARKS_Durations_WEEK
			,steps: null /* increment base between marks (last may be shorter and marks be multiples) */
			
			/*
			 * Display options for values.
			 */
			,format: 'M d' // default date formatting: MMM d
		};
	
	function range(min, max) { // date range in days
		return(Math.floor((max - min) / DAY_MS));
	};
	
	var debugDateFormat = 'yy-mm-dd';
	function dateAsString(f, d) {
		var target = f.slice(0);
		return($.datepicker.formatDate(target, d));
	};
	
	/**
	 * @param min Date
	 * @param max Date
	 * @param base Date duration in milliseconds
	 * @param steps integer number of steps to try to mark on timeline
	 */
	function computeDatesArray(min, max, base, steps) {
		function pkg(d, l) {
			return {date: d, labelled: l };
		};
		
		var days = range(min, max);
		
		if (0 >= steps) {
			$n2.log('$n2.TimelineDateMarks: invalid steps value: ' + steps);
		};
		if (0 >= base) {
			$n2.log('$n2.TimelineDateMarks: invalid base value: ' + base);
		};
		if (0 >= days) { // min >= max?
			$n2.log('$n2.TimelineDateMarks: invalid date range: ' +
					dateAsString(debugDateFormat, min) + ' : ' +
					dateAsString(debugDateFormat, max));
		};
		var baseUnits = Math.floor((days * DAY_MS) / base);
		var multiples = Math.floor(baseUnits / steps);
		var inc, labelInc;
		if (multiples < 1) {
			inc = base;
			labelInc = 1;
			if (baseUnits < 1) {
				inc = DAY_MS; // revert to days in this case
				labelInc = Math.floor(days / steps);
			}
		} else {
			inc = base;
			labelInc = multiples;
		}
		
		var dates = [];
		dates.push(pkg(new Date(min), true));
		var tempDate = new Date(min);
		var dec = labelInc;
		while (tempDate < max) {
			tempDate.setMilliseconds(tempDate.getMilliseconds() + inc);
			if (tempDate < max) {
				var label = false; // assume not labelling this one.
				if (--dec == 0) {
					if (labelInc <= 1) { // from above - label every tick
						label = true;
					} else {
						/*
						 * not labelling all - label this one?  Don't if this would leave two labels at the 
						 * end of the range too close together...
						 * 
						 * The minimum check should be 'labelInc times duration of a tick' but to allow a 
						 * labelled tick to encroach on the end range a bit it is adjusted to about 3/4 of
						 * that.
						 */
						var adjustedCheck = Math.floor(0.75 * labelInc);
						if ((max - tempDate) >= (adjustedCheck * inc)) {
							label = true;
						}
					}
				};
				
				if (label) {
					dates.push(pkg(new Date(tempDate), true));
				} else {
					dates.push(pkg(new Date(tempDate), false));
				}
				if (dec <= 0) {
					dec = labelInc;
				}
			} else {
				dates.push(pkg(new Date(max), true));
			};
		};
		return dates;
	};
	
	/**
	 * @param d date to be positioned proportionally along the div
	 * @param min minimum date for range
	 * @param max maximum date for range
	 * @return CSS left value computed as a percentage
	 */
	function computeLeftValue(d, min, max) { 
		var percentage = (d - min) / (max - min) * 100;
//		$n2.log('computeLeftValue - returning: '+percentage);
		return(percentage);
	}

	/**
	 * @param txt text string
	 * @return array containing the original string split into two (approximate) halves
	 */
	function splitText(txt) {
		var l = Math.floor(txt.length / 2);
		var a = new Array();
		var tt;
		if (l > 0) {
			tt = txt.slice(0,l);
			
			// handle string segment terminated by space ... replace with &nbsp; so not ignored
			var lastCharIndex = tt.length-1;
			if (tt[lastCharIndex] == ' ') {
				tt = tt.slice(0, -1) + '&nbsp;';
			};
			
			a.push(tt);
		} else {
			a.push('');
		};

		if ((txt.length - l) > 0) {
			tt = txt.slice(l);
			
			// handle string segment beginning with space ... replace with &nbsp; so not ignored
			if (tt[0] == ' ') {
				tt = '&nbsp;' + tt.slice(1);
			}
			
			a.push(tt);
		} else {
			a.push('');
		};
		return a;
	}

	/**
	 * @param wrapper DOM element to which label is added
	 * @param lft CSS left value as a percentage
	 * @param txt string to be used as label (only used if lFlag == true)
	 * @param lFlag boolean indicating whether this is really a labelled tick or
	 *              just a minor tick mark.
	 */
	function addLabel(wrapper, lft, txt, lFlag) {
		var labelPosition = $(
				'<div class="TimelineDateMarks_label" ' +
				'style="width:0px;padding:0px;margin:0px;border:none"></div>'
		);
		wrapper.append(labelPosition);
		$(labelPosition).css('left', lft + '%');
		
		if (lFlag) {
			/*
			 * Some browsers (e.g., Safari) may break a text element at a dash/minus sign unless a large enough
			 * width is specified.  If needed, add a width element to the CSS tied to the label classes defined below.
			 * The elements below properly left or right align things so specifying the width is hopefully all that
			 * is required.
			 */
			var txtArray = splitText(txt);
			labelPosition.append(
					'<div class="TimelineDateMarks_labelLeft" ' +
					'style="position:absolute;right:0px;bottom:0px;text-align:right;">' +
					txtArray[0] +
					'</div>' +
					'<div class="TimelineDateMarks_labelRight" ' +
					'style="position:absolute;left:0px;bottom:0px;text-align:left;">' +
					txtArray[1] +
					'</div>'
			);
		}
		labelPosition.append(
				'<div class="TimelineDateMarks_labelTick ' + 
					(lFlag ? 'TimelineDateMarks_labelTick_large' : 'TimelineDateMarks_labelTick_small') + '" ' +
					'style="position:absolute;left:0px;bottom:0px;text-align:left;">|</div>'
		);
	}

	$n2.TimelineDateMarks = $n2.Class({
		options: null		
		
		,dates: null
	
		,initialize: function(/* ... variable argument list ... */) { // duplicates? - rightmost take precedence
			this.options = $.extend({}, defaultOptions);
			for (var i=0; i < arguments.length; i++) { // update o with properties from objects in variable arg list.
				var o = arguments[i];
				if ($n2.isDefined(o)) {
					this.options = $.extend(true, this.options, o);
				};
			};
			
			if ($n2.isDefined(this.options.min) &&
					$n2.isDefined(this.options.max) &&
					$n2.isDefined(this.options.base) &&
					$n2.isDefined(this.options.steps)) {
				this.dates = computeDatesArray(
						this.options.min, 
						this.options.max, 
						this.options.base, 
						this.options.steps);
			}
		}
	
		,setDateRangeParms: function(min, max, base, steps) {
			this.options.min = min;
			this.options.max = max;
			this.options.base = base;
			this.options.steps = steps;
			
			this.dates = computeDatesArray(
					this.options.min,
					this.options.max, 
					this.options.base, 
					this.options.steps);
		}
		
		,draw: function() {
			var wrapper = $('<div class="TimelineDateMarks_wrapper"></div>');
			$('#' + this.options.containerId).empty().append(wrapper);
			
			for (var i=0; i < this.dates.length; i++) {
				var d = this.dates[i];
				var lft = computeLeftValue(d.date, this.options.min, this.options.max);
				if (d.labelled) {
					addLabel(wrapper, lft, dateAsString(this.options.format, d.date), true);
				} else {
					addLabel(wrapper, lft, '', false);
				}
			};
		}
	});

})(jQuery,nunaliit2);
