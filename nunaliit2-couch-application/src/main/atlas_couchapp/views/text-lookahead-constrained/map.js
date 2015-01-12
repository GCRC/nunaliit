function(doc) {

// !code vendor/nunaliit2/n2.couchUtils.js

	// Constraints stored in a dictionary to avoid
	// duplicates
	var constraints = {};
	var constraintFound = false;
	if( doc && doc.nunaliit_layers ){
		for(var i=0,e=doc.nunaliit_layers.length; i<e; ++i){
			var layerId = doc.nunaliit_layers[i];
			constraints[layerId] = true;
			constraintFound = true;
		};
	};

	if( constraintFound ){
		var map = n2utils.extractSearchTerms(doc);
		if( map ) {
			for(var word in map) {
				var folded = map[word].folded;
				var count = map[word].count;
				
				// key is folded word and actual word.
				// value is count of occurrences for word
				if( folded && count ) {
					for(var constraint in constraints){
						emit([constraint, folded, word], count);
					};
				};
			};
		};
	};
};