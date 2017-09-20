
/* description: Parses style rules */

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
	
	// From this point, both objects have the same type and are not equal
	
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

	var propertyNameMap = {};

	// compute new value	
	var ctxt = {};
	ctxt.n2_doc = opts.doc;
	ctxt['import'] = opts.importData;
	ctxt.propertyNameMap = propertyNameMap;
	var updatedValue = this.value.getValue(ctxt);

	// get current value
	var ctxt2 = {};
	ctxt2.n2_doc = opts.doc;
	ctxt2['import'] = opts.importData;
	var targetValue = this.leftop.getValue(ctxt2);
	var targetSelector = this.leftop.getObjectSelector(ctxt2);
	
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
var OpAssignReference = function(objectSelector, referenceSelector){
	this.targetSelector = objectSelector;
	this.referenceSelector = referenceSelector;
};
OpAssignReference.prototype.configure = function(opts){
	if( this.targetSelector 
	 && typeof this.targetSelector.configure === 'function' ){
	 	this.targetSelector.configure(opts);
	};
	if( this.referenceSelector 
	 && typeof this.referenceSelector.configure === 'function' ){
	 	this.referenceSelector.configure(opts);
	};
};
OpAssignReference.prototype.reportCopyOperations = function(opts){

	var propertyNameMap = {};
	var computedValues = this.referenceSelector.getValues(opts, propertyNameMap);
	
	// create new value
	var updatedValue = undefined;
	if( computedValues.length === 1 ){
		updatedValue = computedValues[0];
	} else if( computedValues.length > 1 ){
		throw new Error('Multiple references found for a single unit');
	};

	var targetValue = this.targetSelector.getValue(opts.doc);
	
	var isInconsistent = false;
	if( 0 !== compareReferences(targetValue, updatedValue) ){
		isInconsistent = true;
	};

	var inputPropertyNames = [];
	for(var propertyName in propertyNameMap){
		inputPropertyNames.push(propertyName);
	};

	var op = {
		propertyNames: inputPropertyNames
		,computedValue: updatedValue
		,targetSelector: this.targetSelector
		,targetValue: targetValue
		,isInconsistent: isInconsistent
	};	

	opts.onSuccess([op]);
};
OpAssignReference.prototype.performCopyOperation = function(opts_){
	var opts = $n2.extend({
		doc: null
		,importData: null
		,copyOperation: null
	},opts_);
	
	var doc = opts.doc;
	
	var computedValues = this.referenceSelector.getValues(opts, {});
	if( computedValues.length > 1 ){
		throw new Error('Multiple references returned for a single unit');
	};
	var importValue = undefined;
	if( computedValues.length > 0 ){
		importValue = computedValues[0];
	};

	if( typeof importValue === 'undefined' ){
		// Must delete
		this.targetSelector.removeValue(doc);
	} else {
		this.targetSelector.setValue(doc, importValue);
	};
};

// -----------------------------------------------------------
var OpAssignReferences = function(objectSelector, referenceSelector){
	this.targetSelector = objectSelector;
	this.referenceSelector = referenceSelector;
};
OpAssignReferences.prototype.configure = function(opts){
	if( this.targetSelector 
	 && typeof this.targetSelector.configure === 'function' ){
	 	this.targetSelector.configure(opts);
	};
	if( this.referenceSelector 
	 && typeof this.referenceSelector.configure === 'function' ){
	 	this.referenceSelector.configure(opts);
	};
};
OpAssignReferences.prototype.reportCopyOperations = function(opts){

	var propertyNameMap = {};
	var computedReferences = this.referenceSelector.getValues(opts, propertyNameMap);
	
	var currentReferences = this.targetSelector.getValue(opts.doc);
	
	var isInconsistent = false;
	if( 0 !== compareReferenceSets(currentReferences, computedReferences) ){
		isInconsistent = true;
	};

	var inputPropertyNames = [];
	for(var propertyName in propertyNameMap){
		inputPropertyNames.push(propertyName);
	};

	var op = {
		propertyNames: inputPropertyNames
		,computedValue: computedReferences
		,targetSelector: this.targetSelector
		,targetValue: currentReferences
		,isInconsistent: isInconsistent
	};	

	opts.onSuccess([op]);
};
OpAssignReferences.prototype.performCopyOperation = function(opts_){
	var opts = $n2.extend({
		doc: null
		,importData: null
		,copyOperation: null
	},opts_);
	
	var doc = opts.doc;
	
	var computedValues = this.referenceSelector.getValues(opts, {});

	this.targetSelector.setValue(doc, computedValues);
};

