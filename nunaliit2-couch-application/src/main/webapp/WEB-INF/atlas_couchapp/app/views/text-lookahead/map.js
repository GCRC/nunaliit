function(doc) {

// !code vendor/nunaliit2/n2.couchUtils.js

	var map = n2utils.extractSearchTerms(doc,true);
	if( map ) {
		for(var word in map) {
			// key is word, value is number of times word
			// is found in document
			emit(word,map[word].count)
		};
	};
};