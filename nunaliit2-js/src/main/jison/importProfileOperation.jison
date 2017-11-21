
/* description: Parses style rules */
/*
	We want to be able to parse a rule like this:
	doc.demo_doc.refs = references(docsFromSchema('demo_media'))

	doc.demo_doc.refs = references(selectDocs(docsFromSchema('demo_media'),'demo_media.title',import.title))
	
	Variables:
	- doc : document being imported
	- import : import record
 */

%{

function compare(obj1, obj2){
	// Deals with null == null, undefined == undefined, same
	// strings or numbers
	if( obj1 === obj2 ) return 0;

	// Testing for different types
	if( typeof obj1 !== typeof obj2 ){
		if( typeof obj1 < typeof obj2 ) return -1;
		return 1;
	};
	
	// From this point, both objects have the same type and are not identical
	
	if( typeof obj1 === 'string' 
	 || typeof obj1 === 'number' ){
	 	if( obj1 < obj2 ) return -1;
	 	return 1;
	};

	if( typeof obj1 === 'boolean'){
	 	if( obj2 ) return -1;
	 	return 1;
	};

	if( typeof obj1 === 'function'){
		var src1 = obj1.toString();
		var src2 = obj2.toString();
	 	if( src1 < src2 ) return -1;
	 	if( src1 > src2 ) return 1;
	 	return 0;
	};
	
	// Deal with arrays
	if( $n2.isArray(obj1) && $n2.isArray(obj2) ){
		var refSets = true;
		obj1.forEach(function(elem){
			if( !elem ) {
				refSets = false;
			} else if( elem.nunaliit_type !== 'reference' ) {
				refSets = false;
			};
		});
		obj2.forEach(function(elem){
			if( !elem ) {
				refSets = false;
			} else if( elem.nunaliit_type !== 'reference' ) {
				refSets = false;
			};
		});
		
		if( refSets ){
			return compareReferenceSets(obj1, obj2);
		};
		
		return compareArrays(obj1, obj2)
		
	} else if( $n2.isArray(obj1) && !$n2.isArray(obj2) ){
		return -1;
	} else if( !$n2.isArray(obj1) && $n2.isArray(obj2) ){
		return 1;
	};
	
	// At this point, we should be left with two objects
	
	if( obj1.nunaliit_type === 'reference'
	 && obj2.nunaliit_type === 'reference' ){
	 	return compareReferences(obj1,obj2);
	};

	// Compare properties
	var propNameMap = {};
	for(var key in obj1){
		propNameMap[key] = true;
	};
	for(var key in obj2){
		propNameMap[key] = true;
	};
	var propNames = [];
	for(var key in propNameMap){
		propNames.push(key);
	};
	propNames.sort();
	for(var i=0; i<propNames.length; ++i){
		var propName = propNames[i];
		var prop1 = obj1[propName];
		var prop2 = obj2[propName];
		var c = compare(prop1, prop2);
		if( 0 !== c ){
			return c;
		};
	};
	
	return 0; 
};

function compareArrays(arr1, arr2){
	if( arr1.length > arr2.length ){
		return 1;
	} else if( arr1.length < arr2.length ){
		return -1;
	};
	
	for(var i=0; i<arr1.length; ++i){
		var c = compare(arr1[i], arr2[i]);
		if( 0 !== c ){
			return c;
		};
	};
	
	return 0;
};

function compareReferences(ref1, ref2){
	if( ref1 === ref2 ) return 0; // null == null and undefined == undefined
	if( !ref1 ) return -1;
	if( !ref2 ) return 1;
	if( ref1.doc === ref2.doc ) return 0;
	if( typeof ref1.doc === 'undefined' || ref1.doc === null ) return -1; 
	if( typeof ref2.doc === 'undefined' || ref2.doc === null ) return 1;
	if( ref1.doc < ref2.doc ) return -1; 
	if( ref1.doc > ref2.doc ) return 1;
	return 0; 
};

function compareReferenceSets(set1, set2){
	if( set1 === set2 ) return 0; // null == null and undefined == undefined
	if( !set1 ) return -1;
	if( !set2 ) return 1;
	
	var map1 = {};
	set1.forEach(function(ref){
		if( ref
		 && typeof ref.doc === 'string' ){
			map1[ref.doc] = true;
		};
	});

	var map2 = {};
	set2.forEach(function(ref){
		if( ref
		 && typeof ref.doc === 'string' ){
			map2[ref.doc] = true;
		};
	});
	
	for(var docId in map1){
		if( !map2[docId] ){
			return -1;
		};
	};

	for(var docId in map2){
		if( !map1[docId] ){
			return 1;
		};
	};

	return 0; 
};

// Functions in the global space receives the context object
// as 'this'.
var global = {
};
parser.global = global;

// -----------------------------------------------------------
var OpAssignment = function(leftop, value){
	this.leftop = leftop;
	this.value = value;
};
OpAssignment.prototype.configure = function(opts){
	if( this.identifier 
	 && typeof this.identifier.configure === 'function' ){
	 	this.identifier.configure(opts);
	};
	if( this.value 
	 && typeof this.value.configure === 'function' ){
	 	this.value.configure(opts);
	};
};
OpAssignment.prototype.reportCopyOperations = function(opts){
	var _this = this;

	var propertyNameMap = {};
	var updatedValue = undefined;
	var targetValue = undefined;
	var targetSelector = undefined;

	// compute new value	
	var ctxt = {
		variables:{
			doc: opts.doc,
			'import': opts.importData
		},
		propertyNameMap: propertyNameMap
	};
	this.value.getValue(ctxt, receiveUpdatedValue, processError);

	function processError(err){
		// On error, do not add any copy operations
		opts.onSuccess([]);
	};

	function receiveUpdatedValue(v){
		// save
		updatedValue = v;

		// get current value
		var ctxt2 = {
			variables:{
				doc: opts.doc,
				'import': opts.importData
			}
		};
		_this.leftop.getValue(ctxt2, receiveTargetValue, processError);
	};

	function receiveTargetValue(v){
		// save
		targetValue = v;

		// get target selector
		var ctxt2 = {
			variables:{
				doc: opts.doc,
				'import': opts.importData
			}
		};
		_this.leftop.getObjectSelector(ctxt2, receiveTargetSelector, processError);
	};

	function receiveTargetSelector(v){
		// save
		targetSelector = v;

		var isInconsistent = false;
		if( 0 !== compare(targetValue, updatedValue) ){
			isInconsistent = true;
		};
	
		var inputPropertyNames = [];
		for(var propertyName in propertyNameMap){
			inputPropertyNames.push(propertyName);
		};
	
		var op = {
			propertyNames: inputPropertyNames
			,computedValue: updatedValue
			,targetSelector: targetSelector
			,targetValue: targetValue
			,isInconsistent: isInconsistent
		};	
	
		opts.onSuccess([op]);
	};
};
OpAssignment.prototype.performCopyOperation = function(opts_){
	var opts = $n2.extend({
		doc: null
		,importData: null
		,copyOperation: null
	},opts_);
	
	var doc = opts.doc;
	var copyOperation = opts.copyOperation;
	var computedValue = copyOperation.computedValue;
	var targetSelector = copyOperation.targetSelector;
	
	if( typeof computedValue === 'undefined' ){
		targetSelector.removeValue(doc);
	} else {
		targetSelector.setValue(doc, computedValue, true);
	};
};

// -----------------------------------------------------------
var FunctionCall = function(value, args){
	this.value = value;
	this.args = args;
};
FunctionCall.prototype.getValue = function(ctxt, success, error){
	var _this = this;

	// Accumulate all the values from arguments
	var argValues = [onComplete, error];
	if( this.args ){
		this.args.pushValuesOnArray(ctxt, argValues, getFunction, error);
	} else {
		// No arguments, go directly to function
		getFunction();
	};

	function getFunction(){
		_this.value.getValue(
			ctxt,
			function(value){
				if( typeof value === 'function' ){
					value.apply(ctxt, argValues);
				} else {
					// Not a function. Return undefined
					onComplete(undefined);
				};
			},
			error
		);
	};
	
	function onComplete(res){
		success(res);
	};
};

// -----------------------------------------------------------
// Arguments
var Arguments = function(a1, a2){
	this.valueNode = a1;
	if( a2 ){
		this.nextArgument = a2;
	} else {
		this.nextArgument = null;
	};
};
Arguments.prototype.pushValuesOnArray = function(ctxt, array, success, error){
	var _this = this;

	this.valueNode.getValue(
		ctxt,
		function(value){
			array.push(value);
			
			if( _this.nextArgument ){
				_this.nextArgument.pushValuesOnArray(ctxt, array, success, error);
			} else {
				success();
			};
		},
		error
	);
};

// -----------------------------------------------------------
var Expression = function(n1, op, n2){
	this.n1 = n1;
	this.n2 = n2;
	this.op = op;
};
Expression.prototype.getValue = function(ctxt, success, error){
	var _this = this;
	this.n1.getValue(
		ctxt,
		function(r1){
			if( _this.n2 ){
				this.n2.getValue(
					ctxt,
					function(r2){
						compute(r1,r2);
					},
					error
				);
			} else {
				compute(r1,undefined);
			};
		},
		error
	);
	
	function compute(r1,r2){
		if( '!' === this.op ){
			success( !r1 );
			
		} else if( '&&' === this.op ){
			success(r1 && r2);
			
		} else if( '||' === this.op ){
			success(r1 || r2);

		} else {
			success(false);
		};
	};
};

// -----------------------------------------------------------
var Literal = function(value){
	this.value = value;
};
Literal.prototype.getValue = function(ctxt, success, error){
	success(this.value);
};

// -----------------------------------------------------------
var Comparison = function(leftNode, rightNode, op){
	this.leftNode = leftNode;
	this.rightNode = rightNode;
	this.op = op;
};
Comparison.prototype.getValue = function(ctxt, success, error){
	var _this = this;

	this.leftNode.getValue(
		ctxt,
		function(left){
			_this.rightNode.getValue(
				ctxt,
				function(right){
					if( '==' === _this.op ){
						success(left == right);
				
					} else if( '!=' === _this.op ){
						success(left != right);
				
					} else if( '>=' === _this.op ){
						success(left >= right);
				
					} else if( '<=' === _this.op ){
						success(left <= right);
				
					} else if( '>' === _this.op ){
						success(left > right);
				
					} else if( '<' === _this.op ){
						success(left < right);
		
					} else {
						success(false);
					};
				},
				error
			);
		},
		error
	);
};

// -----------------------------------------------------------
var MathOp = function(leftNode, rightNode, op){
	this.leftNode = leftNode;
	this.rightNode = rightNode;
	this.op = op;
};
MathOp.prototype.getValue = function(ctxt, success, error){
	var _this = this;

	this.leftNode.getValue(
		ctxt,
		function(left){
			_this.rightNode.getValue(
				ctxt,
				function(right){
					if( '+' === _this.op ){
						success(left + right);
				
					} else if( '-' === _this.op ){
						success(left - right);
				
					} else if( '*' === _this.op ){
						success(left * right);
				
					} else if( '/' === _this.op ){
						success(left / right);
				
					} else if( '%' === _this.op ){
						success(left % right);
		
					} else {
						success(0);
					};
				},
				error
			);
		},
		error
	);
};

// -----------------------------------------------------------
var ObjectSelector = function(id, previousSelector){
	this.idNode = id;
	this.previousSelector = previousSelector;
};
ObjectSelector.prototype.getValue = function(ctxt, success, error){
	var _this = this;
	this.previousSelector.getValue(
		ctxt, 
		function(obj){
			if( typeof obj === 'object' ){
				_this.idNode.getValue(
					ctxt,
					function(id){
						if( typeof id === 'undefined' ){
							success(undefined);
						} else {
							// Capture references to 'import' data
							if( _this.previousSelector.isVariable 
							 && _this.previousSelector.variableName === 'import' ){
							 	if( ctxt.propertyNameMap ){
							 		ctxt.propertyNameMap[id] = true;
							 	};
							};
							
							success( obj[id] );
						};
						
					},
					error
				);
			} else {
				success(undefined);
			};
		},
		error
	);
};
ObjectSelector.prototype.getObjectSelector = function(ctxt, success, error){
	var _this = this;
	this.previousSelector.getObjectSelector(
		ctxt,
		function(parentSel){
			_this.idNode.getValue(
				ctxt,
				function(id){
					var childSel = parentSel.getChildSelector(id);
					success(childSel);
				},
				error
			);
		},
		error
	);
};

// -----------------------------------------------------------
var Variable = function(variableName){
	this.isVariable = true; // marker
	this.variableName = variableName;
};
Variable.prototype.getValue = function(ctxt, success, error){
	var obj = undefined;
	
	if( ctxt 
	 && ctxt.variables 
	 && ctxt.variables[this.variableName] ) {
		obj = ctxt.variables[this.variableName];
		
	} else if( global && global[this.variableName] ) {
		obj = global[this.variableName];
	};
	
	success(obj);
};
Variable.prototype.getObjectSelector = function(ctxt, success, error){
	var sel = new $n2.objectSelector.ObjectSelector([]);
	success( sel );
};

%}

