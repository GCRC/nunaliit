function(doc) {

	if( 'schema' === doc.nunaliit_type ) {
		emit(doc.name,null);
	};
}