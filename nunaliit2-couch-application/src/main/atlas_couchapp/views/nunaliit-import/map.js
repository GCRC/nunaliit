function(doc) {
	if( doc.nunaliit_import 
	 && doc.nunaliit_import.id
	 && doc.nunaliit_import.profile ) {
		emit([doc.nunaliit_import.profile,doc.nunaliit_import.id],null);
	};
}
