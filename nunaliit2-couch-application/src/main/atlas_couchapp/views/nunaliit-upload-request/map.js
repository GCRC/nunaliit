function(doc) {

	if( doc 
	 && doc.nunaliit_upload_request
	 && doc.nunaliit_upload_request.uploadId ) {
		emit(doc.nunaliit_upload_request.uploadId, null);
	};
}