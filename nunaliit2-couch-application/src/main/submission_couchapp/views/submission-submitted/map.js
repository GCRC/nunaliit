function(doc){
	if( doc 
	 && doc.nunaliit_type === 'document_submission' 
	 && doc.nunaliit_submission
	 && !doc.nunaliit_submission.state ){
		emit(doc._id,null);
	};
}
