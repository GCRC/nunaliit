function(doc){
	if( doc 
	 && doc.nunaliit_type === 'document_submission' 
	 && doc.nunaliit_submission ) {
		if( !doc.nunaliit_submission.state ){
			emit('submitted',null);
		} else {
			emit(doc.nunaliit_submission.state,null);
		};
	};
}
