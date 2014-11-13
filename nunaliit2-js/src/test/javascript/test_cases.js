// **** Test cases ****

var $n2 = nunaliit2;

//*********
jsunit.defineTest('$n2.isDefined',function($$){
	if( $n2.isDefined(undefined) ){
		$$.fail('$n2.isDefined(undefined)');
	};

	if( $n2.isDefined(null) ){
		$$.fail('$n2.isDefined(null)');
	};

	if( false === $n2.isDefined(1) ){
		$$.fail('$n2.isDefined(1)');
	};

	if( false === $n2.isDefined('a') ){
		$$.fail('$n2.isDefined(a)');
	};

	if( false === $n2.isDefined(false) ){
		$$.fail('$n2.isDefined(false)');
	};

	if( false === $n2.isDefined(true) ){
		$$.fail('$n2.isDefined(true)');
	};

	if( false === $n2.isDefined([]) ){
		$$.fail('$n2.isDefined([])');
	};

	if( false === $n2.isDefined({}) ){
		$$.fail('$n2.isDefined({})');
	};
});

//*********
jsunit.defineTest('$n2.isArray',function($$){
	if( $n2.isArray(undefined) ){
		$$.fail('$n2.isArray(undefined)');
	};

	if( $n2.isArray(null) ){
		$$.fail('$n2.isArray(null)');
	};

	if( $n2.isArray(1) ){
		$$.fail('$n2.isArray(1)');
	};

	if( $n2.isArray('a') ){
		$$.fail('$n2.isArray(a)');
	};

	if( $n2.isArray(true) ){
		$$.fail('$n2.isArray(true)');
	};

	if( $n2.isArray({}) ){
		$$.fail('$n2.isArray({})');
	};

	if( false == $n2.isArray([]) ){
		$$.fail('$n2.isArray([])');
	};

	if( false == $n2.isArray(new Array()) ){
		$$.fail('$n2.isArray(new Array())');
	};
});

//*********
jsunit.defineTest('$n2.inArray',function($$){
	var arr = ['a','b','b'];
	
	var i = $n2.inArray(null,null);
	if( i >= 0 ){
		$$.fail('$n2.inArray(null,null)');
	};

	i = $n2.inArray(null,arr);
	if( i >= 0 ){
		$$.fail('$n2.inArray(null,arr)');
	};

	i = $n2.inArray('d',arr);
	if( i >= 0 ){
		$$.fail('$n2.inArray("d",arr)');
	};

	i = $n2.inArray('a',arr);
	if( i != 0 ){
		$$.fail('$n2.inArray("a",arr)');
	};

	i = $n2.inArray('b',arr);
	if( i != 1 ){
		$$.fail('$n2.inArray("b",arr)');
	};

	i = $n2.inArray('b',arr,0);
	if( i != 1 ){
		$$.fail('$n2.inArray("b",arr,0)');
	};

	i = $n2.inArray('b',arr,2);
	if( i != 2 ){
		$$.fail('$n2.inArray("b",arr,2)');
	};

	i = $n2.inArray('b',arr,3);
	if( i >= 0 ){
		$$.fail('$n2.inArray("b",arr,3)');
	};

	i = $n2.inArray('b',arr,-1);
	if( i != 2 ){
		$$.fail('$n2.inArray("b",arr,-1)');
	};

	i = $n2.inArray('b',arr,-2);
	if( i != 1 ){
		$$.fail('$n2.inArray("b",arr,-2)');
	};

	i = $n2.inArray('b',arr,-5);
	if( i != 1 ){
		$$.fail('$n2.inArray("b",arr,-5)');
	};
});

