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
		$$.fail("Problem with max after extending");
	};
});

//*********
jsunit.defineTest('$n2.dateInterval',function($$){

	var date1 = new $n2.date.DateInterval({min:10,max:20});
	var date2 = new $n2.date.DateInterval({min:30,max:40});
	var date3 = new $n2.date.DateInterval({min:0,max:50});
	var now = 60;
	
	if( 10 !== date2.size(now) ){
		$$.fail("date2.size(now) should be 10");
	};
	
	if( !date1.equals(date1) ){
		$$.fail("date1 should be equal to itself");
	};
	
	if( date1.equals(date2) ){
		$$.fail("date1 and date2 are not equal");
	};
	
	if( date1.equals(null) ){
		$$.fail("date1 should not be equal to null");
	};
	
	if( !date1.equals({ongoing:false,min:10,max:20}) ){
		$$.fail("date1 should be equal to an equivalent interval");
	};
	
	if( date1.isIncludedIn(null,now) ){
		$$.fail("date1 should not be included within null");
	};
	
	if( !date1.isIncludedIn(date1,now) ){
		$$.fail("date1 should be included within itself");
	};
	
	if( !date1.isIncludedIn(date3,now) ){
		$$.fail("date1 should be included within date3");
	};
	
	if( date3.isIncludedIn(date1,now) ){
		$$.fail("date3 should not be included within date1");
	};
	
	if( date1.intersectsWith(date2,now) ){
		$$.fail("date1 and date2 do not intersect");
	};
	
	if( !date1.intersectsWith(date3,now) ){
		$$.fail("date1 and date3 intersects");
	};
	
	var interval4 = date1.extendTo(date2,now);
	if( 10 != interval4.min ){
		$$.fail("Problem with min after extending");
	};
	if( 40 != interval4.max ){
		$$.fail("Problem with max after extending");
	};
});

//*********
jsunit.defineTest('$n2.dateInterval(ongoing)',function($$){

	var date1 = new $n2.date.DateInterval({ongoing:true,min:10});
	var date2 = new $n2.date.DateInterval({ongoing:true,min:30});
	var date3 = new $n2.date.DateInterval({ongoing:true,min:0});
	var date4 = new $n2.date.DateInterval({min:0,max:5});
	var now = 60;
	
	if( 30 !== date2.size(now) ){
		$$.fail("date2.size(now) should be 30");
	};
	
	if( !date1.equals(date1) ){
		$$.fail("date1 should be equal to itself");
	};
	
	if( date1.equals(date2) ){
		$$.fail("date1 and date2 are not equal");
	};
	
	if( date1.equals(null) ){
		$$.fail("date1 should not be equal to null");
	};
	
	if( !date1.equals({ongoing:true,min:10}) ){
		$$.fail("date1 should be equal to an equivalent interval");
	};
	
	if( date1.isIncludedIn(null,now) ){
		$$.fail("date1 should not be included within null");
	};
	
	if( !date1.isIncludedIn(date1,now) ){
		$$.fail("date1 should be included within itself");
	};
	
	if( !date1.isIncludedIn(date3,now) ){
		$$.fail("date1 should be included within date3");
	};
	
	if( date3.isIncludedIn(date1,now) ){
		$$.fail("date3 should not be included within date1");
	};
	
	if( date1.intersectsWith(date4,now) ){
		$$.fail("date1 and date4 do not intersect");
	};
	
	if( !date1.intersectsWith(date3,now) ){
		$$.fail("date1 and date3 intersects");
	};
	
	var date12 = date1.extendTo(date2,now);
	var date21 = date2.extendTo(date1,now);
	if( 10 != date12.min || 10 != date21.min ){
		$$.fail("Problem with min after extending");
	};
});

//*********
jsunit.defineTest('$n2.dateInterval.save',function($$){
	
	function label(dateOpts){
		if( !dateOpts ) return 'null';
		
		var arr = [];
		arr.push('{');
		
		var first = true;
		for(var key in dateOpts){
			var value = dateOpts[key];
			
			if( first ){
				first = false;
			} else {
				arr.push('{');
			};
			
			arr.push(key);
			arr.push(':');
			arr.push(value);
		};
		
		arr.push('}');
		
		return arr.join('');
	};
	
	function test(dateOpts){
		var date1 = new $n2.date.DateInterval(dateOpts);
		var save = date1.save();
		var date2 = new $n2.date.DateInterval(save);
		
		if( ! date1.equals(date2) ){
			var l = label(dateOpts);
			$$.fail("Problem with saving: "+l);
		};
	};
	
	test({ongoing:true,min:25});
	test({min:25,max:25});
	test({min:25,max:50});
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
	valid('1980/ - ');
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
	t('aaa 1990-06-01 123456bbb',1990,6,1);
	t('201809',2018,9);
	
	function invalid(str) {
		var d;
		try {
			d = $n2.date.findDateString(str);
		} catch(e) {
			$$.fail("Exception ("+str+"): "+e);
		};
		if( d ){
			$$.fail("Should not return a date: "+str);
		};
	};
	
	invalid(' 50018 ');
	invalid(' P2018 ');
	invalid(' 2018x ');
	invalid(' 2018-011 ');
	invalid(' 2018-01-011 ');
});

