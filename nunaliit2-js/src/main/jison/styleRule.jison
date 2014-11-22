
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
	return ctxt._selected;
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
	return ctxt._focus;
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
	return ctxt._find;
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
	return 'point' === ctxt._geometry;
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
	return 'line' === ctxt._geometry;
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
	return 'polygon' === ctxt._geometry;
};

var IsSchema = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 1 ){
		throw 'isSchema() must have exactly one argument';
	};
	this.schemaName = args[0];
};
IsSchema.prototype.getValue = function(ctxt){
	if( ctxt 
	 && ctxt.doc 
	 && ctxt.doc.nunaliit_schema === this.schemaName ){
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
	this.layerId = args[0];
};
OnLayer.prototype.getValue = function(ctxt){
	if( ctxt 
	 && ctxt.doc 
	 && ctxt.doc.nunaliit_layers ){
	 	var index = ctxt.doc.nunaliit_layers.indexOf(this.layerId);
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

var Boolean = function(value){
	this.value = value;
};
Boolean.prototype.getValue = function(ctxt){
	return this.value;
};

// -----------------------------------------------------------
// Argument
var Argument = function(a1, a2){
	if( a2 ){
		this.a1 = a1;
		this.a2 = a2;
	} else {
		this.value = a1;
	};
};
Argument.prototype.getArguments = function(){
	var args = [];
	this._getArguments(args);
	return args;
};
Argument.prototype._getArguments = function(args){
	if( this.value ){
		args.push(this.value);
	} else {
		this.a1._getArguments(args);
		this.a2._getArguments(args);
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
"("                    { return '('; }
")"                    { return ')'; }
","                    { return ','; }
"!"                    { return '!'; }
"&&"                   { return '&&'; }
"||"                   { return '||'; }
<<EOF>>                { return 'EOF'; }
.                      { return 'INVALID'; }

/lex

/* operator associations and precedence */

%left '&&' '||'
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
    | value
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
    | 'true'
    	{
    		$$ = new Boolean(true);
    	}
    | 'false'
    	{
    		$$ = new Boolean(false);
    	}
    ;

arguments
    : arguments ',' arguments
        {
        	$$ = new Argument($1,$3);
        }
    | 'NUMBER'
        {
        	$$ = new Argument($1);
        }
    | 'STRING'
        {
        	$$ = new Argument($1);
        }
    ;

%%


