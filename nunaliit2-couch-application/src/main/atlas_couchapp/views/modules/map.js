function(doc) {
	if( doc.nunaliit_module ) {
		emit(doc._id,doc.nunaliit_module.title);
	};
}
