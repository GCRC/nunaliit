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
