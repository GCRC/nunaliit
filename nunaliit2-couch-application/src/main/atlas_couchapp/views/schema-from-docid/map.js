function(doc) {

	if( doc.nunaliit_schema ) {
		emit(doc._id,doc.nunaliit_schema);
	};
}