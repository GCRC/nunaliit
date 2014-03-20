function(doc){
	if( doc 
	 && doc.nunaliit_type === 'document_submission' 
	 && doc.nunaliit_submission ){
		if( 'waiting_for_approval' == doc.nunaliit_submission.state ) {
			emit(doc._id,null);
		} else if( 'collision' == doc.nunaliit_submission.state ) {
			emit(doc._id,null);
		};
	};
}