/* lexical grammar */
%lex
%%

\s+                    { /* skip whitespace */ }
"true"                 { return 'true'; }
"false"                { return 'false'; }
[0-9]+("."[0-9]+)?\b   { return 'NUMBER'; }
[_a-zA-Z][_a-zA-Z0-9]* { return 'VAR_NAME'; }
"'"(\\\'|[^'])*"'"     { yytext = yytext.substr(1,yytext.length-2); return 'STRING'; }
"=="                   { return '=='; }
"!="                   { return '!='; }
">="                   { return '>='; }
"<="                   { return '<='; }
">"                    { return '>'; }
"<"                    { return '<'; }
"("                    { return '('; }
")"                    { return ')'; }
"{"                    { return '{'; }
"}"                    { return '}'; }
"["                    { return '['; }
"]"                    { return ']'; }
","                    { return ','; }
"."                    { return '.'; }
"!"                    { return '!'; }
"+"                    { return '+'; }
"-"                    { return '-'; }
"*"                    { return '*'; }
"/"                    { return '/'; }
"%"                    { return '%'; }
"="                    { return '='; }
"&&"                   { return '&&'; }
"||"                   { return '||'; }
<<EOF>>                { return 'EOF'; }
.                      { return 'INVALID'; }

/lex

/* operator associations and precedence */

