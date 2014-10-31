function(doc) {
	if( doc.nunaliit_import_profile
	 && doc.nunaliit_import_profile.nunaliit_type === "import_profile"
	 && doc.nunaliit_import_profile.id ) {
		emit(doc.nunaliit_import_profile.id,null);
	};
}
