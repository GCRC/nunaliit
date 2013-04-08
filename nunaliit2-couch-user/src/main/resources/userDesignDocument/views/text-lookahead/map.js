function(doc) {

// !code vendor/nunaliit2/n2.couchUtils.js

	var excludedSearchAttributes = ['_id','_rev','password_sha','salt'];
	
	var strings = [];
	n2utils.extractStrings(doc,strings,null,excludedSearchAttributes);
	
	var map = {};
	for(var i=0,e=strings.length;i<e;++i){
		n2utils.extractWordsFromString(strings[i],map);
	};
	
	// Add e-mails
//	if( doc.nunaliit_emails ){
//		for(var i=0,e=doc.nunaliit_emails.length; i<e; ++i){
//			var e = doc.nunaliit_emails[i];
//			n2utils.addWordToMap(e,0,map);
//		};
//	};
	
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