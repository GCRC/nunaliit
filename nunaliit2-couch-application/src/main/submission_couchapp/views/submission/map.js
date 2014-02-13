function(doc){
	if( doc && doc.nunaliit_type === 'document_submission' ){
		emit(doc._id,null);
	};
}
