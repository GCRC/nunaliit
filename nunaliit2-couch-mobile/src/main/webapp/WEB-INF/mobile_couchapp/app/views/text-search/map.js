function(doc) {

// !code vendor/nunaliit2/n2.couchUtils.js

	if( doc._id[0] === '_' ) {
		// Do not index special documents
		return;
	};

	var map = n2utils.extractSearchTerms(doc);
	if( map ) {
		// Create map of folded words
		var fMap = {};
		for(var word in map) {
			var f = map[word].folded;
			var s = fMap[f];
			if(!s){
				s = {
					index: map[word].index
				};
				fMap[f] = s;
			} else {
				var i = map[word].index;
				if( i < s.index ) {
					s.index = i;
				};
			};
		};
		
		// Emit folded words and earliest index
		for(var f in fMap) {
			emit([f, fMap[f].index],null)
		};
	};
};