function(doc) {
	if( doc.nunaliit_type
	 && 'translationRequest' == doc.nunaliit_type 
	 && null == doc.trans
	 ) {
		// This is a document translation request
		var englishStr = doc.str;
		var lang = doc.lang;
		
		emit([lang,englishStr], doc);
	};
};