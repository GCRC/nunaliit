function(doc){
	if( doc 
	 && doc.nunaliit_type === 'document_submission' 
	 && doc.nunaliit_submission 
	 && doc.nunaliit_submission.state === 'waiting_for_approval' 
	 && doc.nunaliit_submission.submitted_doc 
	 && doc.nunaliit_submission.submitted_doc.nunaliit_attachments 
	 && doc.nunaliit_submission.submitted_doc.nunaliit_attachments.files ){
		for(var attachmentName in doc.nunaliit_submission.submitted_doc.nunaliit_attachments.files){
			var file = doc.nunaliit_submission.submitted_doc.nunaliit_attachments.files[attachmentName];

			// Waiting for upload
			if( file.status === 'waiting for upload'
			 && file.uploadId ) {
				emit([file.status, file.uploadId], null);
			};

			// Work based on file status
			if( file.status === 'submitted'
			 || file.status === 'submitted_inline'
			 || file.status === 'analyzed' ) {
				emit([file.status, attachmentName], null);
			};
		};
	};
}
