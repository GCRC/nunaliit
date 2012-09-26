function(doc){
	if( doc.nunaliit_attachments
	 && doc.nunaliit_attachments.files 
	 ) {
		for(var attName in doc.nunaliit_attachments.files){
			emit(attName, null);
		};
	};
}