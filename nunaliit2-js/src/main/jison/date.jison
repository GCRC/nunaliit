
/* description: Parses style rules */

%{


%}

/* lexical grammar */
%lex
%%

\s                     { return 'SPACE'; }
[0-9]                  { return 'DIGIT'; }
"-"                    { return 'DASH'; }
":"                    { return 'COLON'; }
"/"                    { return 'SLASH'; }
"T"                    { return 'T'; }
<<EOF>>                { return 'EOF'; }
.                      { return 'INVALID'; }

/lex

/* operator associations and precedence */

%left 'SPACE'


%start program

%% /* language grammar */

program
    : interval EOF
        { return $1; }
    ;

interval
    : date period-separator date-or-ongoing
        {
        }
    | date
        {
        }
    ;
    
period-separator
	: spaces 'SLASH'
		{
		}
	| spaces 'SLASH' spaces
		{
		}
	| 'SLASH' spaces
		{
		}
	| 'SLASH'
		{
		}
	;
    
date-or-ongoing
	: date
		{
		}
	| 'DASH'
		{
		}
	;

date
    : year 'DASH' month 'DASH' day time-separator time 
        {
        }
    | year 'DASH' month 'DASH' day 
        {
        }
    | year month day time-separator time
        {
        }
    | year month day 
        {
        }
    | year 'DASH' month time-separator time
        {
        }
    | year 'DASH' month 
        {
        }
    ;
    
year
	: 'DIGIT' 'DIGIT' 'DIGIT' 'DIGIT'
		{
		}
	;
    
month
	: 'DIGIT' 'DIGIT'
		{
		}
	;
    
day
	: 'DIGIT' 'DIGIT'
		{
		}
	;
	
time-separator
	: 'T'
		{
		}
	;
    
time
	: hour 'COLON' minutes 'COLON' seconds
		{
		}
	| hour minutes seconds
		{
		}
	| hour 'COLON' minutes
		{
		}
	| hour minutes
		{
		}
	;

spaces
	: spaces 'SPACE'
		{
		}
	| 'SPACE'
		{
		}
	;

%%


