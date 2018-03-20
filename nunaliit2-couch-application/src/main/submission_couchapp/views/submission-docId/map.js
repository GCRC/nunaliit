function(doc){
	if( doc 
	 && doc.nunaliit_type === 'document_submission' 
	 && doc.nunaliit_submission ) {
		var state = doc.nunaliit_submission.state;
		if( !state ){
			state = 'submitted';
		};

		if( doc.nunaliit_submission.submitted_reserved 
		 && doc.nunaliit_submission.submitted_reserved.id ){
			emit(doc.nunaliit_submission.submitted_reserved.id,state);
		};
	};
}
