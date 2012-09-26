function main_init() {
	
	/*
	 * NOTE: the slider properties can be broken into multiple objects - rightmost duplicate
	 * properties take precedence.  Sometimes a programming convenience.
	 */
	var intRange = {
		min: 120,
		max: 200,
		step: 1,
		initial: 150
	};
	var floatRange = {
		min: -1.0,
		max: 1.0,
		step: 0.01,
		format: '%1.2f'
	};
	var dateRange = {
		min: $.datepicker.parseDate('yy-mm-dd', '1851-09-01'),
		max: $.datepicker.parseDate('yy-mm-dd', '1852-04-01'),
		step: new Date($n2.SLIDER_CONSTANTS.DURATION_DAY),
		format: 'yy-mm-dd',
		valueType: $n2.SLIDER_CONSTANTS.DATE
	};
	
	/*
	 * test 1: simple integer slider with callout
	 */
	var slider = new $n2.SingleHandleSliderWithCallout(
		intRange,
		{
			containerId: 'slider1',
			idBase: '_slider1_',
			changeFn: function() {}
		});
	slider.create();
	
	/*
	 * test 2: integer slider with callout and 'min' range
	 */
	var prop = {
		range: 'min'
	};
	var slider = new $n2.SingleHandleSliderWithCallout(
		intRange,
		prop,
		{
			containerId: 'slider2',
			idBase: '_slider2_',
			changeFn: function() {}
		});
	slider.create();
	
	/*
	 * test 3: simple float slider with callout
	 */
	slider = new $n2.SingleHandleSliderWithCallout(
		floatRange,
		{
			containerId: 'slider3',
			idBase: '_slider3_',
			changeFn: function() {}
		});
	slider.create();
	
	/*
	 * test 4: float slider with callout with 'max' range
	 */
	prop = {
		range: 'max',
		initial: 0.0
	};
	slider = new $n2.SingleHandleSliderWithCallout(
		floatRange,
		prop,
		{
			containerId: 'slider4',
			idBase: '_slider4_',
			changeFn: function() {}
		});
	slider.create();
	
	/*
	 * test 5: double-handled float slider with callout
	 */
	prop = {
		initial: [ -0.5, 0.5 ],
		range: true
	};
	slider = new $n2.RangeSliderWithCallout(
		floatRange,
		prop,
		{
			containerId: 'slider5',
			idBase: '_slider5_',
			changeFn: function() {},
		});
	slider.create();
	
	/*
	 * test 6: double-handled date slider with callout increment by days
	 */
	prop = {
		initial:
		[ 
		 	$.datepicker.parseDate('yy-mm-dd', '1851-12-01'),
		 	$.datepicker.parseDate('yy-mm-dd', '1852-02-01'),
		],
		range: true
	};
	slider = new $n2.RangeSliderWithCallout(
		dateRange,
		prop,
		{
			containerId: 'slider6',
			idBase: '_slider6_',
			changeFn: function() {},
		});
	slider.create();

	/*
	 * test 7: double-handled date slider with callout increment by weeks
	 */
	prop = {
		initial:
		[ 
		 	$.datepicker.parseDate('yy-mm-dd', '1851-12-01'),
		 	$.datepicker.parseDate('yy-mm-dd', '1852-02-01'),
		],
		range: true,
		step: new Date($n2.SLIDER_CONSTANTS.DURATION_WEEK)
	};
	slider = new $n2.RangeSliderWithCallout(
		dateRange,
		prop,
		{
			containerId: 'slider7',
			idBase: '_slider7_',
			changeFn: function() {},
		});
	slider.create();

};
jQuery().ready(function() { main_init(); });
