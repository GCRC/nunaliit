function main_init() {
	
	/*
	 * NOTE: TimelineDateMarks properties can be broken into multiple objects - rightmost duplicate
	 * properties take precedence.  Sometimes a programming convenience.
	 */
	var stepsBase = {
		base: $n2.TIMELINE_DATE_MARKS_Durations_WEEK,
		steps: 4
	};
	var dateRange1 = {
			min: $.datepicker.parseDate('yy-mm-dd', '1851-09-01'),
			max: $.datepicker.parseDate('yy-mm-dd', '1852-04-01')
		};
	var dateRange2 = {
			min: $.datepicker.parseDate('yy-mm-dd', '1851-09-01'),
			max: $.datepicker.parseDate('yy-mm-dd', '1851-10-15')
		};
	var dateRange3 = {
			min: $.datepicker.parseDate('yy-mm-dd', '1851-09-01'),
			max: $.datepicker.parseDate('yy-mm-dd', '1851-09-11')
		};
	var dateRange4 = {
			min: $.datepicker.parseDate('yy-mm-dd', '2000-01-01'),
			max: $.datepicker.parseDate('yy-mm-dd', '2002-12-31')
		};
	
	/*
	 * test 1: 8 month date range
	 */
	var marks = new $n2.TimelineDateMarks(
			stepsBase,
			dateRange1,
			{
				containerId: 'marks1',
				idBase: '_marks1_',
				format: 'yy-mm-dd'
			});
	marks.draw();

	/*
	 * test 2: 6 week date range
	 */
	var marks = new $n2.TimelineDateMarks(
			dateRange2,
			{
				containerId: 'marks2',
				idBase: '_marks2_',
				steps: 3,
				base: $n2.TIMELINE_DATE_MARKS_Durations_WEEK
			});
	marks.draw();

	/*
	 * test 3: 10 day date range - use of setDateRangeParms interface
	 */
	var marks = new $n2.TimelineDateMarks(
			{
				containerId: 'marks3',
				idBase: '_marks3_'
			});
	marks.setDateRangeParms(
			dateRange3.min,
			dateRange3.max,
			$n2.TIMELINE_DATE_MARKS_Durations_DAY,
			5
	);
	marks.draw();

	/*
	 * test 4: 2 year date range - use of setDateRangeParms interface
	 */
	var marks = new $n2.TimelineDateMarks(
			{
				containerId: 'marks4',
				idBase: '_marks4_',
				format: 'yy-mm-dd'
			});
	marks.setDateRangeParms(
			dateRange4.min,
			dateRange4.max,
			$n2.TIMELINE_DATE_MARKS_Durations_YEAR,
			5
	);
	marks.draw();

};
jQuery().ready(function() { main_init(); });
