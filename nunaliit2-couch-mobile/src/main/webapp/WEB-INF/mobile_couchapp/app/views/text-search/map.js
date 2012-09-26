function(doc) {

// !code vendor/nunaliit2/utils.js
	
	if( doc._id[0] === '_' ) {
		// Do not index special documents
		return;
	};

	var map = n2utils.extractSearchTerms(doc);
	if( map ) {
		for(var word in map) {
			emit([word, map[word].index],null)
		};
	};
};