function(doc) {
	if( doc
	 && doc.nunaliit_type
	 && doc.nunaliit_type === 'serverConfig'
	 && doc.server
		) {
		emit(doc.server, doc);
	};
}