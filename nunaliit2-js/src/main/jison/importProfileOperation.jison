
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

// Functions in the global space receives the context object
// as 'this'.
var global = {
};
parser.global = global;

// -----------------------------------------------------------
var OpAssignReference = function(targetSelector, referenceSelector){
	if( typeof targetSelector === 'string' ){
		this.targetSelector = $n2.objectSelector.parseSelector(targetSelector);
	} else {
		throw new Error('expected a string');
	};
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
	var error = undefined;
	var updatedValue = undefined;
	if( computedValues.length === 1 ){
		updatedValue = computedValues[0];
	} else if( computedValues.length > 1 ){
		error = 'Multiple references found';
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
		propertyNames: [inputPropertyNames]
		,computedValue: updatedValue
		,targetSelector: this.targetSelector
		,targetValue: targetValue
		,isInconsistent: isInconsistent
	};	

	opts.onSuccess([op]);
};

// -----------------------------------------------------------
var StringValue = function(value){
	this.value = value;
};
StringValue.prototype.configure = function(opts){
};
StringValue.prototype.getValues = function(opts, propertyNameMap){
	if( typeof this.value === 'string ){
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
var RefFromSchema = function(schemaName, indexSelector, valueSelector){
	this.schemaName = schemaName;
	this.indexSelector = indexSelector;
	this.valueSelector = valueSelector;
};
RefFromSchema.prototype.configure = function(opts){
	if( this.schemaName 
	 && typeof this.schemaName.configure === 'function' ){
	 	this.schemaName.configure(opts);
	};
	if( this.indexSelector 
	 && typeof this.indexSelector.configure === 'function' ){
	 	this.indexSelector.configure(opts);
	};
	if( this.valueSelector 
	 && typeof this.valueSelector.configure === 'function' ){
	 	this.valueSelector.configure(opts);
	};
};
RefFromSchema.prototype.getValues = function(opts, propertyNameMap){
	// Returns an array of references based on the selected keys
	var targetValue = this.targetSelector.getValue(opts.importData);
	
	if( targetValue === undefined ){
		return [];
	};

	var propName = this.targetSelector.getSelectorString();
	propertyNameMap[propName] = true;
	
	return [targetValue];
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
	var values = this.valueSelector
	var targetValue = this.targetSelector.getValue(opts.importData);
	
	if( targetValue === undefined ){
		return [];
	};

	var propName = this.targetSelector.getSelectorString();
	propertyNameMap[propName] = true;
	
	return [targetValue];
};

%}

/* lexical grammar */
%lex
%%

\s+                    { /* skip whitespace */ }
"true"                 { return 'true'; }
"false"                { return 'false'; }
"assignReference"      { return 'OP_ASSIGN_REFERENCE'; }
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
	: 'OP_ASSIGN_REFERENCE' '(' 'STRING' ',' referenceSelector ')'
        {
        	$$ = new OpAssignReference($3,$5);
        }
	;

referenceSelector
	: 'REF_FROM_SCHEMA' '(' 'STRING' ',' 'STRING' ',' valueSelector ')'
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

	

%%