//*********
jsunit.defineTest('$n2.trim',function($$){

	if( '' !== $n2.trim(null) ){
		$$.fail("$n2.trim(null)");
	};

	if( '' !== $n2.trim('') ){
		$$.fail("$n2.trim('')");
	};

	if( '' !== $n2.trim(' ') ){
		$$.fail("$n2.trim(' ')");
	};

	if( '' !== $n2.trim('  ') ){
		$$.fail("$n2.trim('  ')");
	};

	if( 'a' !== $n2.trim('a') ){
		$$.fail("$n2.trim('a')");
	};

	if( 'a' !== $n2.trim(' a') ){
		$$.fail("$n2.trim(' a')");
	};

	if( 'a' !== $n2.trim('a ') ){
		$$.fail("$n2.trim('a ')");
	};

	if( 'a' !== $n2.trim(' a ') ){
		$$.fail("$n2.trim(' a ')");
	};

	if( 'a' !== $n2.trim('  a  ') ){
		$$.fail("$n2.trim('  a  ')");
	};

	if( 'aaa' !== $n2.trim('  aaa  ') ){
		$$.fail("$n2.trim('  aaa  ')");
	};

	if( 'aaa  bbb' !== $n2.trim('  aaa  bbb  ') ){
		$$.fail("$n2.trim('  aaa  bbb  ')");
	};
});

//*********
jsunit.defineTest('$n2.interval',function($$){

	var interval1 = new $n2.Interval({min:10,max:20});
	var interval2 = new $n2.Interval({min:30,max:40});
	var interval3 = new $n2.Interval({min:0,max:50});
	
	if( 10 !== interval2.size() ){
		$$.fail("interval2.size() should be 10");
	};
	
	if( !interval1.equals(interval1) ){
		$$.fail("interval1 should be equal to itself");
	};
	
	if( interval1.equals(interval2) ){
		$$.fail("interval1 and interval2 are not equal");
	};
	
	if( interval1.equals(null) ){
		$$.fail("interval1 should not be equal to null");
	};
	
	if( !interval1.equals({min:10,max:20}) ){
		$$.fail("interval1 should be equal to an equivalent interval");
	};
	
	if( interval1.isIncludedIn(null) ){
		$$.fail("interval1 should not be included within null");
	};
	
	if( !interval1.isIncludedIn(interval1) ){
		$$.fail("interval1 should be included within itself");
	};
	
	if( !interval1.isIncludedIn(interval3) ){
		$$.fail("interval1 should be included within interval3");
	};
	
	if( interval3.isIncludedIn(interval1) ){
		$$.fail("interval3 should not be included within interval1");
	};
	
	if( interval1.intersectsWith(interval2) ){
		$$.fail("interval1 and interval2 do not intersect");
	};
	
	if( !interval1.intersectsWith(interval3) ){
		$$.fail("interval1 and interval3 intersects");
	};
	
	var interval4 = interval1.extendTo(interval2);
	if( 10 != interval4.min ){
		$$.fail("Problem with min after extending");
	};
	if( 40 != interval4.max ){
		$$.fail("Problem with min after extending");
	};
});

//*********
jsunit.defineTest('$n2.date.parseUserDate',function($$){

	var d1980 = $n2.date.parseUserDate('1980');
	var d198006 = $n2.date.parseUserDate('1980-06');
	var d19800602 = $n2.date.parseUserDate('1980-06-02');
	var d198008 = $n2.date.parseUserDate('1980-08');
	var d1982 = $n2.date.parseUserDate('1982');
	
	if( d1980.size() <= d198006.size() ){
		$$.fail("1980 should be larger than 1980-06");
	};
	if( d198006.size() <= d19800602.size() ){
		$$.fail("1980-06 should be larger than 1980-06-02");
	};
	if( !d198006.isIncludedIn(d1980) ){
		$$.fail("1980-06 should be included within 1980");
	};
	if( !d19800602.isIncludedIn(d198006) ){
		$$.fail("1980-06-02 should be included within 1980-06");
	};
	
	if( d198008.intersectsWith(d198006) ){
		$$.fail("June 1980 and August 1980 do not intersects");
	};
	if( d198008.intersectsWith(d1982) ){
		$$.fail("June 1980 and 1982 do not intersects");
	};

	function valid(str){
		try {
			$n2.date.parseUserDate(str);
		} catch(e) {
			$$.fail("Date should be valid ("+str+"): "+e);
		};
	};
	
	valid('1980');
	valid('  1980  ');
	valid('1980-06');
	valid('  1980-06  ');
	valid('1980-06-01');
	valid('  1980-06-01  ');
	valid('19800601');
	valid('  19800601  ');
	valid('  19800601  12:34  ');
	valid('  19800601T12:34  ');
	valid('  1980-06-01  12:34  ');
	valid('  1980-06-01T12:34  ');
	valid('  19800601  12:34:56  ');
	valid('  19800601T12:34:56  ');
	valid('  1980-06-01  12:34:56  ');
	valid('  1980-06-01T12:34:56  ');
	valid('1980/ 1990 ');
});

