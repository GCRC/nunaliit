function(doc) {
	if( doc.nunaliit_script ) {
		emit([doc.nunaliit_script.type,doc.nunaliit_script.name],doc.nunaliit_script.label);
	};
}
