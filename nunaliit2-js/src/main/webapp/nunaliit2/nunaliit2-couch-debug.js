;(function(){
var scriptLocation = null;
var pattern = new RegExp('(^|(.*?\/))nunaliit2-couch-debug.js$');
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
	alert('Unable to find library tag (nunaliit2-couch-debug.js)');
};
nunaliit2CoreScript = 'nunaliit2-couch-debug.js';
var jsfiles = [
'n2.couch.js'
,'n2.couchSchema.js'
,'n2.couchConfiguration.js'
,'n2.couchGeom.js'
,'n2.couchShow.js'
,'n2.couchEdit.js'
,'n2.couchRelatedDoc.js'
,'n2.couchDisplay.js'
,'n2.couchSearch.js'
,'n2.couch.ol.js'
,'n2.couch.l10n.js'
,'n2.couchMap.js'
,'n2.couchContribution.js'
,'n2.couchRequests.js'
,'n2.couch.sound.js'
,'n2.couchServerSide.js'
,'n2.couchAuth.js'
,'n2.couchModule.js'
,'n2.couchExport.js'
,'n2.couchDispatchSupport.js'
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