//*********
jsunit.defineTest('$n2.date.findDateString(duration)',function($$){
	
	function t(str,start,end){

		try {
			var d = $n2.date.findDateString(str);
			var ds = $n2.date.parseUserDate(start);
			var de = null;
			if( end ) {
				de = $n2.date.parseUserDate(end);
			};
			
			var expected = null;
			if( de ){
				expected = ds.extendTo(de);
			} else {
				expected = new $n2.date.DateInterval({
					ongoing: true
					,min: ds.min
				});
			};

			if( ! expected.equals(d.interval) ){
				throw 'min and max do not match what is expected:'+d.str;
			};
			
		} catch(e) {
			$$.fail("Exception ("+str+"): "+e);
		};
	};

	t('aaa 1980 / 1990 bbb','1980','1990');
	t('aaa 1980/1990 bbb','1980','1990');
	t('aaa 1980/- bbb','1980',null);

	t('aaa 1980/1990/2000 bbb','1980','1990');
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
jsunit.defineTest('$n2.objectSelector.getValue',function($$){

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

//*********
jsunit.defineTest('$n2.objectSelector.setValue',function($$){

	function t(o, sel, value, create, expectedInserted){
		var obj = $n2.extend(true,{},o);
		
		var objSel = $n2.objectSelector.parseSelector(sel);
		var inserted = objSel.setValue(obj, value, create);
		
		if( inserted !== expectedInserted ){
			throw 'Unexpected insert status. Expected value: '+expectedInserted
				+' Observed: '+inserted + ' ('+sel+')';
		};
		
		if( inserted ){
			var valueCopy = objSel.getValue(obj);
			if( valueCopy !== value ){
				throw 'Unexpected value. Expected value: '+value
				+' Observed: '+valueCopy + ' ('+sel+')';
			};
		};
	};
	
	var obj = {
		a: {
			b: {
				c: 5
			}
		}
	};
	
	t(obj, 'a.i', 9, false, true);
	t(obj, 'a.i', 9, true, true);
	t(obj, 'a.i.j', 9, false, false);
	t(obj, 'a.i.j', 9, true, true);
	t(obj, 'a.b', 9, true, true);
});

//*********
jsunit.defineTest('$n2.objectSelector.removeValue',function($$){

	function t(o, sel, expectedRemoved){
		var obj = $n2.extend(true,{},o);
		
		var objSel = $n2.objectSelector.parseSelector(sel);
		var removed = objSel.removeValue(obj);
		
		if( removed !== expectedRemoved ){
			throw 'Unexpected remove status. Expected value: '+expectedRemoved
				+' Observed: '+removed + ' ('+sel+')';
		};
		
		var value = objSel.getValue(obj);
		if( typeof value !== 'undefined' ){
			throw 'Unexpected value. Value should be removed. Observed: '+value + ' ('+sel+')';
		};
	};
	
	var obj = {
		a: {
			b: {
				c: 5
			}
		}
	};
	
	t(obj, 'a', true);
	t(obj, 'a.b', true);
	t(obj, 'a.b.c', true);
	t(obj, 'a.b.c.d', false);
	t(obj, 'd', false);
});

//*********
jsunit.defineTest('$n2.objectSelector(encoding)',function($$){

	function compareArrays(a1, a2){
		if( a1.length != a2.length ){
			return -1;
		};
		for(var i=0,e=a1.length; i<e; ++i){
			var v1 = a1[i], v2 = a2[i];
			if( v1 !== v2 ) {
				return -1;
			};
		};
		return 0;
	};
	
	function t(sel){
		var objSel = new $n2.objectSelector.ObjectSelector(sel);
		var domAttribute = objSel.encodeForDomAttribute();
		var objSel2 = $n2.objectSelector.decodeFromDomAttribute(domAttribute);
		
		if( 0 !== compareArrays(objSel.selectors, objSel2.selectors) ){
			throw 'Error on encoding/decoding: '+sel;
		};
	};
	
	t([]);
	t(['abc']);
	t(['abc','def']);
	t(['abc','def','ghi']);
	t(['abc','-','ghi']);
	t(['abc',5,'ghi']);
	t(['abc',-5.33,'ghi']);
	t(['abc',null,'ghi']);
	t(['abc',true,'ghi']);
	t(['abc',false,'ghi']);
	t(['abc',undefined,'ghi']);
});

//*********
jsunit.defineTest('$n2.objectSelector(parent/key)',function($$){

	function compareArrays(a1, a2){
		if( a1.length != a2.length ){
			return -1;
		};
		for(var i=0,e=a1.length; i<e; ++i){
			var v1 = a1[i], v2 = a2[i];
			if( v1 !== v2 ) {
				return -1;
			};
		};
		return 0;
	};
	
	function t(sel, expectedParent, expectedKey){
		var objSel = new $n2.objectSelector.ObjectSelector(sel);
		var parentSel = objSel.getParentSelector();
		var key = objSel.getKey();
		
		if( null == expectedParent ){
			if( null != parentSel ){
				throw 'Unexpected parent selector: '+sel;
			};
		} else {
			if( 0 !== compareArrays(parentSel.selectors, expectedParent) ){
				throw 'Unexpected parent selector: '+sel;
			};
		};

		if( key !== expectedKey ){
			throw 'Unexpected key: '+sel;
		};
	};
	
	t([], null, undefined);
	t(['abc'], [], 'abc');
	t(['abc','def'], ['abc'], 'def');
	t(['abc','def','ghi'], ['abc','def'], 'ghi');
});

//*********
jsunit.defineTest('$n2.styleRuleParser',function($$){

	var doc = {
		_id: '123456'
		,a: 'aaa'
		,b: {
			c: 1
			,aaa: 2
			,d: {
				e: 3
			}
		}
		,l: '_id'
		,nunaliit_layers: ['public']
	};
	var ctxt_n = {
		n2_selected: false
		,n2_hovered: false
		,n2_found: false
		,n2_intent: null
		,n2_doc: doc
	};
	var ctxt_s = {
		n2_selected: true
		,n2_hovered: false
		,n2_found: false
		,n2_intent: null
		,n2_doc: doc
	};
	var ctxt_h = {
		n2_selected: false
		,n2_hovered: true
		,n2_found: false
		,n2_intent: null
		,n2_doc: doc
	};
	var ctxt_f = {
		n2_selected: false
		,n2_hovered: false
		,n2_found: true
		,n2_intent: null
		,n2_doc: doc
	};
	
	function t(ctxt, expected, condition){
		var node = $n2.styleRuleParser.parse(condition);
		var value = node.getValue(ctxt);
		if( value !== expected ){
			throw 'Unexpected. Expected value: '+expected+' Observed: '+value+' Test:'+condition;
		};
	};

	// literal values
	t(ctxt_n, true, 'true');
	t(ctxt_n, false, 'false');
	t(ctxt_n, 'abc', "'abc'");
	t(ctxt_n, 123, "123");
	// not
	t(ctxt_n, false, '!true');
	t(ctxt_n, true, '!!true');
	// and / or
	t(ctxt_n, true, 'true || true');
	t(ctxt_n, true, 'true || false');
	t(ctxt_n, true, 'false || true');
	t(ctxt_n, false, 'false || false');
	t(ctxt_n, true, 'true && true');
	t(ctxt_n, false, 'false && true');
	t(ctxt_n, false, 'true && false');
	t(ctxt_n, false, 'false && false');
	// Functions
	t(ctxt_n, false, 'isSelected()');
	t(ctxt_s, true, 'isSelected()');
	t(ctxt_n, false, 'isHovered()');
	t(ctxt_h, true, 'isHovered()');
	t(ctxt_n, false, 'isFound()');
	t(ctxt_f, true, 'isFound()');
	t(ctxt_n, false, 'isFound()');
	t(ctxt_n, true, "onLayer('public')");
	t(ctxt_n, false, "onLayer('approved')");
	// selector
	t(ctxt_n, 'aaa', "doc.a");
	t(ctxt_n, 1, "doc.b.c");
	t(ctxt_n, 1, "doc.b['c']");
	t(ctxt_n, 3, "doc.b['d']['e']");
	t(ctxt_n, 'public', "doc.nunaliit_layers[0]");
	t(ctxt_n, undefined, "doc.b.e");
	t(ctxt_n, undefined, "doc.c.d");
	t(ctxt_n, 2, "doc.b[doc.a]");
	t(ctxt_n, '123456', "doc._id");
	t(ctxt_n, '123456', "doc[doc.l]");
	// Comparison
	t(ctxt_n, true, "doc.a == 'aaa'");
	t(ctxt_n, false, "doc.a == 'bbb'");
	t(ctxt_n, false, "doc.a != 'aaa'");
	t(ctxt_n, true, "doc.a != 'bbb'");
	t(ctxt_n, true, "doc.b.c >= 0");
	t(ctxt_n, true, "doc.b.c >= 1");
	t(ctxt_n, false, "doc.b.c >= 2");
	t(ctxt_n, false, "doc.b.c <= 0");
	t(ctxt_n, true, "doc.b.c <= 1");
	t(ctxt_n, true, "doc.b.c <= 2");
	t(ctxt_n, true, "doc.b.c > 0");
	t(ctxt_n, false, "doc.b.c > 1");
	t(ctxt_n, false, "doc.b.c > 2");
	t(ctxt_n, false, "doc.b.c < 0");
	t(ctxt_n, false, "doc.b.c < 1");
	t(ctxt_n, true, "doc.b.c < 2");
	// Math
	t(ctxt_n, true, "1+1 == 2");
	t(ctxt_n, true, "4-3 == 1");
	t(ctxt_n, true, "2*3 == 6");
	t(ctxt_n, true, "9/3 == 3");
	t(ctxt_n, true, "9%2 == 1");
	t(ctxt_n, true, "'ab'+5+'cd' == 'ab5cd'");
	t(ctxt_n, true, "doc.b.c + doc.b.d.e == 4");
	// Priority...
	// + *
	t(ctxt_n, 7, "1+2*3");
	t(ctxt_n, 9, "(1+2)*3");
	t(ctxt_n, 5, "2*1+3");
	t(ctxt_n, 8, "2*(1+3)");
	// + /
	t(ctxt_n, 3, "1+6/3");
	t(ctxt_n, 3, "(3+6)/3");
	t(ctxt_n, 4, "9/3+1");
	t(ctxt_n, 3, "9/(2+1)");
	// - *
	t(ctxt_n, 1, "7-2*3");
	t(ctxt_n, 3, "(3-2)*3");
	t(ctxt_n, 5, "2*3-1");
	t(ctxt_n, 4, "2*(3-1)");
	// - /
	t(ctxt_n, 4, "6-6/3");
	t(ctxt_n, 0, "(6-6)/3");
	t(ctxt_n, 2, "9/3-1");
	t(ctxt_n, 3, "9/(4-1)");
	// + >
	t(ctxt_n, true, "1+4>2+1");
	t(ctxt_n, false, "1+4<2+1");
	// > &&
	t(ctxt_n, true, "1<4 && 4>1");
	t(ctxt_n, false, "1<4 && 4<1");
	t(ctxt_n, false, "1>4 && 4>1");
	t(ctxt_n, false, "1>4 && 4<1");
});

//*********
jsunit.defineTest('$n2.styleRule',function($$){

	var styleRules = [
		{
			condition: "true"
			,normal: {
				a: "normal"
				,b: "normal"
				,c: "normal"
			}
			,selected: {
				b: "selected"
			}
			,hovered: {
				c: "hovered"
			}
		}
		,{
			condition: "false"
			,normal: {
				a: "xxx"
				,b: "xxx"
				,c: "xxx"
			}
			,selected: {
				b: "xxx"
			}
			,hovered: {
				c: "xxx"
			}
		}
		,{
			condition: "onLayer('approved')"
			,normal: {
				a: "approved"
			}
			,selected: {
				b: "=doc.name"
			}
		}
		,{
			condition: "isSchema('place')"
			,normal: {
				a: "place"
			}
		}
	];
	var doc1 = {
		_id: '123456'
		,name: 'doc1'
		,nunaliit_layers: ['public']
	};
	var doc2 = {
		_id: '123457'
		,name: 'doc2'
		,nunaliit_layers: ['approved']
	};
	var doc3 = {
		_id: '123457'
		,name: 'doc2'
		,nunaliit_schema: 'place'
	};
	var ctxt_n = {
		n2_selected: false
		,n2_hovered: false
		,n2_found: false
		,n2_intent: null
		,n2_doc: doc1
	};
	var ctxt_s = {
		n2_selected: true
		,n2_hovered: false
		,n2_found: false
		,n2_intent: null
		,n2_doc: doc1
	};
	var ctxt_h = {
		n2_selected: false
		,n2_hovered: true
		,n2_found: false
		,n2_intent: null
		,n2_doc: doc1
	};
	var ctxt_sh = {
		n2_selected: true
		,n2_hovered: true
		,n2_found: false
		,n2_intent: null
		,n2_doc: doc1
	};
	
	function t(rules, ctxt, doc, expected_a, expected_b, expected_c){
		var testName = expected_a + '/' + expected_b + '/' + expected_c;

		ctxt.n2_doc = doc;
		
		var symbolizer = rules.getSymbolizer(ctxt);
		var a = symbolizer.getSymbolValue('a',ctxt);
		var b = symbolizer.getSymbolValue('b',ctxt);
		var c = symbolizer.getSymbolValue('c',ctxt);
		if( a !== expected_a ){
			throw 'Unexpected A. Expected value: '+expected_a+' Observed: '+a+' Test:'+testName;
		};
		if( b !== expected_b ){
			throw 'Unexpected B. Expected value: '+expected_b+' Observed: '+b+' Test:'+testName;
		};
		if( c !== expected_c ){
			throw 'Unexpected C. Expected value: '+expected_c+' Observed: '+c+' Test:'+testName;
		};
	};
	
	var rules = $n2.styleRule.loadRulesFromObject(styleRules);

	t(rules, ctxt_n,  doc1, 'normal',   'normal',  'normal');
	t(rules, ctxt_s,  doc1, 'normal',   'selected','normal');
	t(rules, ctxt_h,  doc1, 'normal',   'normal',  'hovered');
	t(rules, ctxt_sh, doc1, 'normal',   'selected','hovered');
	t(rules, ctxt_n,  doc2, 'approved', 'normal',  'normal');
	t(rules, ctxt_s,  doc2, 'approved', 'doc2',    'normal');
	t(rules, ctxt_h,  doc2, 'approved', 'normal',  'hovered');
	t(rules, ctxt_sh, doc2, 'approved', 'doc2',    'hovered');
	t(rules, ctxt_n,  doc3, 'place',    'normal',  'normal');
});

//*********
jsunit.defineTest('$n2.couchUtils.isValidWkt',function($$){

	function t(wkt,expected){
		var valid = $n2.couchUtils.isValidWkt(wkt);
		if( valid !== expected ){
			$$.fail('Error on WKT: '+wkt)
		};
	};

	t('',false); // empty not allowed
	t('POINT(1 2)', true);
	t('POINT(12)', false);
	t('POINT  (1 2)', true);
	t('    POINT(1 2)', true);
	t('POINT(1 2)    ', true);
	t('POINT(1 2)', true);
	t('POINT(  1 2)', true);
	t('POINT(1 2  )', true);
	t('POINT(1   2)', true);
	t('LINESTRING(1 2)', false);
	t('LINESTRING(1 2,3 4)', true);
	t('  LINESTRING(1 2,3 4)', true);
	t('LINESTRING  (1 2,3 4)  ', true);
	t('LINESTRING(1 2,3 4)  ', true);
	t('LINESTRING(  1 2,3 4)', true);
	t('LINESTRING(1   2,3 4)', true);
	t('LINESTRING(1 2  ,3 4)', true);
	t('LINESTRING(1 2,  3 4)', true);
	t('LINESTRING(1 2,3   4)', true);
	t('LINESTRING(1 2,3 4  )', true);
	t('LINESTRING(1 2,3 4,5 6)', true);
	t('POLYGON(1 2)', false);
	t('POLYGON((1 2))', false);
	t('POLYGON((0 0,10 0,10 10,0 10))', true);
	t('POLYGON((0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4))', true);
	t('  POLYGON((0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4))', true);
	t('POLYGON  ((0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4))', true);
	t('POLYGON(  (0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4))', true);
	t('POLYGON((  0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4))', true);
	t('POLYGON((0 0,10 0,10 10,0 10  ),(1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4))', true);
	t('POLYGON((0 0,10 0,10 10,0 10)  ,(1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4))', true);
	t('POLYGON((0 0,10 0,10 10,0 10),  (1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4))', true);
	t('POLYGON((0 0,10 0,10 10,0 10),(  1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4))', true);
	t('POLYGON((0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2  ),(3 3,4 3,4 4,3 4))', true);
	t('POLYGON((0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2)  ,(3 3,4 3,4 4,3 4))', true);
	t('POLYGON((0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2),  (3 3,4 3,4 4,3 4))', true);
	t('POLYGON((0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2),(  3 3,4 3,4 4,3 4))', true);
	t('POLYGON((0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4  ))', true);
	t('POLYGON((0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4)  )', true);
	t('POLYGON((0 0,10 0,10 10,0 10),(1 1,2 1,2 2,1 2),(3 3,4 3,4 4,3 4))  ', true);
	t('MULTIPOINT(1 2)', false);
	t('MULTIPOINT((1 2))', true);
	t('MULTIPOINT((1 2),(3 4))', true);
	t('  MULTIPOINT((1 2),(3 4))', true);
	t('MULTIPOINT  ((1 2),(3 4))', true);
	t('MULTIPOINT(  (1 2),(3 4))', true);
	t('MULTIPOINT((1 2)  ,(3 4))', true);
	t('MULTIPOINT((1 2),  (3 4))', true);
	t('MULTIPOINT((1 2),(3 4)  )', true);
	t('MULTIPOINT((1 2),(3 4))  ', true);
	t('MULTILINESTRING(1 2)', false);
	t('MULTILINESTRING((1 2))', false);
	t('MULTILINESTRING((1 2,3 4))', true);
	t('MULTILINESTRING((1 2,3 4),(5 6,7 8))', true);
	t('  MULTILINESTRING((1 2,3 4),(5 6,7 8))', true);
	t('MULTILINESTRING  ((1 2,3 4),(5 6,7 8))', true);
	t('MULTILINESTRING(  (1 2,3 4),(5 6,7 8))', true);
	t('MULTILINESTRING((1 2,3 4)  ,(5 6,7 8))', true);
	t('MULTILINESTRING((1 2,3 4),  (5 6,7 8))', true);
	t('MULTILINESTRING((1 2,3 4),(5 6,7 8)  )', true);
	t('MULTILINESTRING((1 2,3 4),(5 6,7 8))  ', true);
	t('MULTIPOLYGON(1 2)', false);
	t('MULTIPOLYGON((1 2))', false);
	t('MULTIPOLYGON(((1 2)))', false);
	t('MULTIPOLYGON(((1 2,3 4,5 6)))', true);
	t('MULTIPOLYGON(((1 2,3 4,5 6)),((7 8,9 10,11 12)))', true);
	t('  MULTIPOLYGON(((1 2,3 4,5 6)),((7 8,9 10,11 12)))', true);
	t('MULTIPOLYGON  (((1 2,3 4,5 6)),((7 8,9 10,11 12)))', true);
	t('MULTIPOLYGON(  ((1 2,3 4,5 6)),((7 8,9 10,11 12)))', true);
	t('MULTIPOLYGON(((1 2,3 4,5 6))  ,((7 8,9 10,11 12)))', true);
	t('MULTIPOLYGON(((1 2,3 4,5 6)),  ((7 8,9 10,11 12)))', true);
	t('MULTIPOLYGON(((1 2,3 4,5 6)),((7 8,9 10,11 12))  )', true);
	t('MULTIPOLYGON(((1 2,3 4,5 6)),((7 8,9 10,11 12)))  ', true);
	t('GEOMETRYCOLLECTION()', false);
	t('GEOMETRYCOLLECTION(POINT(1 2))', true);
	t('GEOMETRYCOLLECTION(POINT(1 2),LINESTRING(2 3,5 6))', true);
	t('  GEOMETRYCOLLECTION(POINT(1 2),LINESTRING(2 3,5 6))', true);
	t('GEOMETRYCOLLECTION  (POINT(1 2),LINESTRING(2 3,5 6))', true);
	t('GEOMETRYCOLLECTION(  POINT(1 2),LINESTRING(2 3,5 6))', true);
	t('GEOMETRYCOLLECTION(POINT(1 2)  ,LINESTRING(2 3,5 6))', true);
	t('GEOMETRYCOLLECTION(POINT(1 2),  LINESTRING(2 3,5 6))', true);
	t('GEOMETRYCOLLECTION(POINT(1 2),LINESTRING(2 3,5 6)  )', true);
	t('GEOMETRYCOLLECTION(POINT(1 2),LINESTRING(2 3,5 6))  ', true);
	t('GEOMETRYCOLLECTION(GEOMETRYCOLLECTION(POINT(1 2),LINESTRING(2 3,5 6)))', true);
	t('POINT(0 0)', true);
	t('POINT(0.1 0)', true);
	t('POINT(-10 0)', true);
	t('POINT(-10.12345 0)', true);
	t('POINT(0.123 0)', true);
	t('INVALID(0 0)', false);
	t('POINT(x 0)', false);
	t('POINT(1 2 3)', true);
});

//*********
jsunit.defineTest('$n2.geometry.WktParser',function($$){

	function t(wkt,expected){
		var wktParser = new $n2.geometry.WktParser();
		var geom;
		try {
			geom = wktParser.parseWkt(wkt);
		} catch(e) {
			$$.fail('WKT: '+wkt+' Error: '+e);
		};
		if( 0 !== $n2.geometry.compareGeometries(geom, expected) ){
			$$.fail('Error on WKT: '+wkt)
		};
	};

	function e(wkt){
		var wktParser = new $n2.geometry.WktParser();
		var errorTriggered = false;
		try {
			var geom = wktParser.parseWkt(wkt);
		} catch(e) {
			errorTriggered = true;
		};
		if( !errorTriggered ){
			$$.fail('WKT: '+wkt+' should have raised an error');
		};
	};
	
	var Point = $n2.geometry.Point;
	var LineString = $n2.geometry.LineString;
	var Polygon = $n2.geometry.Polygon;
	var MultiPoint = $n2.geometry.MultiPoint;
	var MultiLineString = $n2.geometry.MultiLineString;
	var MultiPolygon = $n2.geometry.MultiPolygon;
	var GeometryCollection = $n2.geometry.GeometryCollection;

	t('POINT(10 20)', new Point({x:10,y:20}));
	t('POINT(-10.1 20.5)', new Point({x:-10.1,y:20.5}));
	t('POINT(1 2)', new Point({x:1,y:2}));
	t(' POINT ( 1  2 ) ', new Point({x:1,y:2}));
	t('POINT(1 2 3)', new Point({x:1,y:2,z:3}));
	t('MULTIPOINT(1 2)', new MultiPoint({
		points:[new Point({x:1,y:2})]
	}) );
	t('MULTIPOINT(1 2,3 4)', new MultiPoint({
		points:[new Point({x:1,y:2}), new Point({x:3,y:4})]
	}) );
	t('MULTIPOINT((1 2))', new MultiPoint({
		points:[new Point({x:1,y:2})]
	}) );
	t('MULTIPOINT((1 2),(3 4))', new MultiPoint({
		points:[new Point({x:1,y:2}), new Point({x:3,y:4})]
	}) );
	t(' MULTIPOINT ( ( 1  2 ) , ( 3  4 ) ) ', new MultiPoint({
		points:[new Point({x:1,y:2}), new Point({x:3,y:4})]
	}) );
	t('LINESTRING(1 2,3 4)', new LineString({
		points: [ new Point({x:1,y:2}), new Point({x:3,y:4}) ]
	}));
	t('LINESTRING(1 2,3 4,5 6)', new LineString({
		points: [ 
			new Point({x:1,y:2})
			,new Point({x:3,y:4}) 
			,new Point({x:5,y:6}) 
		]
	}));
	t(' LINESTRING ( 1  2 , 3  4 , 5  6 ) ', new LineString({
		points: [ 
			new Point({x:1,y:2})
			,new Point({x:3,y:4}) 
			,new Point({x:5,y:6}) 
		]
	}));
	t('MULTILINESTRING((1 2,3 4))', new MultiLineString({
		lineStrings: [ 
			new LineString({
				points: [ new Point({x:1,y:2}), new Point({x:3,y:4}) ]
			})           
		]
	}));
	t('MULTILINESTRING((1 2,3 4),(5 6,7 8))', new MultiLineString({
		lineStrings: [ 
			new LineString({
				points: [ new Point({x:1,y:2}), new Point({x:3,y:4}) ]
			})           
			,new LineString({
				points: [ new Point({x:5,y:6}), new Point({x:7,y:8}) ]
			})           
		]
	}));
	t(' MULTILINESTRING ( ( 1  2 , 3  4 ) , ( 5  6 , 7  8 ) ) ', new MultiLineString({
		lineStrings: [ 
			new LineString({
				points: [ new Point({x:1,y:2}), new Point({x:3,y:4}) ]
			})           
			,new LineString({
				points: [ new Point({x:5,y:6}), new Point({x:7,y:8}) ]
			})           
		]
	}));
	t('POLYGON((1 2,3 4,5 6))', new Polygon({
		linearRings: [ 
			new LineString({
				points: [ new Point({x:1,y:2}), new Point({x:3,y:4}), new Point({x:5,y:6}) ]
			})           
		]
	}));
	t('POLYGON((1 2,3 4,5 6),(7 8,9 10,11 12))', new Polygon({
		linearRings: [ 
			new LineString({
				points: [ new Point({x:1,y:2}), new Point({x:3,y:4}), new Point({x:5,y:6}) ]
			})           
			,new LineString({
				points: [ new Point({x:7,y:8}), new Point({x:9,y:10}), new Point({x:11,y:12}) ]
			})           
		]
	}));
	t(' POLYGON ( ( 1  2 , 3  4 , 5  6 ) , ( 7  8 , 9  10 , 11  12 ) ) ', new Polygon({
		linearRings: [ 
			new LineString({
				points: [ new Point({x:1,y:2}), new Point({x:3,y:4}), new Point({x:5,y:6}) ]
			})           
			,new LineString({
				points: [ new Point({x:7,y:8}), new Point({x:9,y:10}), new Point({x:11,y:12}) ]
			})           
		]
	}));
	t('MULTIPOLYGON(((1 2,3 4,5 6),(7 8,9 10,11 12)))', new MultiPolygon({
		polygons:[
			new Polygon({
				linearRings: [ 
		  			new LineString({
		  				points: [ new Point({x:1,y:2}), new Point({x:3,y:4}), new Point({x:5,y:6}) ]
		  			})           
		  			,new LineString({
		  				points: [ new Point({x:7,y:8}), new Point({x:9,y:10}), new Point({x:11,y:12}) ]
		  			})           
		  		]
			})
		]
	}));
	t('MULTIPOLYGON(((1 2,3 4,5 6),(7 8,9 10,11 12)),((13 14,15 16,17 18),(19 20,21 22,23 24)))', new MultiPolygon({
		polygons:[
			new Polygon({
				linearRings: [ 
		  			new LineString({
		  				points: [ new Point({x:1,y:2}), new Point({x:3,y:4}), new Point({x:5,y:6}) ]
		  			})           
		  			,new LineString({
		  				points: [ new Point({x:7,y:8}), new Point({x:9,y:10}), new Point({x:11,y:12}) ]
		  			})           
		  		]
			})
			,new Polygon({
				linearRings: [ 
		  			new LineString({
		  				points: [ new Point({x:13,y:14}), new Point({x:15,y:16}), new Point({x:17,y:18}) ]
		  			})           
		  			,new LineString({
		  				points: [ new Point({x:19,y:20}), new Point({x:21,y:22}), new Point({x:23,y:24}) ]
		  			})           
		  		]
			})
		]
	}));
	t(' MULTIPOLYGON ( ( ( 1  2 , 3  4 , 5  6 ) , ( 7  8 , 9  10 , 11  12 ) ) , ( ( 13  14 , 15  16 , 17  18 ) , ( 19  20 , 21  22 , 23  24 ) ) ) ', new MultiPolygon({
		polygons:[
			new Polygon({
				linearRings: [ 
		  			new LineString({
		  				points: [ new Point({x:1,y:2}), new Point({x:3,y:4}), new Point({x:5,y:6}) ]
		  			})           
		  			,new LineString({
		  				points: [ new Point({x:7,y:8}), new Point({x:9,y:10}), new Point({x:11,y:12}) ]
		  			})           
		  		]
			})
			,new Polygon({
				linearRings: [ 
		  			new LineString({
		  				points: [ new Point({x:13,y:14}), new Point({x:15,y:16}), new Point({x:17,y:18}) ]
		  			})           
		  			,new LineString({
		  				points: [ new Point({x:19,y:20}), new Point({x:21,y:22}), new Point({x:23,y:24}) ]
		  			})           
		  		]
			})
		]
	}));
	t('GEOMETRYCOLLECTION(POINT(1 2))', new GeometryCollection({
		geometries:[
			new Point({x:1,y:2})
		]
	}));
	t('GEOMETRYCOLLECTION(POINT(1 2),LINESTRING(3 4,5 6))', new GeometryCollection({
		geometries:[
			new Point({x:1,y:2})
			,new LineString({
				points: [
					new Point({x:3,y:4})
					,new Point({x:5,y:6})
				]
			})
		]
	}));
	t(' GEOMETRYCOLLECTION ( POINT ( 1  2 ) , LINESTRING ( 3  4 , 5  6 ) ) ', new GeometryCollection({
		geometries:[
			new Point({x:1,y:2})
			,new LineString({
				points: [
					new Point({x:3,y:4})
					,new Point({x:5,y:6})
				]
			})
		]
	}));

	e('');
	e('UNKOWN');
	e('POINT');
	e('POINT(');
	e('POINT(1');
	e('POINT(1)');
	e('POINT(1 2) X');
	e('MULTIPOINT');
	e('MULTIPOINT(');
	e('MULTIPOINT(1');
	e('MULTIPOINT(1)');
	e('MULTIPOINT(1 2) X');
	e('MULTIPOINT(1 2,');
	e('MULTIPOINT(1 2,3');
	e('MULTIPOINT(1 2,3 4');
	e('MULTIPOINT(1 2,3 4) X');
	e('LINESTRING');
	e('LINESTRING(');
	e('LINESTRING(1');
	e('LINESTRING(1 2');
	e('LINESTRING(1 2)');
	e('LINESTRING(1 2,3');
	e('LINESTRING(1 2,3 4');
	e('LINESTRING(1 2,3 4) X');
	e('MULTILINESTRING');
	e('MULTILINESTRING(');
	e('MULTILINESTRING((');
	e('MULTILINESTRING((1');
	e('MULTILINESTRING((1 2');
	e('MULTILINESTRING((1 2,3');
	e('MULTILINESTRING((1 2,3 4');
	e('MULTILINESTRING((1 2,3 4');
	e('MULTILINESTRING((1 2,3 4)');
	e('MULTILINESTRING((1 2,3 4),');
	e('MULTILINESTRING((1 2,3 4),(');
	e('MULTILINESTRING((1 2,3 4),(5');
	e('MULTILINESTRING((1 2,3 4),(5 6');
	e('MULTILINESTRING((1 2,3 4),(5 6,');
	e('MULTILINESTRING((1 2,3 4),(5 6,7');
	e('MULTILINESTRING((1 2,3 4),(5 6,7 8');
	e('MULTILINESTRING((1 2,3 4),(5 6,7 8)');
	e('MULTILINESTRING((1 2,3 4),(5 6,7 8)) X');
	e('POLYGON');
	e('POLYGON(');
	e('POLYGON((');
	e('POLYGON((1');
	e('POLYGON((1 2');
	e('POLYGON((1 2,3');
	e('POLYGON((1 2,3 4');
	e('POLYGON((1 2,3 4');
	e('POLYGON((1 2,3 4))'); // must have more than 2 points
	e('POLYGON((1 2,3 4,');
	e('POLYGON((1 2,3 4,5');
	e('POLYGON((1 2,3 4,5 6');
	e('POLYGON((1 2,3 4,5 6)');
	e('POLYGON((1 2,3 4,5 6)');
	e('POLYGON((1 2,3 4,5 6),');
	e('POLYGON((1 2,3 4,5 6),(');
	e('POLYGON((1 2,3 4,5 6),(5');
	e('POLYGON((1 2,3 4,5 6),(5 6');
	e('POLYGON((1 2,3 4,5 6),(5 6,');
	e('POLYGON((1 2,3 4,5 6),(5 6,7');
	e('POLYGON((1 2,3 4,5 6),(5 6,7 8');
	e('POLYGON((1 2,3 4,5 6),(5 6,7 8,');
	e('POLYGON((1 2,3 4,5 6),(5 6,7 8,9');
	e('POLYGON((1 2,3 4,5 6),(5 6,7 8,9 10');
	e('POLYGON((1 2,3 4,5 6),(5 6,7 8,9 10)');
	e('POLYGON((1 2,3 4,5 6),(5 6,7 8,9 10)) X');
	e('MULTIPOLYGON');
	e('MULTIPOLYGON(');
	e('MULTIPOLYGON((');
	e('MULTIPOLYGON(((');
	e('MULTIPOLYGON(((1');
	e('MULTIPOLYGON(((1 2');
	e('MULTIPOLYGON(((1 2,3');
	e('MULTIPOLYGON(((1 2,3 4');
	e('MULTIPOLYGON(((1 2,3 4');
	e('MULTIPOLYGON(((1 2,3 4))');
	e('MULTIPOLYGON(((1 2,3 4)))'); // must have more than 2 points
	e('MULTIPOLYGON(((1 2,3 4,');
	e('MULTIPOLYGON(((1 2,3 4,5');
	e('MULTIPOLYGON(((1 2,3 4,5 6');
	e('MULTIPOLYGON(((1 2,3 4,5 6)');
	e('MULTIPOLYGON(((1 2,3 4,5 6)');
	e('MULTIPOLYGON(((1 2,3 4,5 6),');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5 6');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5 6,');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5 6,7');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5 6,7 8');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5 6,7 8,');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5 6,7 8,9');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5 6,7 8,9 10');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5 6,7 8,9 10)');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5 6,7 8,9 10))');
	e('MULTIPOLYGON(((1 2,3 4,5 6),(5 6,7 8,9 10))) X');
	e('GEOMETRYCOLLECTION');
	e('GEOMETRYCOLLECTION(');
	e('GEOMETRYCOLLECTION(POINT');
	e('GEOMETRYCOLLECTION(POINT(');
	e('GEOMETRYCOLLECTION(POINT(1');
	e('GEOMETRYCOLLECTION(POINT(1 2');
	e('GEOMETRYCOLLECTION(POINT(1 2)');
	e('GEOMETRYCOLLECTION(POINT(1 2),');
	e('GEOMETRYCOLLECTION(POINT(1 2),POINT');
	e('GEOMETRYCOLLECTION(POINT(1 2),POINT(');
	e('GEOMETRYCOLLECTION(POINT(1 2),POINT(3');
	e('GEOMETRYCOLLECTION(POINT(1 2),POINT(3 4');
	e('GEOMETRYCOLLECTION(POINT(1 2),POINT(3 4)');
	e('GEOMETRYCOLLECTION(POINT(1 2),POINT(3 4)) X');
});
