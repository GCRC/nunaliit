function(doc) {
	if( doc.nunaliit_source
	 && doc.nunaliit_source.doc ) {
		emit(doc.nunaliit_source.doc,null);
	};
}