// -----------------------------------------------------------
var StringValue = function(value){
	this.value = value;
};
StringValue.prototype.configure = function(opts){
};
StringValue.prototype.getValues = function(opts, propertyNameMap){
	if( typeof this.value === 'string' ){
		return [this.value];
	};

	return [];
};

// -----------------------------------------------------------
var ImportedAttributeValue = function(targetSelector){
	if( typeof targetSelector === 'string' ){
		this.targetSelector = $n2.objectSelector.parseSelector(targetSelector);
	} else {
		throw new Error('expected a string');
	};
};
ImportedAttributeValue.prototype.configure = function(opts){
	if( this.targetSelector 
	 && typeof this.targetSelector.configure === 'function' ){
	 	this.targetSelector.configure(opts);
	};
};
ImportedAttributeValue.prototype.getValues = function(opts, propertyNameMap){
	// Returns an array of values found in the import data
	var targetValue = this.targetSelector.getValue(opts.importData);
	
	if( targetValue === undefined ){
		return [];
	};

	var propName = this.targetSelector.getSelectorString();
	propertyNameMap[propName] = true;
	
	return [targetValue];
};

// -----------------------------------------------------------
// schemaName - String that represents a schema name
// objectSelector - Object selector
// valueSelector - Value selector
var RefFromSchema = function(schemaName, objectSelector, valueSelector){
	this.schemaName = schemaName;
	this.objectSelector = objectSelector;
	this.valueSelector = valueSelector;

	this.documents = [];
};
RefFromSchema.prototype.configure = function(opts){
	var _this = this;

	if( this.schemaName 
	 && typeof this.schemaName.configure === 'function' ){
	 	this.schemaName.configure(opts);
	};
	if( this.objectSelector 
	 && typeof this.objectSelector.configure === 'function' ){
	 	this.objectSelector.configure(opts);
	};
	if( this.valueSelector 
	 && typeof this.valueSelector.configure === 'function' ){
	 	this.valueSelector.configure(opts);
	};
	
	if( opts.atlasDesign ){
		opts.atlasDesign.queryView({
			viewName: 'nunaliit-schema'
			,startkey: this.schemaName
			,endkey: this.schemaName
			,include_docs: true
			,onSuccess: function(rows){
				rows.forEach(function(row){
					var doc = row.doc;
					_this.documents.push(doc);
				});
			}
		});
	};
};
RefFromSchema.prototype.getValues = function(opts, propertyNameMap){
	var _this = this;

	var values = this.valueSelector.getValues(opts, propertyNameMap);
	
	// Select documents
	var selectedDocuments = [];
	this.documents.forEach(function(doc){
		var selected = false;
		
		var v = _this.objectSelector.getValue(doc);
		values.forEach(function(value){
			if( v === value ){
				selected = true;
			};
		});
		
		if( selected ){
			selectedDocuments.push(doc);
		};
	});

	// Returns an array of references based on the selected keys
	var references = [];
	selectedDocuments.forEach(function(doc){
		var ref = {
			nunaliit_type: 'reference'
			,doc: doc._id
		};
		references.push(ref);
	});

	return references;
};

// -----------------------------------------------------------
// schemaName - String that represents a schema name
// value - Value selector
var RefFromSchema2 = function(schemaName, value){
	this.schemaName = schemaName;
	this.value = value;

	this.documents = [];
};
RefFromSchema2.prototype.configure = function(opts){
	var _this = this;

	if( this.schemaName 
	 && typeof this.schemaName.configure === 'function' ){
	 	this.schemaName.configure(opts);
	};
	if( this.value 
	 && typeof this.value.configure === 'function' ){
	 	this.value.configure(opts);
	};
	
	if( opts.atlasDesign ){
		opts.atlasDesign.queryView({
			viewName: 'nunaliit-schema'
			,startkey: this.schemaName
			,endkey: this.schemaName
			,include_docs: true
			,onSuccess: function(rows){
				rows.forEach(function(row){
					var doc = row.doc;
					_this.documents.push(doc);
				});
			}
		});
	};
};
RefFromSchema2.prototype.getValues = function(opts, propertyNameMap){
	var _this = this;

	// Select documents
	var selectedDocuments = [];
	this.documents.forEach(function(doc){
		var ctxt = {};
		ctxt.n2_doc = opts.doc;
		ctxt['import'] = opts.importData;
		
		var v = _this.value.getValue(ctxt);
		
		if( v ){
			selectedDocuments.push(doc);
		};
	});

	// Returns an array of references based on the selected keys
	var references = [];
	selectedDocuments.forEach(function(doc){
		var ref = {
			nunaliit_type: 'reference'
			,doc: doc._id
		};
		references.push(ref);
	});

	return references;
};

