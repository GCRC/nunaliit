function(doc){
	if( doc 
	 && doc.nunaliit_type === 'document_submission' 
	 && doc.nunaliit_submission ){
		if( !doc.nunaliit_submission.state ) {
			emit(doc._id,null);

		} else if( 'submitted' == doc.nunaliit_submission.state ) {
			emit(doc._id,null);

		} else if( 'approved' == doc.nunaliit_submission.state ) {
			emit(doc._id,null);

		} else if( 'resolved' == doc.nunaliit_submission.state ) {
			emit(doc._id,null);

		} else if( doc.nunaliit_submission 
		 && doc.nunaliit_submission.denial_email
		 && doc.nunaliit_submission.denial_email.requested
		 && !doc.nunaliit_submission.denial_email.sent ) {
			emit(doc._id,null);
		};
	};
}
