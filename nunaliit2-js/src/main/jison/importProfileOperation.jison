
/* description: Parses style rules */

%{

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
var ObjectSelector = function(selectorStr){
	this.selectorStr = selectorStr;
	this.selector = $n2.objectSelector.parseSelector(selectorStr);
};
ObjectSelector.prototype.configure = function(opts){
};
ObjectSelector.prototype.getValue = function(obj){
	return this.selector.getValue(obj);
};
ObjectSelector.prototype.setValue = function(obj, value){
	this.selector.setValue(obj, value, true);
};
ObjectSelector.prototype.removeValue = function(obj){
	this.selector.removeValue(obj);
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
	;

referenceSelector
	: 'REF_FROM_SCHEMA' '(' 'STRING' ',' objectSelector ',' valueSelector ')'
        {
        	$$ = new RefFromSchema($3,$5,$7);
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
        	$$ = new ObjectSelector($1);
        }
	;

%%
