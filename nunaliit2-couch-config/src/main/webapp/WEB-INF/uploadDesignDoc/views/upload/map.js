function(doc) {
	
	var allStatus = {};
	if( doc 
	 && doc.nunaliit_attachments 
	 && doc.nunaliit_attachments.files
	 ) {
		for(var attachmentName in doc.nunaliit_attachments.files) {
			var file = doc.nunaliit_attachments.files[attachmentName];
			if( file && file.status ) {
				allStatus[file.status] = true;
			};
		};
	};
	
	for(var status in allStatus ) {
		emit(status, null);
	};
};