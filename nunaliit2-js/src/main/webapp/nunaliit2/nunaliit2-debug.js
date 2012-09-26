;(function(){
	var scriptLocation = null;
	var scriptElem = null;
	var pattern = new RegExp("(^|(.*?\\/))nunaliit2-debug.js$");
 
	var scripts = document.getElementsByTagName('script');
	for( var loop=0; loop<scripts.length; ++loop ) {
		var src = scripts[loop].getAttribute('src');
		if (src) {
			var match = src.match(pattern);
			if( match ) {
				scriptLocation = match[1];
				scriptElem = scripts[loop];
				break;
			}
		}
	};

	if( null == scriptLocation ) {
		alert('Unable to load nunaliit2');
	};

	// Set core script name
	nunaliit2CoreScript = 'nunaliit2-debug.js';

	var jsfiles = [
		'n2.core.js'
		,'n2.utils.js'
		,'n2.cookie.js'
		,'n2.scripts.js'
		,'n2.l10n.js'
		,'n2.class.js'
		,'n2.url.js'
		,'n2.base64.js'
		,'n2.blindWidget.js'
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
		,'n2.olLoadingControl.js'
		,'n2.sliderWithCallout.js'
		,'n2.timelineDateMarks.js'
		,'n2.progress.js'
		,'jquery-progress-1.0.js'
		,'jquery-progress-slide-1.0.js'
		,'comet/json2.js'
		,'comet/jquery.cometd.js'
		,'jquery.auth-cookie.js'
		,'dbweb.js'
		,'contributions.js'
		,'olkit_adhocQueries.js'
		,'olkit_PlaceInfo.js'
		,'olkit_SearchPanel.js'
		,'n2.mapAndControls.js'
		,'mustache.js'
		,'patcher.js'
		,'n2.GeoJsonGeometryCompressor.js'
		,'n2.GeoJsonFeatureCoordinatesProcessor.js'
		,'n2.couchImportData.js'
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

