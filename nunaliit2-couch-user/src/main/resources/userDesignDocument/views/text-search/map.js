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