// -----------------------------------------------------------
var RefFromValue = function(valueSelector){
	this.valueSelector = valueSelector;
};
RefFromValue.prototype.configure = function(opts){
	if( this.valueSelector 
	 && typeof this.valueSelector.configure === 'function' ){
	 	this.valueSelector.configure(opts);
	};
};
RefFromValue.prototype.getValues = function(opts, propertyNameMap){
	// Returns an array of references based on the selected keys
	var values = this.valueSelector.getValues(opts, propertyNameMap);

	// Returns an array of references based on the selected keys
	var references = [];
	values.forEach(function(value){
		var ref = {
			nunaliit_type: 'reference'
			,doc: value
		};
		references.push(ref);
	});

	return references;
};

// -----------------------------------------------------------
// selectorStr - Dotted notation for an object selector
var DocumentSelector = function(selectorStr){
	this.selectorStr = selectorStr;
	this.selector = $n2.objectSelector.parseSelector(selectorStr);
};
DocumentSelector.prototype.configure = function(opts){
};
DocumentSelector.prototype.getValue = function(obj){
	return this.selector.getValue(obj);
};
DocumentSelector.prototype.setValue = function(obj, value){
	this.selector.setValue(obj, value, true);
};
DocumentSelector.prototype.removeValue = function(obj){
	this.selector.removeValue(obj);
};

// -----------------------------------------------------------
var FunctionCall = function(value, args){
	this.value = value;
	this.args = args;
};
FunctionCall.prototype.getValue = function(ctxt){
	var value = this.value.getValue(ctxt);
	if( typeof value === 'function' ){
		var args = [];
		if( this.args ){
			this.args.pushOnArray(ctxt, args);
		};
		return value.apply(ctxt, args);
	};
	return false;
};

// -----------------------------------------------------------
// Argument
var Argument = function(a1, a2){
	this.valueNode = a1;
	if( a2 ){
		this.nextArgument = a2;
	} else {
		this.nextArgument = null;
	};
};
Argument.prototype.getCount = function(){
	if( this.nextArgument ){
		return 1 + this.nextArgument.getCount();
	};
	
	return 1;
};
Argument.prototype.getArgument = function(ctxt, position){
	if( position < 1 ){
		return this.valueNode.getValue(ctxt);
	};
	
	if( this.nextArgument ){
		this.nextArgument.getArgument(ctxt, position-1);
	};
	
	return undefined;
};
Argument.prototype.pushOnArray = function(ctxt, array){
	var value = this.valueNode.getValue(ctxt);
	array.push(value);
	
	if( this.nextArgument ){
		this.nextArgument.pushOnArray(ctxt, array);
	};
};

// -----------------------------------------------------------
var Expression = function(n1, op, n2){
	this.n1 = n1;
	this.n2 = n2;
	this.op = op;
};
Expression.prototype.getValue = function(ctxt){
	var r1 = this.n1.getValue(ctxt);
	var r2 = undefined;
	if( this.n2 ){
		r2 = this.n2.getValue(ctxt);
	};
	if( '!' === this.op ){
		return !r1;
		
	} else if( '&&' === this.op ){
		return (r1 && r2);
		
	} else if( '||' === this.op ){
		return (r1 || r2);
	};
	return false;
};

// -----------------------------------------------------------
var Literal = function(value){
	this.value = value;
};
Literal.prototype.getValue = function(ctxt){
	return this.value;
};

// -----------------------------------------------------------
var Comparison = function(leftNode, rightNode, op){
	this.leftNode = leftNode;
	this.rightNode = rightNode;
	this.op = op;
};
Comparison.prototype.getValue = function(ctxt){
	var left = this.leftNode.getValue(ctxt);
	var right = this.rightNode.getValue(ctxt);

	if( '==' === this.op ){
		return (left == right);

	} else if( '!=' === this.op ){
		return (left != right);

	} else if( '>=' === this.op ){
		return (left >= right);

	} else if( '<=' === this.op ){
		return (left <= right);

	} else if( '>' === this.op ){
		return (left > right);

	} else if( '<' === this.op ){
		return (left < right);
	};
	
	return false;
};