//*********
jsunit.defineTest('$n2.date.findDateString',function($$){
	
	function t(str,year,month,day,h,m,s){

		try {
			var d = $n2.date.findDateString(str);
			if( d.year !== year ){
				$$.fail("Wrong year: "+str);
			};
			if( d.month !== month ){
				$$.fail("Wrong month: "+str);
			};
			if( d.day !== day ){
				$$.fail("Wrong day: "+str);
			};
			if( d.hours !== h ){
				$$.fail("Wrong hours: "+str);
			};
			if( d.minutes !== m ){
				$$.fail("Wrong minutes: "+str);
			};
			if( d.seconds !== s ){
				$$.fail("Wrong seconds: "+str);
			};
		} catch(e) {
			$$.fail("Exception ("+str+"): "+e);
		};
	};

	t('It happened in 1980, it was a dark night',1980);
	t('aaa 199006 bbb',1990,6);
	t('aaa 19900601 bbb',1990,6,1);
	t('aaa 1990-06 bbb',1990,6);
	t('aaa 1990-06-01 bbb',1990,6,1);
	t('aaa 1990-06-01 12:34 bbb',1990,6,1,12,34);
	t('aaa 1990-06-01   12:34 bbb',1990,6,1,12,34);
	t('aaa 1990-06-01T12:34 bbb',1990,6,1,12,34);
	t('aaa 1990-06-01T1234 bbb',1990,6,1,12,34);
	t('aaa 1990-06-01T123456 bbb',1990,6,1,12,34,56);
});

//*********
jsunit.defineTest('$n2.date.findDateString(duration)',function($$){
	
	function t(str,start,end){

		try {
			var d = $n2.date.findDateString(str);
			var ds = $n2.date.findDateString(start);
			var de = $n2.date.findDateString(end);

			if( d.interval.min != ds.interval.min 
			 || d.interval.max != de.interval.max ){
				throw 'min and max do not match what is expected';
			};
			
		} catch(e) {
			$$.fail("Exception ("+str+"): "+e);
		};
	};

	t('aaa 1980 / 1990 bbb','1980','1990');
	t('aaa 1980/1990 bbb','1980','1990');
});

//*********
jsunit.defineTest('$n2.date.extendTo',function($$){

	// Check that extending a date returns a date
	var date1 = $n2.date.parseUserDate("1980");
	var date2 = $n2.date.parseUserDate("2000");
	var date3 = date1.extendTo(date2);
	date3.getDocumentStructure();
});

//*********
jsunit.defineTest('$n2.date.intersection',function($$){

	// Check that the intersection of two dates is a date
	var date1 = $n2.date.parseUserDate("1980/2000");
	var date2 = $n2.date.parseUserDate("1990/2010");
	var date3 = date1.intersection(date2);
	date3.getDocumentStructure();
});

//*********
jsunit.defineTest('$n2.objectSelector',function($$){

	function t(o, sel, v){
		var objSel = $n2.objectSelector.parseSelector(sel);
		var value = objSel.getValue(o);
		
		if( value !== v ){
			throw 'Unexpected. Expected value: '+v+' Observed: '+value;
		};
	};
	
	var obj = {
		a: {
			b: {
				c: 5
			}
		}
	};
	
	t(obj, 'a.b.c', 5);
	t(obj, 'a.b.b', undefined);
});
