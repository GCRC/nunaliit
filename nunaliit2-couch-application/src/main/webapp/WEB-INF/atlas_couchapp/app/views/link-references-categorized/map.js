function(doc) {
	// !code vendor/nunaliit2/utils.js

	// Search complete doc for outward links
	var links = [];
	var ids = {};
	n2utils.extractLinks(doc,links);
	for(var i=0,e=links.length; i<e; ++i) {
		var link = links[i];
		var targetDocId = link.doc;
		var category = link.category;
		if( targetDocId && category ) {
			if( !ids[targetDocId] ) {
				ids[targetDocId] = {};
				ids[targetDocId][category] = 1;
				emit([targetDocId,category],null);
				
			} else if( !ids[targetDocId][category] ) {
				ids[targetDocId][category] = 1;
				emit([targetDocId,category],null);
			};
		};
	};
}