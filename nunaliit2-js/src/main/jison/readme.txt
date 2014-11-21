Style Rule Parser
-----------------

In the writing for Style Rules to support generic canvas, a condition
expressed as a string is used to simplify the specification by users.

The parser is built by Jison, a lex-bison implementation in Javascript.


Rule Language
-------------

The rule language is defined in the file styleRule.jison.

A parser is generated from the language by running the following command-line:

> jison styleRule.jison

This produces a file named: styleRule.js

Copy the content of this file into the proper location of n2.styleRuleParser.js


Testing
-------

For testing, use the web page styleRule.html.  It includes styleRule.js and uses its
logic to for testing it.


Installing Jison
----------------

On Ubuntu 14.04:

> sudo npm install jison -g