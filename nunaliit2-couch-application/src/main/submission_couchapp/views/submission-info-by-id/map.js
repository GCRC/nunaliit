function(doc){
	if( doc 
	 && doc.nunaliit_type === 'document_submission' 
	 && doc.nunaliit_submission ) {
		var state = doc.nunaliit_submission.state;
		if( !state ){
			state = 'submitted';
		};

		var docId = undefined;
		if( doc.nunaliit_submission.submitted_reserved 
		 && doc.nunaliit_submission.submitted_reserved.id ){
			docId = doc.nunaliit_submission.submitted_reserved.id;
		} else if( doc.nunaliit_submission.original_reserved 
		        && doc.nunaliit_submission.original_reserved.id ) {
			docId = doc.nunaliit_submission.original_reserved.id;
		};

		var deviceId = undefined;
		if( doc.nunaliit_submission.deviceId ){
			deviceId = doc.nunaliit_submission.deviceId;
		};
		
		emit(doc._id, {
			submissionId: doc._id,
			state: state,
			docId: docId,
			deviceId: deviceId
		});
	};
}
