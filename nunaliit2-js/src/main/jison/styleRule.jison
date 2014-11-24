
/* description: Parses style rules */

%{

var ExpressionAnd = function(n1, n2){
	this.n1 = n1;
	this.n2 = n2;
};
ExpressionAnd.prototype.getValue = function(ctxt){
	var r1 = this.n1.getValue(ctxt);
	if( r1 ){
		return this.n2.getValue(ctxt);
	};
	return false;
};

var ExpressionOr = function(n1, n2){
	this.n1 = n1;
	this.n2 = n2;
};
ExpressionOr.prototype.getValue = function(ctxt){
	var r1 = this.n1.getValue(ctxt);
	if( !r1 ){
		return this.n2.getValue(ctxt);
	};
	return true;
};

var ExpressionNot = function(n){
	this.n = n;
};
ExpressionNot.prototype.getValue = function(ctxt){
	var r = this.n.getValue(ctxt);
	if( r ){
		return false;
	};
	return true;
};

var IsSelected = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 0 ){
		throw 'isSelected() does not accept arguments';
	};
};
IsSelected.prototype.getValue = function(ctxt){
	return ctxt.n2_selected;
};

var IsHovered = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 0 ){
		throw 'isHovered() does not accept arguments';
	};
};
IsHovered.prototype.getValue = function(ctxt){
	return ctxt.n2_hovered;
};

var IsFound = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 0 ){
		throw 'isFound() does not accept arguments';
	};
};
IsFound.prototype.getValue = function(ctxt){
	return ctxt.n2_found;
};

var IsPoint = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 0 ){
		throw 'isPoint() does not accept arguments';
	};
};
IsPoint.prototype.getValue = function(ctxt){
	return 'point' === ctxt.n2_geometry;
};

var IsLine = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 0 ){
		throw 'isLine() does not accept arguments';
	};
};
IsLine.prototype.getValue = function(ctxt){
	return 'line' === ctxt.n2_geometry;
};

var IsPolygon = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 0 ){
		throw 'isPolygon() does not accept arguments';
	};
};
IsPolygon.prototype.getValue = function(ctxt){
	return 'polygon' === ctxt.n2_geometry;
};

var IsSchema = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 1 ){
		throw 'isSchema() must have exactly one argument';
	};
	this.schemaNameNode = args[0];
};
IsSchema.prototype.getValue = function(ctxt){
	var schemaName = this.schemaNameNode.getValue(ctxt);
	if( ctxt 
	 && ctxt.n2_doc 
	 && ctxt.n2_doc.nunaliit_schema === schemaName ){
		return true;
	};
	return false;
};

var OnLayer = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 1 ){
		throw 'onLayer() must have exactly one argument';
	};
	this.layerIdNode = args[0];
};
OnLayer.prototype.getValue = function(ctxt){
	var layerId = this.layerIdNode.getValue(ctxt);
	if( ctxt 
	 && ctxt.n2_doc 
	 && ctxt.n2_doc.nunaliit_layers ){
	 	var index = ctxt.n2_doc.nunaliit_layers.indexOf(layerId);
		return (index >= 0);
	};
	return false;
};

function createFunctionNode(fName, args){
	if( 'isSelected' === fName ){
		return new IsSelected(args);
		
	} else if( 'isHovered' === fName ){
		return new IsHovered(args);
		
	} else if( 'isFound' === fName ){
		return new IsFound(args);
		
	} else if( 'isSchema' === fName ){
		return new IsSchema(args);

	} else if( 'isPoint' === fName ){
		return new IsPoint(args);

	} else if( 'isLine' === fName ){
		return new IsLine(args);

	} else if( 'isPolygon' === fName ){
		return new IsPolygon(args);
		
	} else if( 'onLayer' === fName ){
		return new OnLayer(args);
	};
	
	throw 'Function '+fName+'() is not recognized';
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
	var obj = undefined;
	if( ctxt ) {
		obj = ctxt.n2_doc;
	};
	return this._getValue(ctxt,obj);
};
ObjectSelector.prototype._getValue = function(ctxt,obj){
	// Get selection to here
	var result = obj;
	if(this.previousSelector){
		result = this.previousSelector._getValue(ctxt,obj);
	};
	
	// Perform next level of selection
	if( typeof result === 'undefined' ){
	} else if( null === result ) {
		result = undefined;
	} else if( typeof result === 'object' ) {
		var id = this.idNode.getValue(ctxt);
		result = result[id];
	} else {
		result = undefined;
	};
	
	return result;
};

// -----------------------------------------------------------
// Argument
var Argument = function(a1, a2){
	if( a2 ){
		this.a1 = a1;
		this.a2 = a2;
	} else {
		this.valueNode = a1;
	};
};
Argument.prototype.getArguments = function(ctxt){
	var args = [];
	this._getArguments(ctxt, args);
	return args;
};
Argument.prototype._getArguments = function(ctxt, args){
	if( this.valueNode ){
		args.push(this.valueNode);
	} else {
		this.a1._getArguments(ctxt, args);
		this.a2._getArguments(ctxt, args);
	};
};

%}

/* lexical grammar */
%lex
%%

\s+                    { /* skip whitespace */ }
"true"                 { return 'true'; }
"false"                { return 'false'; }
[0-9]+("."[0-9]+)?\b   { return 'NUMBER'; }
[_a-zA-Z][_a-zA-Z0-9]* { return 'IDENTIFIER'; }
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
%left '+' '-'
%left '*' '/' '%'
%left ','
%right '!'


%start program

%% /* language grammar */

program
    : expression EOF
        { return $1; }
    ;

expression
    : expression '&&' expression
        {
        	$$ = new ExpressionAnd($1,$3);
        }
    | expression '||' expression
        {
        	$$ = new ExpressionOr($1,$3);
        }
    | '!' expression
        {
        	$$ = new ExpressionNot($2);
        }
    | '(' expression ')'
    	{
    		$$ = $2;
    	}
    | comparison
    	{
    		$$ = $1;
    	}
    | value
    	{
    		$$ = $1;
    	}
    ;
    
comparison
    : value '==' value
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
    ;
    
value
	: 'IDENTIFIER' '(' ')'
        {
        	$$ = createFunctionNode($1,null);
        }
    | 'IDENTIFIER' '(' arguments ')'
        {
        	$$ = createFunctionNode($1,$3);
        }
    | '{' selector '}'
    	{
    		$$ = $2;
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
    : arguments ',' arguments
        {
        	$$ = new Argument($1,$3);
        }
    | value
        {
        	$$ = new Argument($1);
        }
    ;

selector
    : selector '.' 'IDENTIFIER'
        {
        	var id = new Literal($3);
        	$$ = new ObjectSelector(id,$1);
        }
    | selector '[' value ']'
        {
        	$$ = new ObjectSelector($3,$1);
        }
    | 'IDENTIFIER'
        {
        	var id = new Literal($1);
        	$$ = new ObjectSelector(id);
        }
    | '{' selector '}'
    	{
        	$$ = new ObjectSelector($2);
    	}
    ;

%%


