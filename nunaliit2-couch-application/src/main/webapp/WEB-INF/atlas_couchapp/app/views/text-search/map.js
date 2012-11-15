function(doc) {

// !code vendor/nunaliit2/n2.couchUtils.js

	var map = n2utils.extractSearchTerms(doc,true);
	if( map ) {
		for(var word in map) {
			emit([word, map[word].index],null)
		};
	};
};