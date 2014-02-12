function(doc) {

// !code vendor/nunaliit2/n2.couchUtils.js

	var map = n2utils.extractSearchTerms(doc);
	if( map ) {
		for(var word in map) {
			var folded = map[word].folded;
			var count = map[word].count;
			
			// key is folded word and actual word.
			// value is count of occurrences for word
			if( folded && count ) emit([folded,word],count);
		};
	};
};