function(doc) {
	if( 'schema' === doc.nunaliit_type ) {
		emit(doc._id,null);

	} else if (doc.nunaliit_schema === 'atlas') {
		emit(doc._id, null);
	} else if( doc.nunaliit_module ) {
		emit(doc._id,null);

	} else if( doc.nunaliit_navigation ) {
		emit(doc._id,null);

	} else if( doc.nunaliit_skeleton ) {
		emit(doc._id,null);
	};
}
