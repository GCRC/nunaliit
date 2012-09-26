function(doc) {

	if( doc._id[0] === '_' ) {
		// Do not index special documents
		return;
	};

	// do not list schemas
	if( doc.nunaliit_type === 'schema' ) {
		return;
	};

	// do not list internal documents
	if( doc._id === 'org.nunaliit.mobile:schemaBlackList' ) {
		return;
	};
	
	emit(doc._id,null);
};