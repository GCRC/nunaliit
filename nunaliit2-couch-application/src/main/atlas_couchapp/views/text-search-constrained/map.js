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
		var map = n2utils.extractSearchTerms(doc, true);
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
				for(var c in constraints){
					emit([c, f, fMap[f].index],null)
				};
			};
		};
	};
};