function(doc) {

// !code vendor/nunaliit2/utils.js

	var map = n2utils.extractSearchTerms(doc);
	if( map ) {
		for(var word in map) {
			emit([word, map[word].index],null)
		};
	};
};