%left '&&' '||'
%left '<' '>' '<=' '>=' '==' '!='
%left '+' '-'
%left '*' '/' '%'
%left ','
%right '!'


%start program

%% /* language grammar */

program
    : operation EOF
        { return $1; }
    ;
    
operation
	: identifier '=' value
        {
        	$$ = new OpAssignment($1,$3);
        }
	;

value
    : value '&&' value
        {
        	$$ = new Expression($1,'&&',$3);
        }
    | value '||' value
        {
        	$$ = new Expression($1,'||',$3);
        }
    | '!' value
        {
        	$$ = new Expression($2,'!');
        }
    | '(' value ')'
    	{
    		$$ = $2;
    	}
    | value '==' value
        {
        	$$ = new Comparison($1,$3,'==');
        }
    | value '!=' value
        {
        	$$ = new Comparison($1,$3,'!=');
        }
    | value '>=' value
        {
        	$$ = new Comparison($1,$3,'>=');
        }
    | value '<=' value
        {
        	$$ = new Comparison($1,$3,'<=');
        }
    | value '>' value
        {
        	$$ = new Comparison($1,$3,'>');
        }
    | value '<' value
        {
        	$$ = new Comparison($1,$3,'<');
        }
	| identifier '(' ')'
        {
        	$$ = new FunctionCall($1,null);
        }
    | identifier '(' arguments ')'
        {
        	$$ = new FunctionCall($1,$3);
        }
    | identifier
        {
        	$$ = $1;
        }
    | 'true'
    	{
    		$$ = new Literal(true);
    	}
    | 'false'
    	{
    		$$ = new Literal(false);
    	}
    | 'NUMBER'
    	{
    		$$ = new Literal(1 * $1);
    	}
    | 'STRING'
    	{
    		$$ = new Literal($1);
    	}
    | value '+' value
    	{
    		$$ = new MathOp($1,$3,'+');
    	}
    | value '-' value
    	{
    		$$ = new MathOp($1,$3,'-');
    	}
    | value '*' value
    	{
    		$$ = new MathOp($1,$3,'*');
    	}
    | value '/' value
    	{
    		$$ = new MathOp($1,$3,'/');
    	}
    | value '%' value
    	{
    		$$ = new MathOp($1,$3,'%');
    	}
    ;

arguments
    : value ',' arguments
        {
        	$$ = new Arguments($1,$3);
        }
    | value
        {
        	$$ = new Arguments($1);
        }
    ;

identifier
    : identifier '.' 'VAR_NAME'
        {
        	var id = new Literal($3);
        	$$ = new ObjectSelector(id,$1);
        }
    | identifier '[' value ']'
        {
        	$$ = new ObjectSelector($3,$1);
        }
    | 'VAR_NAME'
        {
        	$$ = new Variable($1);
        }
    ;

%%
