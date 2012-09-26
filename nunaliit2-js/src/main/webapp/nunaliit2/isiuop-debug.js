;(function(){
	var scriptLocation = null;
	var scriptElem = null;
	var pattern = new RegExp("(^|(.*?\\/))isiuop-debug.js$");
 
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
		alert('Unable to load nunaliit2-couch');
	};

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

