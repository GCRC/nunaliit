function(doc) {
	if( doc.nunaliit_import
	 && doc.nunaliit_import.profile
	 && typeof doc.nunaliit_import.id !== 'undefined' 
	 && null !== doc.nunaliit_import.id ) {
		emit([doc.nunaliit_import.profile,doc.nunaliit_import.id],null);
	};
}
