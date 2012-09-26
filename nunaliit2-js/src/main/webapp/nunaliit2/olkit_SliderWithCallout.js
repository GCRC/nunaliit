/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: olkit_SliderWithCallout.js 8165 2012-05-31 13:14:37Z jpfiset $
*/
function olkit_sliderWithCallOut(/* ... variable argument list ... */) {
	var options = {
		idBase           : '',    // string: base for ID strings used in HTML for the slider.
		useCallout       : true,  // boolean: true => use a callout; false => no callout.
		changeFn         : null,  // function to notify app of changed control value - changeFn(newValue)
		changeDuringSlide: true,  // boolean: invoke the app change function during slide (true) or only at end of move (false).
		initial          : 0,     // integer: initial value for control (in slider number range)
		step             : 1,     // integer: slider steps
		min              : 0,     // integer: minimum value for control (in slider number range)
		max              : 0,     // integer: maximum value for control (in slider number range)
		scale            : 1.0,   // number: scale factor to transform values in slider number range (integers) to control domain values
		offset           : 0.0,   // number: offset value used to transform values to control domain values.
		useNumericLabels : false, // boolean: true => stringized min/max values are labels, otherwise use following...
		minLabel         : '',
		maxLabel         : '',
		coHorOffsetPct   : 23,    // numeric: percentage horizontal offset for start position of callout (min value)
		coHorScalePct    : 54,    // numeric: percentage scale for callout motion across slider range (note: 2 * offset% + scale% = 100)
		smallCallout     : true,  // boolean: create a small bubble callout (true) or a larger text callout (false)
		sliderBarWidth   : 'med', // string: slider bar width: 'min', 'med', 'max'
		fadeInCallout    : true,  // boolean: fade the callout in and out (true) or always show value (false).
		fixedPositionCO  : false  // boolean: true => callout is in fixed position (do it in css), otherwise slides with handle
	};
	var configuredValue = null;
	
	for (var i=0; i < arguments.length; i++) { // update o with properties from objects in variable arg list.
		var o = arguments[i];
		if (typeof(o) != 'undefined' && o !== null) {
			options = $.extend(options, o);
		}
	}

	function convertSliderValue(value) {
		return((value - options.offset) / options.scale);
	}
	
	function convertDomainValueToSlider(value) {
		return((value * options.scale) + options.offset);
	}
	
	function getMinSliderValue() {
		return(convertSliderValue(options.min));
	}
	
	function getMaxSliderValue() {
		return(convertSliderValue(options.max));
	}
	
	function getMinLabel() {
		return(options.useNumericLabels ? getMinSliderValue() : options.minLabel);
	}

	function getMaxLabel() {
		return(options.useNumericLabels ? getMaxSliderValue() : options.maxLabel);
	}

	function currentSliderUIValue() {
		return(null != configuredValue ? configuredValue : options.initial);
	}
	
	var entryPoints = {};
	
	function setConfiguredValue(newValue) {
		configuredValue = convertDomainValueToSlider(newValue);
	}
	entryPoints.setConfiguredValue = setConfiguredValue;
	
	function programmedUpdate(newValue) {
		setConfiguredValue(newValue);
		$('#' + options.idBase + '_handle').slider('value', currentSliderUIValue());
	}
	entryPoints.programmedUpdate = programmedUpdate;

	function generateHtmlString() {
		var htmlString =
			'<div class="slider_wrapper slider_wrapper_width_' + options.sliderBarWidth + 
				(options.useCallout ?
					((options.smallCallout ? ' slider_wrapper_small_callout' : ' slider_wrapper_large_callout') + '">' +
					'<div id="' + options.idBase + '_callout" ' +
						'class="slider_callout ' + 
						(options.smallCallout ? 'slider_callout_small' : 'slider_callout_large') + '">' +
					'</div>') : '">') +
				'<div class="slider_left_value_label">' + getMinLabel() + '</div>' +
				'<div id="' + options.idBase + '_handle" ' +
					'class="slider_bar slider_bar_width_' + options.sliderBarWidth + '">' +
				'</div>' +
				'<div class="slider_right_value_label">' + getMaxLabel() + '</div>' +
			'</div>';
		return(htmlString);
	}
	entryPoints.generateHtmlString = generateHtmlString;

	function initialize() {
		var calloutVisible = (false == options.fadeInCallout);
		var c = '#' + options.idBase + '_callout'; // callout ID
		var dr = options.max - options.min / options.scale; // domain range
		if (options.useCallout) {
			if (options.fadeInCallout) {
				$(c).hide();
			}
			$(c).text(convertSliderValue(options.initial));
		}
		
		function computeCallOutLeftValue(newVal) {
			/*
			 * adjust horizontal positioning of the callout over bar (accounts for % of div horizontal
			 * space used for labels)
			 */
			var uiv = convertSliderValue(newVal);
			var percentage = (options.coHorScalePct * ((newVal - getMinSliderValue()) / dr)) + options.coHorOffsetPct;
//console.log('computeCallOutLeftValue - returning: '+percentage);
			return(percentage);
		}
		
		var sliderOpts = {
			value  : currentSliderUIValue(),
			min    : options.min,
			max    : options.max,
			step   : options.step,
			start  : function(e, ui) {
					if (options.useCallout) {
						$(c).css('left', computeCallOutLeftValue(ui.value) + '%');
						if (options.fadeInCallout) {
							calloutVisible = true;
							$(c).fadeIn('fast', function() {});
						}
					}
				},
			stop   : function(e, ui) {
//					if (options.useCallout) {
//						if (calloutVisible == false && options.fadeInCallout) {
//							calloutVisible = true;
//							$(c).fadeIn('fast', function() {});
//						}
//						$(c).css('left', computeCallOutLeftValue(ui.value) + '%');
//						var z = convertSliderValue(ui.value);
//						$(c).text(z);
//						if (options.fadeInCallout) {
//							$(c).fadeOut('slow', function() { calloutVisible = false; });
//						}
//					}
				},
			slide  : function(e, ui) {
					if (options.useCallout) {
						if (!options.fixedPositionCO) {
							$(c).css('left', computeCallOutLeftValue(ui.value) + '%');
						}
						var z = convertSliderValue(ui.value);
						$(c).text(z);
					}
					if (options.changeDuringSlide && ui.value != configuredValue) {
						configuredValue = ui.value;
						var newValue = convertSliderValue(ui.value);
						options.changeFn(newValue);
					}
				}, 
			change : function (e, ui) {
					if (options.useCallout) {
						if (calloutVisible == false && options.fadeInCallout) {
							calloutVisible = true;
							$(c).fadeIn('fast', function() {});
						}
						if (!options.fixedPositionCO) {
							$(c).css('left', computeCallOutLeftValue(ui.value) + '%');
						}
						var z = convertSliderValue(ui.value);
						$(c).text(z);
						if (options.fadeInCallout) {
							$(c).fadeOut('slow', function() { calloutVisible = false; });
						}
					}
					if (ui.value != configuredValue) {
						configuredValue = ui.value;
						var newValue = convertSliderValue(ui.value);
						options.changeFn(newValue);
					}
				}
		};
		if (null != options.range) {
			sliderOpts.range = options.range;
		}
		$('#' + options.idBase + '_handle').slider(sliderOpts);
	}
	entryPoints.initialize = initialize;
	
	function getCurrentValue() {
		return(convertSliderValue(currentSliderUIValue()));
	}
	entryPoints.getCurrentValue = getCurrentValue;

	function disable(flag) {
		$('#' + options.idBase + '_handle').slider('option', 'disabled', flag);
	}
	entryPoints.disable = disable;
	
	return(entryPoints);
}
