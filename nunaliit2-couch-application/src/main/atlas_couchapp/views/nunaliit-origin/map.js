function(doc) {
	if( doc.nunaliit_origin
	 && doc.nunaliit_origin.doc ) {
		emit(doc.nunaliit_origin.doc,null);
	};
}
