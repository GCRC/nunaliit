function(doc) {
	if( doc.nunaliit_import
	 && typeof doc.nunaliit_import.profile === 'string' ) {
		emit([doc.nunaliit_import.profile,doc.nunaliit_import.id],1);
	};
}
