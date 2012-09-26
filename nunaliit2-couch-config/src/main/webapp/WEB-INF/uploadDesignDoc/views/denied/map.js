function(doc) {
	
	if( doc 
	 && doc.nunaliit_attachments 
	 && doc.nunaliit_attachments.files
	 ) {
		for(var attachmentName in doc.nunaliit_attachments.files) {
			var file = doc.nunaliit_attachments.files[attachmentName];
			if( file && file.status === 'denied' ) {
				if( !file.source ) { // do not emit derived thumbnail
					emit(attachmentName, null);
				};
			};
		};
	};
};