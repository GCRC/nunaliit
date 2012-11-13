function(doc) {
	// !code vendor/nunaliit2/n2.couchUtils.js

	// Search complete doc for outward links
	var links = [];
	n2utils.extractLinks(doc,links);
	for(var i=0,e=links.length; i<e; ++i) {
		var link = links[i];
		var targetDocId = link.doc;
		if( targetDocId && typeof(link.category) === 'undefined' ) {
			emit(targetDocId,null);
		};
	};
}