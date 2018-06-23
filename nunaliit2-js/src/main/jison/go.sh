#!/bin/sh

jison styleRule.jison
perl merge.pl n2.styleRuleParser.js styleRule.js > ../js/nunaliit2/n2.styleRuleParser.js

jison importProfileOperation.jison
perl merge.pl n2.importProfileOperation.js importProfileOperation.js > ../js/nunaliit2/n2.couchImportProfileOperation.js

jison docFnCall.jison
perl merge.pl n2.docFnCall.js docFnCall.js > ../js/nunaliit2/n2.docFnCall.js