// -----------------------------------------------------------
var MathOp = function(leftNode, rightNode, op){
	this.leftNode = leftNode;
	this.rightNode = rightNode;
	this.op = op;
};
MathOp.prototype.getValue = function(ctxt){
	var left = this.leftNode.getValue(ctxt);
	var right = this.rightNode.getValue(ctxt);

	if( '+' === this.op ){
		return (left + right);

	} else if( '-' === this.op ){
		return (left - right);

	} else if( '*' === this.op ){
		return (left * right);

	} else if( '/' === this.op ){
		return (left / right);

	} else if( '%' === this.op ){
		return (left % right);
	};
	
	return 0;
};

// -----------------------------------------------------------
var ObjectSelector = function(id, previousSelector){
	this.idNode = id;
	this.previousSelector = previousSelector;
};
ObjectSelector.prototype.getValue = function(ctxt){
	var obj = this.previousSelector.getValue(ctxt);
	if( typeof obj === 'object' ){
		var id = this.idNode.getValue(ctxt);
		if( typeof id === 'undefined' ){
			return undefined;
		};
		
		// Capture references to 'import' data
		if( typeof this.previousSelector.variableName === 'string' 
		 && this.previousSelector.variableName === 'import' ){
		 	if( ctxt.propertyNameMap ){
		 		ctxt.propertyNameMap[id] = true;
		 	};
		};
		
		return obj[id];
	};

	return undefined;
};
ObjectSelector.prototype.getObjectSelector = function(ctxt){
	var parentSel = this.previousSelector.getObjectSelector();
	var id = this.idNode.getValue(ctxt);
	return parentSel.getChildSelector(id);
};

// -----------------------------------------------------------
var Variable = function(variableName){
	this.variableName = variableName;
};
Variable.prototype.getValue = function(ctxt){
	var obj = undefined;
	
	if( ctxt && 'doc' === this.variableName ) {
		obj = ctxt.n2_doc;
		
	} else if( ctxt && ctxt[this.variableName] ) {
		obj = ctxt[this.variableName];
		
	} else if( global && global[this.variableName] ) {
		obj = global[this.variableName];
	};
	
	return obj;
};
Variable.prototype.getObjectSelector = function(ctxt){
	return new $n2.objectSelector.ObjectSelector([]);
};

%}

/* lexical grammar */
%lex
%%

\s+                    { /* skip whitespace */ }
"true"                 { return 'true'; }
"false"                { return 'false'; }
"assignReference"      { return 'OP_ASSIGN_REFERENCE'; }
"assignReferences"     { return 'OP_ASSIGN_REFERENCES'; }
"importedAttribute"    { return 'IMPORTED_ATTRIBUTE'; }
"fromSchema"           { return 'REF_FROM_SCHEMA'; }
"fromSchema2"          { return 'REF_FROM_SCHEMA2'; }
"referencesFromValue"  { return 'REF_FROM_VALUE'; }
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
	: 'OP_ASSIGN_REFERENCE' '(' objectSelector ',' referenceSelector ')'
        {
        	$$ = new OpAssignReference($3,$5);
        }
	| 'OP_ASSIGN_REFERENCES' '(' objectSelector ',' referenceSelector ')'
        {
        	$$ = new OpAssignReferences($3,$5);
        }
	| identifier '=' value
        {
        	$$ = new OpAssignment($1,$3);
        }
	;

referenceSelector
	: 'REF_FROM_SCHEMA' '(' 'STRING' ',' objectSelector ',' valueSelector ')'
        {
        	$$ = new RefFromSchema($3,$5,$7);
        }
	| 'REF_FROM_SCHEMA2' '(' 'STRING' ',' value ')'
        {
        	$$ = new RefFromSchema2($3,$5);
        }
	| 'REF_FROM_VALUE' '(' valueSelector ')'
        {
        	$$ = new RefFromValue($3);
        }
	;
	
valueSelector
	: 'IMPORTED_ATTRIBUTE' '(' 'STRING' ')'
        {
        	$$ = new ImportedAttributeValue($3);
        }
    | 'STRING'
        {
        	$$ = new StringValue($1);
        }
	;

objectSelector	
	: 'STRING'
        {
        	$$ = new DocumentSelector($1);
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
        	$$ = new Argument($1,$3);
        }
    | value
        {
        	$$ = new Argument($1);
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
