function(doc) {
	// !code vendor/nunaliit2/n2.couchUtils.js

	var schema = doc.nunaliit_schema;
	if( schema ) {
		// Search complete doc for outward links
		var links = [];
		var ids = {};
		n2utils.extractLinks(doc,links);
		for(var i=0,e=links.length; i<e; ++i) {
			var link = links[i];
			var targetDocId = link.doc;
			if( targetDocId && !ids[targetDocId] ) {
				ids[targetDocId] = 1;
				emit([targetDocId,schema],null);
			};
		};
	};
}