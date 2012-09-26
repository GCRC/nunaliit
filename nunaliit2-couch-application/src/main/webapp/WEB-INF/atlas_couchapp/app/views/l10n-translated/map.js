function(doc) {
	if( doc.nunaliit_type
	 && 'translationRequest' == doc.nunaliit_type 
	 && null != doc.trans
	 ) {
		// This is a document translation
		var lang = doc.lang;
		
		emit(lang, doc);
	};
};