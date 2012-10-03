/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, 
Carleton University, Canada
All rights reserved.

Released under New BSD License.
Details at:
   https://svn.gcrc.carleton.ca/nunaliit2/trunk/sdk/license.txt
   
$Id: license.txt 8178 2012-06-04 20:46:29Z jpfiset $   
*/

;(function(){
var scriptLocation = null;
var pattern = new RegExp('(^|(.*?\/))isiuop-debug.js$');
var scripts = document.getElementsByTagName('script');
for( var loop=0; loop<scripts.length; ++loop ) {
	var src = scripts[loop].getAttribute('src');
	if (src) {
		var match = src.match(pattern);
		if( match ) {
			scriptLocation = match[1];
			break;
		}
	}
};
if( null === scriptLocation ) {
	alert('Unable to find library tag (isiuop-debug.js)');
};
nunaliit2CoreScript = 'isiuop-debug.js';
var jsfiles = [
'olkit.click.isiuop.js'
,'olkit.sound.isiuop.js'
,'olkit.search.isiuop.js'
];
var allScriptTags = new Array();
for( var i=0; i<jsfiles.length; ++i ) {
	allScriptTags.push('<script src="');
	allScriptTags.push(scriptLocation);
	allScriptTags.push(jsfiles[i]);
	allScriptTags.push('"></script>');
};
document.write(allScriptTags.join(''));
})();
