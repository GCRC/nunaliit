function(doc) {
	if( doc.nunaliit_type
	 && 'translationRequest' == doc.nunaliit_type 
	 ) {
		var englishStr = doc.str;
		var lang = doc.lang;
		
		emit([lang,englishStr], doc);
	};
};