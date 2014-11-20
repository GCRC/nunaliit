
/* description: Parses style rules */

%{

var Node = function(){
};
Node.prototype.evalContext = function(ctxt){
	throw 'All nodes must be able to evaluate context';
};

var NodeAnd = function(n1, n2){
	this.n1 = n1;
	this.n2 = n2;
};
NodeAnd.prototype.evalContext = function(ctxt){
	var r1 = this.n1.evalContext(ctxt);
	if( r1 ){
		return this.n2.evalContext(ctxt);
	};
	return false;
};

var NodeOr = function(n1, n2){
	this.n1 = n1;
	this.n2 = n2;
};
NodeOr.prototype.evalContext = function(ctxt){
	var r1 = this.n1.evalContext(ctxt);
	if( !r1 ){
		return this.n2.evalContext(ctxt);
	};
	return true;
};

var NodeIsSelected = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 0 ){
		throw 'isSelected() does not accept arguments';
	};
};
NodeIsSelected.prototype.evalContext = function(ctxt){
	return ctxt._selected;
};

var NodeIsSchema = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 1 ){
		throw 'isSchema() must have exactly one argument';
	};
	this.schemaName = args[0];
};
NodeIsSchema.prototype.evalContext = function(ctxt){
	if( ctxt 
	 && ctxt.doc 
	 && ctxt.doc.nunaliit_schema === this.schemaName ){
		return true;
	};
	return false;
};

var NodeOnLayer = function(args_){
	var args = [];
	if( args_ ){
		args = args_.getArguments();
	};
	if( args.length != 1 ){
		throw 'onLayer() must have exactly one argument';
	};
	this.layerId = args[0];
};
NodeOnLayer.prototype.evalContext = function(ctxt){
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
		return new NodeIsSelected(args);
		
	} else if( 'isSchema' === fName ){
		return new NodeIsSchema(args);
		
	} else if( 'onLayer' === fName ){
		return new NodeOnLayer(args);
	};
	
	throw 'Function '+fName+'() is not recognized';
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
[0-9]+("."[0-9]+)?\b   { return 'NUMBER'; }
[_a-zA-Z][_a-zA-Z0-9]* { return 'IDENTIFIER'; }
'"'(\\\"|[^"])*'"'     { yytext = yytext.substr(1,yytext.length-2); return 'STRING'; }
"("                    { return '('; }
")"                    { return ')'; }
","                    { return ','; }
"&&"                   { return '&&'; }
"||"                   { return '||'; }
<<EOF>>                { return 'EOF'; }
.                      { return 'INVALID'; }

/lex

/* operator associations and precedence */

%left '&&' '||'
%left ','


%start program

%% /* language grammar */

program
    : rule EOF
        { return $1; }
    ;

rule
    : rule '&&' rule
        {
        	$$ = new NodeAnd($1,$3);
        }
    | rule '||' rule
        {
        	$$ = new NodeOr($1,$3);
        }
    | '(' rule ')'
    	{
    		$$ = $2;
    	}
    | 'IDENTIFIER' '(' ')'
        {
        	$$ = createFunctionNode($1,null);
        }
    | 'IDENTIFIER' '(' arguments ')'
        {
        	$$ = createFunctionNode($1,$3);
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


