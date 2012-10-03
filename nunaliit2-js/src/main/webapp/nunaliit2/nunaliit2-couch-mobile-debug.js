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
var pattern = new RegExp('(^|(.*?\/))nunaliit2-couch-mobile-debug.js$');
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
	alert('Unable to find library tag (nunaliit2-couch-mobile-debug.js)');
};
nunaliit2CoreScript = 'nunaliit2-couch-mobile-debug.js';
var jsfiles = [
'contributions.js'
,'n2.core.js'
,'n2.utils.js'
,'n2.cookie.js'
,'n2.scripts.js'
,'n2.l10n.js'
,'n2.class.js'
,'n2.url.js'
,'n2.base64.js'
,'n2.schema.js'
,'n2.cache.js'
,'n2.dispatch.js'
,'n2.tree.js'
,'n2.slideEditor.js'
,'n2.form.js'
,'n2.mediaDisplay.js'
,'n2.googleDocs.js'
,'n2.dbSearchEngine.js'
,'n2.contributionDb.js'
,'n2.upload.js'
,'n2.olFilter.js'
,'n2.olStyleMapCallback.js'
,'n2.olUtils.js'
,'n2.sliderWithCallout.js'
,'n2.timelineDateMarks.js'
,'n2.progress.js'
,'jquery-progress-1.0.js'
,'jquery-progress-slide-1.0.js'
,'comet/json2.js'
,'comet/jquery.cometd.js'
,'jquery.auth-cookie.js'
,'dbweb.js'
,'olkit_adhocQueries.js'
,'olkit_PlaceInfo.js'
,'olkit_SearchPanel.js'
,'mustache.js'
,'patcher.js'
,'n2.couch.js'
,'n2.couchSchema.js'
,'n2.couchGeom.js'
,'n2.couchShow.js'
,'n2.couchEdit.js'
,'n2.couchRelatedDoc.js'
,'n2.couchDisplay.js'
,'n2.couchSearch.js'
,'n2.couch.l10n.js'
,'n2.couchMap.js'
,'n2.couchContribution.js'
,'n2.couchRequests.js'
,'n2.couchAuth.js'
,'n2.couch.sound.js'
,'n2.couchModule.js'
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
