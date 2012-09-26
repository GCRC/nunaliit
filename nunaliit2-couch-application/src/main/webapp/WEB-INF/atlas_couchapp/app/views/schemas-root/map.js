function(doc) {

	if( 'schema' === doc.nunaliit_type && doc.isRootSchema ) {
		emit(doc.name,null);
	};
}