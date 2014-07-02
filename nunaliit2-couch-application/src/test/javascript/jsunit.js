;(function(){
	// **** Utilities ****

	function isArray(o) {
		if( o === null ) return false;
		if( o === undefined ) return false;
		if( typeof(o) !== 'object' ) return false;
		if( typeof(o.length) !== 'number' ) return false;
		if( typeof(o.push) !== 'function' ) return false;
		if( typeof(o.pop) !== 'function' ) return false;
		if( typeof(o.concat) !== 'function' ) return false;
		if( typeof(o.join) !== 'function' ) return false;
		if( typeof(o.slice) !== 'function' ) return false;
		if( typeof(o.reverse) !== 'function' ) return false;
		if( typeof(o.splice) !== 'function' ) return false;
		if( typeof(o.sort) !== 'function' ) return false;
		
		return true;
	};

	function extend() {
		// copy reference to target object
		var target = arguments[0] || {}
			,deep = false;

		// Handle a deep copy situation
		var i = 1;
		if ( typeof target === 'boolean' ) {
			deep = target;
			target = arguments[1] || {};
			// skip the boolean and the target
			i = 2;
		}

		for(var e=arguments.length; i<e; ++i) {
			var options = arguments[i];

			// Only deal with non-null/undefined values
			if( null != options ) {
				// Extend the base object
				for(var name in options) {
					var src = target[ name ];
					var copy = options[ name ];

					// Prevent never-ending loop
					if ( target === copy ) {
						continue;
					}

					// Recurse if we're merging arrays
					if ( deep && copy && isArray(copy) ) {
						var clone = (src && isArray(src)) ? src : [];

						target[ name ] = extend( deep, clone, copy );
						
					} else if( deep && copy && typeof(copy) === 'object' ) {
						// Recurse if we're merging objects
						var clone = ('object' == typeof(src)) ? src : {};

						target[ name ] = extend( deep, clone, copy );

					} else if( copy !== undefined ) {
						// Don't bring in undefined values
						target[ name ] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	};
	
	// **** General Support Functions ****
	var printErrorFn = function(str){
		var msg = '*** Error: '+str;
		if( java 
		 && java.lang 
		 && java.lang.System 
		 && java.lang.System.err ) {
			java.lang.System.err.println(msg);
		};
	};
	function printError(str){
		return printErrorFn(str);
	};
	function installPrintErrorFn(f){
		printErrorFn = f;
	};
	
	var printLogFn = function(str){
		if( java 
		 && java.lang 
		 && java.lang.System 
		 && java.lang.System.out ) {
			java.lang.System.out.println(str);
		};
	};
	function printLog(str){
		return printLogFn(str);
	};
	function installPrintLogFn(f){
		printLogFn = f;
	};
	
	// **** Test functions ****

	var testFunctions = [];
	function defineTest(name, fn){
		testFunctions.push({
			name: name
			,fn: fn
		});
	};

	var currentTest = null;
	function startTest(t){
		currentTest = {
			error: null
			,name: t.name
		};
	};
	function fail(e){
		if( currentTest ) {
			currentTest.error = e;
		} else {
			printError('*** Failure without a declared test ***');
		};
	};
	function endTest(){
		currentTest = null;
	};

	function runTests(
			testsToRun // array of test names
			){
		// Exports
		var $$ = {
			fail: fail	
		};

		var testOutcomes = [];
		var testCount = 0;
		var testFailure = 0;
		for(var i=0,e=testFunctions.length;i<e;++i){
			var testName = testFunctions[i].name;
			var testFn = testFunctions[i].fn;

			if( testsToRun && testsToRun.length > 0 ){
				if( testsToRun.indexOf(testName) < 0 ){
					continue;
				};
			};
			
			++testCount;
			
			startTest(testFunctions[i]);
			
			try {
				testFn($$);
			} catch(e) {
				if( e.forbidden ){
					fail(e.forbidden);
				} else {
					fail(e);
				};
			};
			
			if( currentTest.error ){
				++testFailure;
				printError('Failure '+testName+' : '+currentTest.error);
			} else {
				printLog('Successful '+testName);
			};

			
			testOutcomes.push(currentTest);
			
			endTest(testFunctions[i]);
		};
		
		if( testFailure > 0 ){
			printError('Test count='+testCount+' Failures='+testFailure);
		} else {
			printLog('Test count='+testCount);
		};
		
		return {
			testCount: testCount
			,failureCount: testFailure
			,results: testOutcomes
		};
	};
	
	// **** Export ****
	jsunit = {
		defineTest: defineTest
		,runTests: runTests
		
		,printError: printError
		,installPrintErrorFn: installPrintErrorFn
		,printLog: printLog
		,installPrintLogFn: installPrintLogFn

		,isArray: isArray
		,extend: extend
	};
})();