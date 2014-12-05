#!/bin/sh

jison styleRule.jison
perl merge.pl n2.styleRuleParser.js styleRule.js > ../js/nunaliit2/n2.styleRuleParser.js

